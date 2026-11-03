"use client";

import { ProductGallery } from "@/components/product-gallery";
import type { SiteContent } from "@/lib/content/types";

export function MerchPreview({
  items,
}: {
  items: SiteContent["merchPreviews"];
}) {
  return (
    <section className="merch-preview" aria-label="Upcoming merchandise">
      <div className="merch-preview-note">
        <span>Coming soon</span>
        <p>These items are not yet available to order.</p>
      </div>
      <div className="merch-preview-grid">
        {items.map((item) => (
          <article className="merch-preview-card" key={item.slug}>
            <ProductGallery
              compact
              photos={item.photos}
              labels={item.photos.map((photo) => photo.alt)}
              productName={item.name}
              viewImageLabel="View {0}"
            />
            <div className="merch-preview-details">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              {item.sizes.length > 0 && (
                <p className="merch-preview-sizes">
                  <strong>Sizes:</strong> {item.sizes.join(", ")}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
