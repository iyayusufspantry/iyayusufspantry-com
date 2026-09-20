import { variants } from "./catalog";
import {
  recordPayment,
  reserveOrder,
  fulfillOrder,
  type CommerceState,
} from "./orders";

// Development fixtures only. Never use this as production stock or order storage.
export function sampleStock() {
  return Object.fromEntries(
    variants.map((variant) => [
      variant.id,
      {
        onHand:
          variant.productSlug === "dried-hibiscus"
            ? 0
            : variant.productSlug === "classic-chin-chin"
              ? 6
              : 24,
        reserved: 0,
      },
    ]),
  );
}

export function sampleOwnerState(): CommerceState {
  let state: CommerceState = { stock: sampleStock(), orders: [] };
  const examples = [
    {
      id: "SIM-DEMO-001",
      variantId: "plantain-chips:Small:Vegan",
      quantity: 2,
      status: "paid",
    },
    {
      id: "SIM-DEMO-002",
      variantId: "classic-chin-chin:Small:Vegetarian",
      quantity: 1,
      status: "pending",
    },
    {
      id: "SIM-DEMO-003",
      variantId: "white-garri:Small:Vegan",
      quantity: 1,
      status: "fulfilled",
    },
  ];
  for (const example of examples) {
    state = reserveOrder(
      state,
      example.id,
      [{ variantId: example.variantId, quantity: example.quantity }],
      variants,
    );
    if (example.status !== "pending") {
      state = recordPayment(state, example.id, {
        id: `sample-payment-${example.id}`,
        amountCents: state.orders[0].quote.subtotalCents,
        currency: "USD",
      });
      if (example.status === "fulfilled")
        state = fulfillOrder(state, example.id);
    }
  }
  return state;
}
