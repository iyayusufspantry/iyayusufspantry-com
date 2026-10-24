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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const merchEmpty =
    category === "Merch" &&
    !products.some((product) => product.category === "merch");
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
      <div className="catalog-toolbar shop-toolbar">
        <SearchField value={query} onChange={setQuery} />
        <div className="shop-toolbar-actions">
          <span
            className="shop-product-count"
            aria-live="polite"
            aria-atomic="true"
          >
            {filtered.length} {copy["copy-7"]}
          </span>
          <label className="sr-only" htmlFor="shop-sort">
            {copy["copy-8"]}
          </label>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger
              id="shop-sort"
              className="min-h-11 min-w-0 flex-[1_0_208px] rounded-lg bg-white px-3.5 py-2.5 data-[size=default]:h-auto"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="end"
              className="shop-sort-content rounded-xl"
            >
              <SelectItem value="featured">{copy["copy-9"]}</SelectItem>
              <SelectItem value="price-low">{copy["copy-10"]}</SelectItem>
              <SelectItem value="price-high">{copy["copy-11"]}</SelectItem>
              <SelectItem value="name">{copy["copy-12"]}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <FilterChips
        options={categories.map((c) => c.name)}
        value={category}
        onChange={setCategory}
      />
      {filtered.some((product) => !product.approved) && (
        <p className="fine-print mb-7"> {copy["copy-13"]} </p>
      )}
      {filtered.length ? (
        <ProductGrid items={filtered} />
      ) : (
        <EmptyState
          title={merchEmpty ? "Merch is on the way" : copy["copy-14"]}
          description={
            merchEmpty
              ? "Aprons, tote bags, T-shirts, hats and stickers will appear here when they are available."
              : copy["copy-15"]
          }
        >
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
