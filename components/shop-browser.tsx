"use client";
import { useState } from "react";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import {
  EmptyState,
  FilterChips,
  PageHeading,
  ProductGrid,
  SearchField,
} from "@/components/catalog";
import { Button } from "@/components/ui/button";
export function ShopBrowser({
  initialCategory = "All",
}: {
  initialCategory?: string;
}) {
  const [category, setCategory] = useState(
    categories.find((c) => c.slug === initialCategory)?.name ?? "All",
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const filtered = products.filter(
    (p) =>
      (category === "All" ||
        categories.find((c) => c.slug === p.category)?.name === category) &&
      [p.name, p.description, p.dietary?.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (sort === "price-low") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-high") filtered.sort((a, b) => b.price - a.price);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow="YOUR NEXT PANTRY FAVORITE"
        title="Good food starts here."
        description="Familiar staples, satisfying snacks, and a few new discoveries. Make yourself at home."
      />
      <div className="catalog-toolbar">
        <SearchField value={query} onChange={setQuery} />
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500" aria-live="polite">
            {filtered.length} products
          </span>
          <label className="sr-only" htmlFor="sort">
            Sort products
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to high</option>
            <option value="price-high">Price: High to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>
      </div>
      <FilterChips
        options={categories.map((c) => c.name)}
        value={category}
        onChange={setCategory}
      />
      <p className="fine-print mb-7">
        Illustrative catalog · Products, prices, dietary labels, and
        availability need client approval.
      </p>
      {filtered.length ? (
        <ProductGrid items={filtered} />
      ) : (
        <EmptyState
          title="No pantry finds just yet"
          description="Try a different search or explore another category."
        >
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
          >
            Reset filters
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
