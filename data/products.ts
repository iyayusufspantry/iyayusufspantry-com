// Shared types and formatting only. All product values come from Contentful.
import { type Variant, findVariant } from "@/lib/commerce/catalog";
export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  sizes?: string[];
  dietary?: string[];
  unit: string;
  usage: string;
  recipe?: string;
  ingredients?: string;
  allergens?: string;
};
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
export function productPrice(
  variants: readonly Variant[],
  product: Product,
  size?: string,
  dietary?: string,
) {
  const variant = findVariant(
    variants,
    product.slug,
    size ?? product.sizes?.[0] ?? "Standard",
    dietary ?? product.dietary?.[0] ?? "Standard",
  );
  if (!variant) throw new Error("Unknown product variant");
  return variant.priceCents / 100;
}
