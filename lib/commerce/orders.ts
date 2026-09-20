import { CommerceError, quoteCart, type Quote, type Variant } from "./catalog";

export type Stock = { onHand: number; reserved: number };
export type Order = {
  id: string;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  quote: Quote;
  paymentId?: string;
};
export type CommerceState = {
  stock: Record<string, Stock>;
  orders: Order[];
};

export function availableStock(state: CommerceState) {
  return Object.fromEntries(
    Object.entries(state.stock).map(([id, stock]) => [
      id,
      stock.onHand - stock.reserved,
    ]),
  );
}

// Pure transitions: a future database adapter MUST run each transition in one
// transaction with stock row locks and unique order/payment IDs. This module
// alone does not provide cross-request locking, persistence, or authentication.
export function reserveOrder(
  state: CommerceState,
  id: string,
  input: unknown,
  catalogue: readonly Variant[],
): CommerceState {
  if (!id || state.orders.some((order) => order.id === id))
    throw new CommerceError("DUPLICATE_ORDER", "Use a unique order reference.");
  const quote = quoteCart(input, catalogue, availableStock(state));
  const next = structuredClone(state);
  for (const line of quote.lines)
    next.stock[line.variantId].reserved += line.quantity;
  next.orders.unshift({ id, status: "pending", quote });
  return next;
}

function findOrder(state: CommerceState, id: string) {
  const order = state.orders.find((entry) => entry.id === id);
  if (!order) throw new CommerceError("MISSING_ORDER", "Order not found.");
  return order;
}

// Call only after a payment adapter has verified the provider signature and
// mapped the payment to its order. The foundation quote excludes shipping/tax.
export function recordPayment(
  state: CommerceState,
  id: string,
  payment: { id: string; amountCents: number; currency: string },
): CommerceState {
  const current = findOrder(state, id);
  if (
    !payment.id ||
    payment.amountCents !== current.quote.subtotalCents ||
    payment.currency !== current.quote.currency
  )
    throw new CommerceError(
      "PAYMENT_MISMATCH",
      "Payment does not match this order.",
    );
  if (
    state.orders.some(
      (order) => order.id !== id && order.paymentId === payment.id,
    )
  )
    throw new CommerceError(
      "DUPLICATE_PAYMENT",
      "This payment is already linked to an order.",
    );
  if (
    (current.status === "paid" || current.status === "fulfilled") &&
    current.paymentId === payment.id
  )
    return state;
  if (current.status !== "pending")
    throw new CommerceError(
      "INVALID_TRANSITION",
      "This order cannot accept a payment update.",
    );
  const next = structuredClone(state);
  const order = findOrder(next, id);
  for (const line of order.quote.lines) {
    next.stock[line.variantId].onHand -= line.quantity;
    next.stock[line.variantId].reserved -= line.quantity;
  }
  order.status = "paid";
  order.paymentId = payment.id;
  return next;
}

export function cancelOrder(state: CommerceState, id: string): CommerceState {
  const current = findOrder(state, id);
  if (current.status === "cancelled") return state;
  if (current.status !== "pending")
    throw new CommerceError(
      "INVALID_TRANSITION",
      "Only unpaid reservations can be cancelled here.",
    );
  const next = structuredClone(state);
  const order = findOrder(next, id);
  for (const line of order.quote.lines)
    next.stock[line.variantId].reserved -= line.quantity;
  order.status = "cancelled";
  return next;
}

export function fulfillOrder(state: CommerceState, id: string): CommerceState {
  const current = findOrder(state, id);
  if (current.status === "fulfilled") return state;
  if (current.status !== "paid")
    throw new CommerceError(
      "INVALID_TRANSITION",
      "Only paid orders can be marked fulfilled.",
    );
  const next = structuredClone(state);
  findOrder(next, id).status = "fulfilled";
  return next;
}

export function adjustStock(
  state: CommerceState,
  variantId: string,
  onHand: number,
): CommerceState {
  const stock = state.stock[variantId];
  if (
    !stock ||
    !Number.isSafeInteger(onHand) ||
    onHand < stock.reserved ||
    onHand > 999999
  )
    throw new CommerceError(
      "INVALID_STOCK",
      "Stock must be a whole number, at least the reserved amount, and at most 999999.",
    );
  return {
    ...state,
    stock: { ...state.stock, [variantId]: { ...stock, onHand } },
  };
}
