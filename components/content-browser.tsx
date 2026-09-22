"use client";
import { useContent } from "@/components/content-provider";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  BlogCard,
  EmptyState,
  FilterChips,
  MockImage,
  PageHeading,
  RecipeCard,
  SearchField,
} from "@/components/catalog";
import { Button } from "@/components/ui/button";

export function ContentBrowser({ kind }: { kind: "recipes" | "blog" }) {
  const { recipes, posts, brandPhotos, copy: allCopy } = useContent();
  const copy = allCopy["components/content-browser.tsx"];

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const isRecipe = kind === "recipes";
  const matches = (item: {
    title: string;
    description: string;
    category: string;
  }) =>
    (category === "All" || category === item.category) &&
    `${item.title} ${item.description} ${item.category}`
      .toLowerCase()
      .includes(query.toLowerCase());
  const filteredRecipes = recipes.filter(matches);
  const filteredPosts = posts.filter(matches);
  const showFeatured =
    !isRecipe && posts.length > 0 && !query && category === "All";
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow={isRecipe ? copy["copy-4"] : copy["copy-5"]}
        title={isRecipe ? copy["copy-6"] : copy["copy-7"]}
        description={isRecipe ? copy["copy-8"] : copy["copy-9"]}
      />
      {showFeatured && (
        <article className="featured-article">
          <Link href={`/blog/${posts[0].slug}`}>
            <MockImage photo={brandPhotos.assortment} kind="article" />
          </Link>
          <div>
            <span className="eyebrow">
              {" "}
              {copy["copy-10"]} {posts[0].category}
            </span>
            <h2>
              <Link href={`/blog/${posts[0].slug}`}>{posts[0].title}</Link>
            </h2>
            <p>{posts[0].description}</p>
            <span className="fine-print">
              {posts[0].date} {copy["copy-11"]} {posts[0].readTime}{" "}
              {copy["copy-12"]}{" "}
            </span>
            <Link className="text-link mt-6" href={`/blog/${posts[0].slug}`}>
              {" "}
              {copy["copy-13"]} <ArrowRight size={15} />
            </Link>
          </div>
        </article>
      )}
      <div className="catalog-toolbar">
        <h2 className="text-xl font-medium">
          {isRecipe ? copy["copy-14"] : copy["copy-15"]}
        </h2>
        <SearchField
          value={query}
          onChange={setQuery}
          label={isRecipe ? "Search recipes" : "Search articles"}
          placeholder={isRecipe ? copy["copy-16"] : copy["copy-17"]}
        />
      </div>
      <FilterChips
        options={[
          ...new Set((isRecipe ? recipes : posts).map((item) => item.category)),
        ]}
        value={category}
        onChange={setCategory}
      />
      <p className="fine-print mb-7">
        {" "}
        {copy["copy-18"]} {isRecipe ? copy["copy-19"] : copy["copy-20"]}{" "}
        {copy["copy-21"]}{" "}
      </p>
      <div aria-live="polite" className="sr-only">
        {isRecipe ? filteredRecipes.length : filteredPosts.length}{" "}
        {copy["copy-22"]}{" "}
      </div>
      {(isRecipe ? filteredRecipes.length : filteredPosts.length) ? (
        <div className="editorial-grid">
          {isRecipe
            ? filteredRecipes.map((recipe, index) => (
                <RecipeCard key={recipe.slug} recipe={recipe} index={index} />
              ))
            : filteredPosts
                .filter((post) => !showFeatured || post.slug !== posts[0].slug)
                .map((post, index) => (
                  <BlogCard key={post.slug} post={post} index={index} />
                ))}
        </div>
      ) : (
        <EmptyState title={copy["copy-23"]} description={copy["copy-24"]}>
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
          >
            {" "}
            {copy["copy-25"]}{" "}
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
