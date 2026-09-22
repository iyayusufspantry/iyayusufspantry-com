"use client";
import { useContent } from "@/components/content-provider";
import { useState } from "react";

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
  const { products, categories, copy: allCopy } = useContent();
  const copy = allCopy["components/shop-browser.tsx"];

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
        eyebrow={copy["copy-4"]}
        title={copy["copy-5"]}
        description={copy["copy-6"]}
      />
      <div className="catalog-toolbar">
        <SearchField value={query} onChange={setQuery} />
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500" aria-live="polite">
            {filtered.length} {copy["copy-7"]}{" "}
          </span>
          <label className="sr-only" htmlFor="sort">
            {" "}
            {copy["copy-8"]}{" "}
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">{copy["copy-9"]}</option>
            <option value="price-low">{copy["copy-10"]}</option>
            <option value="price-high">{copy["copy-11"]}</option>
            <option value="name">{copy["copy-12"]}</option>
          </select>
        </div>
      </div>
      <FilterChips
        options={categories.map((c) => c.name)}
        value={category}
        onChange={setCategory}
      />
      <p className="fine-print mb-7"> {copy["copy-13"]} </p>
      {filtered.length ? (
        <ProductGrid items={filtered} />
      ) : (
        <EmptyState title={copy["copy-14"]} description={copy["copy-15"]}>
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
          >
            {" "}
            {copy["copy-16"]}{" "}
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
