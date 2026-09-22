export type Variant = {
  id: string;
  productSlug: string;
  size: string;
  dietary: string;
  priceCents: number;
  currency: string;
  active: boolean;
};

// All callers must supply the published catalogue.

export function findVariant(
  variants: readonly Variant[],
  slug: string,
  size: string,
  dietary: string,
) {
  return variants.find(
    (variant) =>
      variant.active &&
      variant.productSlug === slug &&
      variant.size === size &&
      variant.dietary === dietary,
  );
}

export type Selection = { variantId: string; quantity: number };
export type QuoteLine = Selection & {
  productSlug: string;
  unitPriceCents: number;
  lineTotalCents: number;
};
export type Quote = {
  currency: "USD";
  lines: QuoteLine[];
  subtotalCents: number;
};

export class CommerceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CommerceError";
  }
}

export function parseSelections(input: unknown): Selection[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 50)
    throw new CommerceError("INVALID_CART", "Choose between 1 and 50 items.");
  const combined = new Map<string, number>();
  for (const item of input) {
    if (
      !item ||
      typeof item !== "object" ||
      Object.keys(item).some(
        (key) => !["variantId", "quantity"].includes(key),
      ) ||
      typeof item.variantId !== "string" ||
      item.variantId.length > 160 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    )
      throw new CommerceError(
        "INVALID_ITEM",
        "Each item needs a variant and a whole quantity from 1 to 99.",
      );
    const quantity = (combined.get(item.variantId) ?? 0) + item.quantity;
    if (quantity > 99)
      throw new CommerceError(
        "QUANTITY_LIMIT",
        "Choose no more than 99 of one variant.",
      );
    combined.set(item.variantId, quantity);
  }
  return Array.from(combined, ([variantId, quantity]) => ({
    variantId,
    quantity,
  }));
}

// Shared calculation only. The server supplies its own catalogue and stock.
export function quoteCart(
  input: unknown,
  catalogue: readonly Variant[],
  available: Readonly<Record<string, number>>,
): Quote {
  const lines = parseSelections(input).map(({ variantId, quantity }) => {
    const variant = catalogue.find(
      (entry) => entry.id === variantId && entry.active,
    );
    if (!variant)
      throw new CommerceError(
        "UNAVAILABLE_VARIANT",
        "An item is no longer available. Please update your bag.",
      );
    if (
      !Number.isSafeInteger(variant.priceCents) ||
      variant.priceCents < 0 ||
      variant.currency !== "USD"
    )
      throw new CommerceError(
        "INVALID_PRICE",
        "This item's price needs to be reviewed.",
      );
    const stock = available[variantId];
    if (!Number.isSafeInteger(stock) || stock < quantity)
      throw new CommerceError(
        "INSUFFICIENT_STOCK",
        `Not enough sample stock for ${variant.productSlug} (${variant.size}, ${variant.dietary}).`,
      );
    const lineTotalCents = variant.priceCents * quantity;
    if (!Number.isSafeInteger(lineTotalCents))
      throw new CommerceError(
        "INVALID_PRICE",
        "This item's price needs to be reviewed.",
      );
    return {
      variantId,
      quantity,
      productSlug: variant.productSlug,
      unitPriceCents: variant.priceCents,
      lineTotalCents,
    };
  });
  const subtotalCents = lines.reduce(
    (total, line) => total + line.lineTotalCents,
    0,
  );
  if (!Number.isSafeInteger(subtotalCents))
    throw new CommerceError(
      "INVALID_PRICE",
      "The cart total needs to be reviewed.",
    );
  return { currency: "USD", lines, subtotalCents };
}
