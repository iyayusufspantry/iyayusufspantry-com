"use client";
import { useState } from "react";
import { products } from "@/data/products";
import { recipes } from "@/data/recipes";
import { posts } from "@/data/posts";
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
        eyebrow="A LITTLE DISCOVERY STARTS HERE"
        title="What are you looking for?"
        description="Find a favorite product, your next recipe, or a story worth reading."
      />
      <div className="global-search">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Try plantain, egusi, or pantry…"
          label="Search products, recipes, and articles"
        />
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs text-neutral-500 mr-2">
            Try a little inspiration
          </span>
          {["Plantain", "Egusi", "Pantry"].map((term) => (
            <button className="badge" key={term} onClick={() => setQuery(term)}>
              {term}
            </button>
          ))}
        </div>
      </div>
      <p className="fine-print mt-6" aria-live="polite">
        {normalized
          ? `${count} results for “${query}”`
          : "Explore a few favorites, or search the complete sample collection."}{" "}
        · Local prototype search
      </p>
      {!count ? (
        <EmptyState
          title="No matches this time"
          description="Try a different ingredient, product name, or topic."
        >
          <Button variant="outline" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </EmptyState>
      ) : (
        <>
          {foundProducts.length > 0 && (
            <section className="section">
              <SectionHeading
                title="From the pantry"
                description={`${normalized ? foundProducts.length : "Featured"} sample products`}
                href="/shop"
                action="Browse the shop"
              />
              <ProductGrid
                items={normalized ? foundProducts : foundProducts.slice(0, 4)}
              />
            </section>
          )}
          {foundRecipes.length > 0 && (
            <section className="section border-t border-neutral-200">
              <SectionHeading
                title="In the kitchen"
                href="/recipes"
                action="All recipes"
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
                title="From the journal"
                href="/blog"
                action="All stories"
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
