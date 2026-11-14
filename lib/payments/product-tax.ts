import { CommerceError } from "../commerce/catalog";

type ProductTax =
  | { code: string; category: string; review?: never }
  | { code?: never; category?: never; review: string };

// Exact identifiers/categories checked against Stripe's Tax Codes API 2026-11-14.
// Source facts and remaining questions: docs/sales-tax-setup-review-2026-11-14.md.
// Keep this server-side. A new/changed product needs review; there is no preset fallback.
export const productTax: Readonly<Record<string, ProductTax>> = {
  "i-rock-with-iya-yusufs-pantry-shirt": {
    code: "txcd_30011000",
    category: "Clothing & Footwear",
  },
  "my-roots-have-flavor-shirt": {
    code: "txcd_30011000",
    category: "Clothing & Footwear",
  },
  "pantry-people-cap": { code: "txcd_30060006", category: "Hats" },
  "palm-oil": { code: "txcd_40020002", category: "Edible Oils" },
  "ground-pepper": { code: "txcd_40020007", category: "Seasonings" },
  "suya-spice": { code: "txcd_40020007", category: "Seasonings" },
  "pepper-soup-spice": { code: "txcd_40020007", category: "Seasonings" },
  "white-garri": {
    code: "txcd_40040000",
    category: "Food for Non-Immediate Consumption",
  },
  "yam-flour": {
    code: "txcd_40040000",
    category: "Food for Non-Immediate Consumption",
  },
  "honey-beans": { code: "txcd_40040019", category: "Vegetables" },
  "tiger-nuts": { code: "txcd_40040019", category: "Vegetables" },
  "ground-egusi": {
    code: "txcd_40040000",
    category: "Food for Non-Immediate Consumption",
  },
  ogbono: {
    code: "txcd_40040000",
    category: "Food for Non-Immediate Consumption",
  },
  "dried-hibiscus": {
    code: "txcd_40040000",
    category: "Food for Non-Immediate Consumption",
  },
  "nigerian-dates": {
    code: "txcd_40400005",
    category: "Dried Fruit - Unsweetened",
  },
  "dried-crayfish": {
    code: "txcd_40040000",
    category: "Food for Non-Immediate Consumption",
  },
  "smoked-catfish": {
    code: "txcd_40040000",
    category: "Food for Non-Immediate Consumption",
  },
  "coconut-candy-crunch": { code: "txcd_40100001", category: "Candy" },
  "zobo-drink": {
    code: "txcd_41040003",
    category: "Bottled Tea - Non-Carbonated - Sweetened",
  },
  "classic-chin-chin": {
    review:
      "Confirm the fried dough snack category and serving/presentation details.",
  },
  donkwa: {
    review:
      "Confirm the cornmeal/peanut confection category and serving/presentation details.",
  },
  kulikuli: {
    review:
      "Confirm the sweetened peanut snack category and serving/presentation details.",
  },
  "lightly-salted-roasted-groundnut": {
    review:
      "Confirm multi-serving package declaration and absence of eating utensils.",
  },
  "tiger-nut-drink": {
    review: "Confirm whether this product is marketed as a milk substitute.",
  },
};

export function productTaxCode(slug: string): string {
  const entry = Object.hasOwn(productTax, slug) ? productTax[slug] : undefined;
  if (!entry?.code)
    throw new CommerceError(
      "TAX_REVIEW_REQUIRED",
      "An item is awaiting tax setup. Please contact the shop before ordering.",
    );
  return entry.code;
}
