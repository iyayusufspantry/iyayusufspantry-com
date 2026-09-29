"use client";
import { useContent } from "@/components/content-provider";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Truck,
  ShoppingBag,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProductGrid,
  QuantitySelector,
  SectionHeading,
  RecipeCard,
} from "@/components/catalog";
import { useAddToCart } from "@/components/cart-provider";
import { money, productPrice, type Product } from "@/data/products";
import { ProductGallery } from "@/components/product-gallery";

export function ProductVariantSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/product-detail.tsx"];

  return (
    <fieldset className="variant-field">
      <legend>
        {label}{" "}
        <span className="font-normal text-neutral-500">
          {copy["copy-1"]} {value}
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
            className="variant-option"
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
export function ProductDetail({ product }: { product: Product }) {
  const { productGalleries } = useContent();
  const gallery = productGalleries[product.slug] ?? [];
  const { variants } = useContent();

  const {
    products,
    categories,
    recipes,
    productPhotos,
    copy: allCopy,
  } = useContent();
  const copy = allCopy["components/product-detail.tsx"];

  const [size, setSize] = useState(product.sizes?.[0] ?? "Standard");
  const [dietary, setDietary] = useState(product.dietary?.[0] ?? "Standard");
  const [quantity, setQuantity] = useState(1);
  const galleryLabels = gallery.length
    ? gallery.map((p) => p.alt)
    : [copy["copy-7"], copy["copy-8"], copy["copy-9"]];
  const add = useAddToCart();
  const router = useRouter();
  const selectedVariant = variants.find(
    (v) =>
      v.productSlug === product.slug &&
      v.size === size &&
      v.dietary === dietary &&
      v.active,
  );
  const category = categories.find((c) => c.slug === product.category)!;
  const recipe = recipes.find((r) => r.slug === product.recipe);
  return (
    <div className="site-container page-bottom">
      <nav className="breadcrumb" aria-label={copy["copy-4"]}>
        <Link href="/">{copy["copy-5"]}</Link>
        <ChevronRight />
        <Link href="/shop">{copy["copy-6"]}</Link>
        <ChevronRight />
        <Link href={`/shop?category=${category.slug}`}>{category.name}</Link>
        <ChevronRight />
        <span>{product.name}</span>
      </nav>
      <div className="product-detail-grid">
        <div className="product-gallery-column">
          <ProductGallery
            photos={gallery}
            labels={galleryLabels}
            productName={product.name}
            viewImageLabel={copy["template-1"]}
          />
          {!product.approved && (
            <p className="fine-print mt-4">
              {productPhotos[product.name] ? copy["copy-10"] : copy["copy-11"]}
            </p>
          )}
        </div>
        <div className="product-detail-copy">
          <span className="eyebrow">{category.name}</span>
          <h1>{product.name}</h1>
          <div className="mt-5 flex items-center gap-4">
            <span className="text-2xl font-medium">
              {selectedVariant
                ? money(productPrice(variants, product, size, dietary))
                : "—"}
            </span>
            <span className="text-xs text-neutral-500">
              {" "}
              {!product.approved && copy["copy-12"]}{" "}
              {product.sizes?.length === 1 ||
              size === "Standard" ||
              size === "Small"
                ? product.unit
                : copy["template-2"].replaceAll("{0}", String(size))}
            </span>
          </div>
          <p className="mt-6 text-neutral-500 leading-7">
            {product.description}
          </p>
          {!product.approved && (
            <div className="my-6 flex items-center gap-2 text-xs">
              <Check size={14} /> {copy["copy-15"]}{" "}
            </div>
          )}
          {product.sizes && product.sizes.length > 1 && (
            <ProductVariantSelector
              label={copy["label-3"]}
              options={product.sizes}
              value={size}
              onChange={setSize}
            />
          )}
          {product.dietary &&
            product.dietary.some((option) => option !== "Standard") && (
              <ProductVariantSelector
                label={copy["label-4"]}
                options={product.dietary}
                value={dietary}
                onChange={setDietary}
              />
            )}
          <div className="mt-7 flex gap-3">
            <QuantitySelector value={quantity} onChange={setQuantity} />
            <Button
              className="flex-1"
              disabled={!selectedVariant}
              onClick={() => add(product, quantity, size, dietary)}
            >
              <ShoppingBag /> {copy["copy-16"]}{" "}
            </Button>
          </div>
          <Button
            variant="outline"
            className="mt-3 w-full"
            disabled={!selectedVariant}
            onClick={() => {
              add(product, quantity, size, dietary);
              router.push("/checkout");
            }}
          >
            {" "}
            {copy["copy-17"]} <ArrowRight />
          </Button>
          <div className="product-service-note">
            <Truck size={18} />
            <div>
              {" "}
              {copy["copy-18"]} <span>{copy["copy-19"]}</span>
            </div>
          </div>
          {!product.approved && (
            <p className="fine-print"> {copy["copy-20"]} </p>
          )}
        </div>
      </div>
      <div className="product-info-grid">
        <section>
          <h2>{copy["copy-21"]}</h2>
          <p>{product.description}</p>
          {product.ingredients && <p>{product.ingredients}</p>}
          {product.allergens && <p>{product.allergens}</p>}
          <p>
            {" "}
            {!product.approved && copy["copy-22"]} {product.unit}
            {!product.approved && copy["copy-23"]}{" "}
          </p>
        </section>
        <section>
          <h2>{copy["copy-24"]}</h2>
          <p>{product.usage}</p>
        </section>
        <section>
          <h2>{copy["copy-25"]}</h2>
          <p> {copy["copy-26"]} </p>
          <Link href="/shipping" className="text-link mt-3">
            {" "}
            {copy["copy-27"]} <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <section className="section">
        <SectionHeading
          eyebrow={copy["copy-28"]}
          title={copy["copy-29"]}
          href="/shop"
          action={copy["copy-30"]}
        />
        <ProductGrid
          items={products
            .filter((p) => p.slug !== product.slug)
            .sort(
              (a, b) =>
                Number(b.category === product.category) -
                Number(a.category === product.category),
            )
            .slice(0, 4)}
        />
      </section>
      {recipe && (
        <section className="related-recipe-block">
          <div>
            <Leaf strokeWidth={1.3} size={25} />
            <span className="eyebrow mt-4">{copy["copy-31"]}</span>
            <h2>
              {" "}
              {copy["copy-32"]} <br /> {copy["copy-33"]}{" "}
            </h2>
            <p className="mt-4 max-w-md text-neutral-500">
              {" "}
              {copy["copy-34"]}{" "}
            </p>
          </div>
          <RecipeCard recipe={recipe} />
        </section>
      )}
    </div>
  );
}
