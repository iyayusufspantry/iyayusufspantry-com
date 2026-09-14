import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Users } from "lucide-react";
import { recipes } from "@/data/recipes";
import { products } from "@/data/products";
import {
  MockImage,
  ProductGrid,
  RecipeCard,
  SectionHeading,
} from "@/components/catalog";
import { Button } from "@/components/ui/button";
export function generateStaticParams() {
  return recipes.map((r) => ({ slug: r.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: recipes.find((r) => r.slug === slug)?.title ?? "Recipe not found",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = recipes.find((r) => r.slug === slug);
  if (!recipe) notFound();
  return (
    <div className="site-container page-bottom">
      <Link className="text-link mt-10" href="/recipes">
        <ArrowLeft size={14} />
        All recipes
      </Link>
      <header className="editorial-heading">
        <span className="eyebrow">
          FROM OUR SAMPLE RECIPE COLLECTION · {recipe.category}
        </span>
        <h1>{recipe.title}</h1>
        <p>{recipe.description}</p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-neutral-500">
          <span className="flex items-center gap-2">
            <Clock size={16} />
            {recipe.time}
          </span>
          <span className="flex items-center gap-2">
            <Users size={16} />
            Serves {recipe.servings}
          </span>
        </div>
      </header>
      <MockImage
        label="Recipe photography"
        kind="recipe"
        className="editorial-hero"
      />
      <p className="fine-print mt-3">
        Sample recipe and quantities for scope review. Final recipe testing,
        instructions, and photography require client approval.
      </p>
      <div className="recipe-body">
        <aside className="ingredients-panel">
          <span className="eyebrow">ON YOUR COUNTER</span>
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
          <Button asChild variant="outline" className="w-full">
            <a href="#shop-ingredients">
              Shop ingredients
              <ArrowRight />
            </a>
          </Button>
        </aside>
        <section className="recipe-instructions">
          <span className="eyebrow">LET’S MAKE SOMETHING GOOD</span>
          <h2>In the kitchen</h2>
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
          eyebrow="FROM THE SIMBIAT PANTRY"
          title="Shop the ingredients"
          description="Sample products to connect inspiration with your shopping bag."
        />
        <ProductGrid
          items={products.filter((p) => recipe.products.includes(p.slug))}
        />
      </section>
      <section className="section border-t border-neutral-200">
        <SectionHeading
          eyebrow="KEEP THE INSPIRATION GOING"
          title="What’s cooking next?"
          href="/recipes"
          action="All recipes"
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
