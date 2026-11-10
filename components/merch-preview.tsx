"use client";

import { ProductGallery } from "@/components/product-gallery";
import { useContent } from "@/components/content-provider";
import { useAddToCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { money, type Product } from "@/data/products";
import type { Variant } from "@/lib/commerce/catalog";
import { useState } from "react";
import Link from "next/link";
import type { SiteContent } from "@/lib/content/types";

export function MerchPreview({
  items,
}: {
  items: SiteContent["merchPreviews"];
}) {
  const { products, variants } = useContent();
  const hasSaleItems = items.some((item) =>
    variants.some(
      (variant) => variant.productSlug === item.slug && variant.active,
    ),
  );
  return (
    <section className="merch-preview" aria-label="Merchandise">
      {!hasSaleItems && (
        <div className="merch-preview-note">
          <span>Coming soon</span>
          <p>These items are not yet available to order.</p>
        </div>
      )}
      <div className="merch-preview-grid">
        {items.map((item) => (
          <MerchCard
            key={item.slug}
            item={item}
            product={products.find((product) => product.slug === item.slug)}
            variants={variants.filter(
              (variant) => variant.productSlug === item.slug && variant.active,
            )}
          />
        ))}
      </div>
    </section>
  );
}

function MerchCard({
  item,
  product,
  variants,
}: {
  item: SiteContent["merchPreviews"][number];
  product?: Product;
  variants: Variant[];
}) {
  const [variantId, setVariantId] = useState("");
  const selected =
    variants.find((variant) => variant.id === variantId) ?? variants[0];
  const add = useAddToCart();
  return (
    <article className="merch-preview-card">
      <ProductGallery
        compact
        photos={item.photos}
        labels={item.photos.map((photo) => photo.alt)}
        productName={item.name}
        viewImageLabel="View {0}"
      />
      <div className="merch-preview-details">
        <h3>
          {product ? (
            <Link href={`/shop/${product.slug}`}>{item.name}</Link>
          ) : (
            item.name
          )}
        </h3>
        <p>{item.description}</p>
        {product && selected ? (
          <div className="merch-order-controls">
            <p className="merch-order-price">
              {money(selected.priceCents / 100)}
            </p>
            <label htmlFor={`merch-size-${item.slug}`}>Size</label>
            <select
              id={`merch-size-${item.slug}`}
              value={selected.id}
              onChange={(event) => setVariantId(event.target.value)}
            >
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.size}
                </option>
              ))}
            </select>
            <Button
              onClick={() => add(product, 1, selected.size, selected.dietary)}
              aria-label={`Add ${item.name} to bag`}
            >
              Add to bag
            </Button>
          </div>
        ) : (
          <>
            {item.priceCents !== undefined && (
              <p className="merch-preview-price">
                <strong>{money(item.priceCents / 100)}</strong>
              </p>
            )}
            {item.sizes.length > 0 && (
              <p className="merch-preview-sizes">
                <strong>{item.sizes.length === 1 ? "Size:" : "Sizes:"}</strong>{" "}
                {item.sizes.join(", ")}
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}
