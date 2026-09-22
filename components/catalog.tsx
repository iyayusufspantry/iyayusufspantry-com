"use client";
import type { Category } from "@/lib/content/types";
import { useContent } from "@/components/content-provider";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Clock,
  BookOpen,
  Package,
  Wheat,
  Cookie,
  CookingPot,
  Sprout,
  SlidersHorizontal,
  Minus,
  Search,
  ShoppingBag,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/components/cart-provider";

import { money, type Product } from "@/data/products";
import type { Recipe } from "@/data/recipes";
import type { Post } from "@/data/posts";
import { cn } from "@/lib/utils";
import { type BrandPhoto } from "@/data/brand-assets";

const icons = {
  snacks: Cookie,
  pantry: CookingPot,
  grains: Wheat,
  spices: Sprout,
  specialty: Package,
};
export function MockImage({
  label: suppliedlabel,
  kind = "product",
  className,
  index = 0,
  photo,
}: {
  label?: string;
  kind?: "product" | "hero" | "recipe" | "story" | "article";
  className?: string;
  index?: number;
  photo?: BrandPhoto;
}) {
  const { productPhotos, copy: allCopy } = useContent();
  const copy = allCopy["components/catalog.tsx"];
  const label = suppliedlabel ?? copy["default-1"];

  const suppliedPhoto =
    photo ?? (kind === "product" ? productPhotos[label] : undefined);
  const Illustration =
    kind === "recipe" ? CookingPot : kind === "article" ? BookOpen : Sprout;
  if (suppliedPhoto) {
    return (
      <div
        className={cn("mock-image brand-photograph", `mock-${kind}`, className)}
      >
        <Image
          src={suppliedPhoto.src}
          alt={suppliedPhoto.alt}
          fill
          sizes={
            kind === "hero" ||
            kind === "story" ||
            className?.includes("product-main-image") ||
            className?.includes("editorial-hero")
              ? "(max-width: 1000px) 100vw, 60vw"
              : "(max-width: 767px) 50vw, 33vw"
          }
          className="brand-photo"
          preload={kind === "hero"}
        />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={copy["template-2"].replaceAll("{0}", String(label))}
      className={cn(
        "mock-image",
        `mock-${kind}`,
        `mock-tone-${index % 4}`,
        className,
      )}
    >
      <div className="mock-image-center">
        <span className="illustration-frame" aria-hidden="true">
          <Illustration strokeWidth={1.2} size={46} />
        </span>
        <span>{label}</span>
      </div>
      <span className="mock-image-caption">{copy["copy-2"]}</span>
      {kind === "hero" && (
        <>
          <span className="image-corner top-left" />
          <span className="image-corner bottom-right" />
        </>
      )}
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/catalog.tsx"];

  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {action ?? copy["copy-3"]}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
export function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/catalog.tsx"];

  const Icon = icons[category.icon as keyof typeof icons];
  return (
    <Link href={`/shop?category=${category.slug}`} className="category-card">
      <div className="flex items-start justify-between">
        <Icon strokeWidth={1.25} size={30} />
        <span className="category-index">
          {copy["copy-4"]}
          {index + 1}
        </span>
      </div>
      <div>
        <h3>{category.name}</h3>
        <p>{category.description}</p>
      </div>
      <ArrowUpRight size={17} className="category-arrow" />
    </Link>
  );
}
export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { categories, copy: allCopy } = useContent();
  const copy = allCopy["components/catalog.tsx"];

  const add = useAddToCart();
  return (
    <article className="product-card">
      <Link
        href={`/shop/${product.slug}`}
        className="product-image-link"
        aria-label={copy["template-3"].replaceAll("{0}", String(product.name))}
      >
        <MockImage label={product.name} index={index} />
        {product.dietary?.[0] && (
          <span className="dietary-badge">{product.dietary[0]}</span>
        )}
      </Link>
      <div className="product-meta">
        <span>{categories.find((c) => c.slug === product.category)?.name}</span>
        {product.sizes && (
          <span>
            {product.sizes.length} {copy["copy-5"]}
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3>
          <Link href={`/shop/${product.slug}`}>{product.name}</Link>
        </h3>
        <span className="product-price">{money(product.price)}</span>
      </div>
      <p className="product-unit">
        {product.sizes ? copy["copy-6"] : ""}
        {product.unit} {copy["copy-7"]}{" "}
      </p>
      <div className="product-actions">
        <Link className="text-link text-xs!" href={`/shop/${product.slug}`}>
          {" "}
          {copy["copy-8"]} <ArrowUpRight size={13} />
        </Link>
        <Button
          variant="outline"
          size="sm"
          aria-label={copy["template-4"].replaceAll(
            "{0}",
            String(product.name),
          )}
          onClick={() => add(product)}
        >
          <Plus size={14} /> {copy["copy-9"]}{" "}
        </Button>
      </div>
    </article>
  );
}
export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="product-grid">
      {items.map((p, i) => (
        <ProductCard key={p.slug} product={p} index={i} />
      ))}
    </div>
  );
}
export function RecipeCard({
  recipe,
  index = 0,
}: {
  recipe: Recipe;
  index?: number;
}) {
  const { products, recipePhotos, copy: allCopy } = useContent();
  const copy = allCopy["components/catalog.tsx"];

  return (
    <article className="editorial-card">
      <Link
        href={`/recipes/${recipe.slug}`}
        aria-label={copy["template-5"].replaceAll("{0}", String(recipe.title))}
      >
        <MockImage
          label={recipe.category}
          kind="recipe"
          index={index}
          photo={recipePhotos[recipe.slug]}
        />
      </Link>
      <div className="flex items-center justify-between gap-3 pt-5">
        <span className="eyebrow mb-0!">{recipe.category}</span>
        <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
          <Clock size={13} />
          {recipe.time}
        </span>
      </div>
      <h3>
        <Link href={`/recipes/${recipe.slug}`}>{recipe.title}</Link>
      </h3>
      <p>{recipe.description}</p>
      {recipe.products[0] && (
        <Link
          className="recipe-product-link"
          href={`/shop/${recipe.products[0]}`}
        >
          <ShoppingBag size={12} /> {copy["copy-10"]}{" "}
          {
            products.find((product) => product.slug === recipe.products[0])
              ?.name
          }
        </Link>
      )}
      <Link className="text-link mt-4" href={`/recipes/${recipe.slug}`}>
        {" "}
        {copy["copy-11"]} <ArrowUpRight size={14} />
      </Link>
    </article>
  );
}
export function BlogCard({ post, index = 0 }: { post: Post; index?: number }) {
  const { journalPhotos, copy: allCopy } = useContent();
  const copy = allCopy["components/catalog.tsx"];

  return (
    <article className="editorial-card">
      <Link
        href={`/blog/${post.slug}`}
        aria-label={copy["template-6"].replaceAll("{0}", String(post.title))}
      >
        <MockImage
          label={post.category}
          kind="article"
          index={index}
          photo={journalPhotos[post.slug]}
        />
      </Link>
      <span className="eyebrow mt-5">{post.category}</span>
      <h3>
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      <p>{post.description}</p>
      <div className="mt-5 flex items-center justify-between text-xs text-neutral-500">
        <span>
          {post.date} {copy["copy-12"]}
        </span>
        <Link
          href={`/blog/${post.slug}`}
          aria-label={copy["template-7"].replaceAll("{0}", String(post.title))}
        >
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </article>
  );
}
export function QuantitySelector({
  value,
  onChange,
  label: suppliedlabel,
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const copy = useContent().copy["components/catalog.tsx"];
  const label = suppliedlabel ?? copy["default-8"];

  return (
    <div className="quantity-selector" role="group" aria-label={label}>
      <button
        type="button"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        aria-label={copy["template-9"].replaceAll(
          "{0}",
          String(label.toLowerCase()),
        )}
      >
        <Minus size={14} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        disabled={value >= 99}
        onClick={() => onChange(value + 1)}
        aria-label={copy["template-10"].replaceAll(
          "{0}",
          String(label.toLowerCase()),
        )}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <ShoppingBag size={32} strokeWidth={1.25} />
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder: suppliedplaceholder,
  label: suppliedlabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const copy = useContent().copy["components/catalog.tsx"];
  const placeholder = suppliedplaceholder ?? copy["default-11"];
  const label = suppliedlabel ?? copy["default-12"];

  return (
    <div className="search-field">
      <Search size={17} />
      <input
        aria-label={label}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { copy: allCopy } = useContent();
  const copy = allCopy["components/catalog.tsx"];

  return (
    <div className="filter-chips" aria-label={copy["copy-16"]}>
      <SlidersHorizontal size={16} className="mr-2 shrink-0 text-neutral-500" />
      {["All", ...options].map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option === "All" ? copy["copy-17"] : option}
        </button>
      ))}
    </div>
  );
}
