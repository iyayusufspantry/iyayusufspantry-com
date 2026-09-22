"use client";
import { useContent } from "@/components/content-provider";
import { useState } from "react";

import {
  BlogCard,
  EmptyState,
  PageHeading,
  ProductGrid,
  RecipeCard,
  SearchField,
  SectionHeading,
} from "@/components/catalog";
import { Button } from "@/components/ui/button";
export function SiteSearch() {
  const { products, recipes, posts, copy: allCopy } = useContent();
  const copy = allCopy["components/site-search.tsx"];

  const [query, setQuery] = useState("");
  const normalized = query.toLowerCase().trim();
  const match = (text: string) => text.toLowerCase().includes(normalized);
  const foundProducts = products.filter((p) =>
    match(`${p.name} ${p.description}`),
  );
  const foundRecipes = recipes.filter((r) =>
    match(`${r.title} ${r.description} ${r.ingredients.join(" ")}`),
  );
  const foundPosts = posts.filter((p) =>
    match(
      `${p.title} ${p.description} ${p.sections.map((s) => s.text).join(" ")}`,
    ),
  );
  const count = foundProducts.length + foundRecipes.length + foundPosts.length;
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow={copy["copy-1"]}
        title={copy["copy-2"]}
        description={copy["copy-3"]}
      />
      <div className="global-search">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={copy["copy-4"]}
          label={copy["label-1"]}
        />
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs text-neutral-500 mr-2">
            {" "}
            {copy["copy-5"]}{" "}
          </span>
          {[copy["copy-6"], copy["copy-7"], copy["copy-8"]].map((term) => (
            <button className="badge" key={term} onClick={() => setQuery(term)}>
              {term}
            </button>
          ))}
        </div>
      </div>
      <p className="fine-print mt-6" aria-live="polite">
        {normalized
          ? copy["template-2"]
              .replaceAll("{0}", String(count))
              .replaceAll("{1}", String(query))
          : copy["copy-9"]}{" "}
        {copy["copy-10"]}{" "}
      </p>
      {!count ? (
        <EmptyState title={copy["copy-11"]} description={copy["copy-12"]}>
          <Button variant="outline" onClick={() => setQuery("")}>
            {" "}
            {copy["copy-13"]}{" "}
          </Button>
        </EmptyState>
      ) : (
        <>
          {foundProducts.length > 0 && (
            <section className="section">
              <SectionHeading
                title={copy["copy-14"]}
                description={copy["template-3"].replaceAll(
                  "{0}",
                  String(normalized ? foundProducts.length : copy["copy-15"]),
                )}
                href="/shop"
                action={copy["copy-16"]}
              />
              <ProductGrid
                items={normalized ? foundProducts : foundProducts.slice(0, 4)}
              />
            </section>
          )}
          {foundRecipes.length > 0 && (
            <section className="section border-t border-neutral-200">
              <SectionHeading
                title={copy["copy-17"]}
                href="/recipes"
                action={copy["copy-18"]}
              />
              <div className="editorial-grid">
                {(normalized ? foundRecipes : foundRecipes.slice(0, 3)).map(
                  (recipe, index) => (
                    <RecipeCard
                      key={recipe.slug}
                      recipe={recipe}
                      index={index}
                    />
                  ),
                )}
              </div>
            </section>
          )}
          {foundPosts.length > 0 && (
            <section className="section border-t border-neutral-200">
              <SectionHeading
                title={copy["copy-19"]}
                href="/blog"
                action={copy["copy-20"]}
              />
              <div className="editorial-grid">
                {(normalized ? foundPosts : foundPosts.slice(0, 3)).map(
                  (post, index) => (
                    <BlogCard key={post.slug} post={post} index={index} />
                  ),
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
