import { getContent } from "@/lib/content/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Users } from "lucide-react";

import {
  MockImage,
  ProductGrid,
  RecipeCard,
  SectionHeading,
} from "@/components/catalog";
import { Button } from "@/components/ui/button";
export async function generateStaticParams() {
  const { recipes } = await getContent();

  return recipes.map((r) => ({ slug: r.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { recipes, copy: allCopy } = await getContent();
  const copy = allCopy["app/recipes/[slug]/page.tsx"];

  const { slug } = await params;
  return {
    title: recipes.find((r) => r.slug === slug)?.title ?? copy["copy-1"],
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { recipes, products, recipePhotos, copy: allCopy } = await getContent();
  const copy = allCopy["app/recipes/[slug]/page.tsx"];

  const { slug } = await params;
  const recipe = recipes.find((r) => r.slug === slug);
  if (!recipe) notFound();
  return (
    <div className="site-container page-bottom">
      <Link className="text-link mt-10" href="/recipes">
        <ArrowLeft size={14} /> {copy["copy-2"]}{" "}
      </Link>
      <header className="editorial-heading">
        <span className="eyebrow">
          {" "}
          {copy["copy-3"]} {recipe.category}
        </span>
        <h1>{recipe.title}</h1>
        <p>{recipe.description}</p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-neutral-500">
          <span className="flex items-center gap-2">
            <Clock size={16} />
            {recipe.time}
          </span>
          <span className="flex items-center gap-2">
            <Users size={16} /> {copy["copy-4"]} {recipe.servings}
          </span>
        </div>
      </header>
      <MockImage
        label={recipe.category}
        photo={recipePhotos[recipe.slug]}
        kind="recipe"
        className="editorial-hero"
      />
      <p className="fine-print mt-3"> {copy["copy-5"]} </p>
      <div className="recipe-body">
        <aside className="ingredients-panel">
          <span className="eyebrow">{copy["copy-6"]}</span>
          <h2>{copy["copy-7"]}</h2>
          <ul>
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
          <Button asChild variant="outline" className="w-full">
            <a href="#shop-ingredients">
              {" "}
              {copy["copy-8"]} <ArrowRight />
            </a>
          </Button>
        </aside>
        <section className="recipe-instructions">
          <span className="eyebrow">{copy["copy-9"]}</span>
          <h2>{copy["copy-10"]}</h2>
          <ol>
            {recipe.instructions.map((instruction, index) => (
              <li key={instruction}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{instruction}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section
        id="shop-ingredients"
        className="section border-t border-neutral-200"
      >
        <SectionHeading
          eyebrow={copy["copy-11"]}
          title={copy["copy-12"]}
          description={copy["copy-13"]}
        />
        <ProductGrid
          items={products.filter((p) => recipe.products.includes(p.slug))}
        />
      </section>
      <section className="section border-t border-neutral-200">
        <SectionHeading
          eyebrow={copy["copy-14"]}
          title={copy["copy-15"]}
          href="/recipes"
          action={copy["copy-16"]}
        />
        <div className="editorial-grid">
          {recipes
            .filter((r) => r.slug !== slug)
            .slice(0, 3)
            .map((r, index) => (
              <RecipeCard key={r.slug} recipe={r} index={index} />
            ))}
        </div>
      </section>
    </div>
  );
}
