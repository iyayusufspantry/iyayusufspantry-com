"use client";
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
  MockImage,
  ProductGrid,
  QuantitySelector,
  SectionHeading,
  RecipeCard,
} from "@/components/catalog";
import { useAddToCart } from "@/components/cart-provider";
import { products, money, productPrice, type Product } from "@/data/products";
import { categories } from "@/data/categories";
import { recipes } from "@/data/recipes";
import { productPhotos } from "@/data/brand-assets";
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
  return (
    <fieldset className="variant-field">
      <legend>
        {label} <span className="font-normal text-neutral-500">— {value}</span>
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
  const [size, setSize] = useState(product.sizes?.[0] ?? "Standard");
  const [dietary, setDietary] = useState(product.dietary?.[0] ?? "Standard");
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState(0);
  const add = useAddToCart();
  const router = useRouter();
  const category = categories.find((c) => c.slug === product.category)!;
  const recipe = recipes.find((r) => r.slug === product.recipe);
  return (
    <div className="site-container page-bottom">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight />
        <Link href="/shop">Shop</Link>
        <ChevronRight />
        <Link href={`/shop?category=${category.slug}`}>{category.name}</Link>
        <ChevronRight />
        <span>{product.name}</span>
      </nav>
      <div className="product-detail-grid">
        <div>
          <MockImage
            label={
              [product.name, "Packaging detail", "Serving inspiration"][image]
            }
            className="product-main-image"
            index={image}
          />
          <div className="gallery-thumbnails">
            {["Product", "Packaging", "Serving"].map((label, i) => (
              <button
                type="button"
                key={label}
                onClick={() => setImage(i)}
                aria-label={`View ${label.toLowerCase()} image`}
                aria-pressed={image === i}
              >
                <MockImage
                  label={label}
                  index={i}
                  photo={i === 0 ? productPhotos[product.name] : undefined}
                />
              </button>
            ))}
          </div>
          <p className="fine-print mt-4">
            {productPhotos[product.name]
              ? "Client reference photo · Current packaging and additional views are being confirmed."
              : "Illustrative preview · Product photography is being prepared."}
          </p>
        </div>
        <div className="product-detail-copy">
          <span className="eyebrow">{category.name}</span>
          <h1>{product.name}</h1>
          <div className="mt-5 flex items-center gap-4">
            <span className="text-2xl font-medium">
              {money(productPrice(product, size, dietary))}
            </span>
            <span className="text-xs text-neutral-500">
              Sample price ·{" "}
              {size === "Standard" || size === "Small"
                ? product.unit
                : `${size} pack`}
            </span>
          </div>
          <p className="mt-6 text-neutral-500 leading-7">
            {product.description}
          </p>
          <div className="my-6 flex items-center gap-2 text-xs">
            <Check size={14} />
            Sample availability checked at checkout
          </div>
          {product.sizes && (
            <ProductVariantSelector
              label="Size"
              options={product.sizes}
              value={size}
              onChange={setSize}
            />
          )}
          {product.dietary && (
            <ProductVariantSelector
              label="Dietary option"
              options={product.dietary}
              value={dietary}
              onChange={setDietary}
            />
          )}
          <div className="mt-7 flex gap-3">
            <QuantitySelector value={quantity} onChange={setQuantity} />
            <Button
              className="flex-1"
              onClick={() => add(product, quantity, size, dietary)}
            >
              <ShoppingBag />
              Add to cart
            </Button>
          </div>
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => {
              add(product, quantity, size, dietary);
              router.push("/checkout");
            }}
          >
            Buy now — preview checkout
            <ArrowRight />
          </Button>
          <div className="product-service-note">
            <Truck size={18} />
            <div>
              Shipping details at checkout
              <span>Regions and rates to be confirmed.</span>
            </div>
          </div>
          <p className="fine-print">
            Sample product concept. Ingredients, allergens, dietary suitability,
            pack sizes, and final prices require client confirmation.
          </p>
        </div>
      </div>
      <div className="product-info-grid">
        <section>
          <h2>Product details</h2>
          <p>{product.description}</p>
          <p>
            Sample pack: {product.unit}. Final ingredient list, allergen
            information, origin, and storage instructions will be supplied by
            the client.
          </p>
        </section>
        <section>
          <h2>Preparation & usage</h2>
          <p>{product.usage}</p>
        </section>
        <section>
          <h2>Shipping information</h2>
          <p>
            Shipping regions, delivery estimates, and charges are still being
            scoped. No shipping promise is made in this prototype.
          </p>
          <Link href="/shipping" className="text-link mt-3">
            View shipping preview
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <section className="section">
        <SectionHeading
          eyebrow="KEEP EXPLORING"
          title="A few more pantry possibilities"
          href="/shop"
          action="Shop all products"
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
            <span className="eyebrow mt-4">PUT YOUR PANTRY TO WORK</span>
            <h2>
              Something good starts
              <br />
              with one ingredient.
            </h2>
            <p className="mt-4 max-w-md text-neutral-500">
              A little kitchen inspiration to help you bring this sample product
              to the table.
            </p>
          </div>
          <RecipeCard recipe={recipe} />
        </section>
      )}
    </div>
  );
}
