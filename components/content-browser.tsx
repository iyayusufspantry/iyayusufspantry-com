"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { recipes } from "@/data/recipes";
import { posts } from "@/data/posts";
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
  const showFeatured = !isRecipe && !query && category === "All";
  return (
    <div className="site-container page-bottom">
      <PageHeading
        eyebrow={
          isRecipe
            ? "FROM THE PANTRY TO THE PLATE"
            : "THE SIMBIAT JOURNAL · BLOG"
        }
        title={
          isRecipe
            ? "Something good is cooking."
            : "Every ingredient has a story."
        }
        description={
          isRecipe
            ? "Familiar favorites and fresh inspiration. Find approachable ways to bring African ingredients to your table."
            : "A collection of stories about food, culture, and the people and places behind our pantry."
        }
      />
      {showFeatured && (
        <article className="featured-article">
          <Link href={`/blog/${posts[0].slug}`}>
            <MockImage label="Featured story photography" kind="article" />
          </Link>
          <div>
            <span className="eyebrow">
              FEATURED STORY · {posts[0].category}
            </span>
            <h2>
              <Link href={`/blog/${posts[0].slug}`}>{posts[0].title}</Link>
            </h2>
            <p>{posts[0].description}</p>
            <span className="fine-print">
              {posts[0].date} · {posts[0].readTime} · Sample article
            </span>
            <Link className="text-link mt-6" href={`/blog/${posts[0].slug}`}>
              Read the story
              <ArrowRight size={15} />
            </Link>
          </div>
        </article>
      )}
      <div className="catalog-toolbar">
        <h2 className="text-xl font-medium">
          {isRecipe ? "Find your next recipe" : "From the journal"}
        </h2>
        <SearchField
          value={query}
          onChange={setQuery}
          label={isRecipe ? "Search recipes" : "Search articles"}
          placeholder={isRecipe ? "Search recipes…" : "Search stories…"}
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
        Sample editorial content ·{" "}
        {isRecipe
          ? "Recipes, quantities, and preparation details"
          : "Stories, dates, and article copy"}{" "}
        require client review.
      </p>
      <div aria-live="polite" className="sr-only">
        {isRecipe ? filteredRecipes.length : filteredPosts.length} results
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
        <EmptyState
          title="Nothing here just yet"
          description="Try another search or explore all categories."
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
