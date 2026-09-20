import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Sprout,
  Heart,
  PackageCheck,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MockImage,
  SectionHeading,
  CategoryCard,
  ProductGrid,
  RecipeCard,
  BlogCard,
} from "@/components/catalog";
import { Newsletter } from "@/components/site-shell";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { recipes } from "@/data/recipes";
import { posts } from "@/data/posts";
import { brandPhotos } from "@/data/brand-assets";
const values = [
  {
    icon: Sprout,
    title: "Authentic ingredients",
    subtitle: "Rooted in African food traditions",
  },
  {
    icon: Heart,
    title: "Thoughtfully sourced",
    subtitle: "Relationships behind every story",
  },
  {
    icon: PackageCheck,
    title: "Made for your pantry",
    subtitle: "Everyday staples & new discoveries",
  },
];
export default function Home() {
  return (
    <div className="site-container">
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-rule" />
            ROOTED IN CULTURE. MADE FOR YOUR TABLE.
          </span>
          <h1>
            A taste of home.
            <br />A pantry full of <span>possibility.</span>
          </h1>
          <p>
            Discover authentic African foods, everyday essentials, and the
            snacks you grew up loving. Thoughtfully sourced, from our community
            to your kitchen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/shop">
                Shop products
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/recipes">Explore recipes</Link>
            </Button>
          </div>
          <div className="hero-footnote">
            <span className="flex -space-x-2">
              {[Sprout, Heart, Globe].map((Icon, i) => (
                <span className="hero-mini-icon" key={i}>
                  <Icon size={15} strokeWidth={1.5} />
                </span>
              ))}
            </span>
            <span>Familiar flavors. Meaningful connections.</span>
          </div>
        </div>
        <div className="hero-visual">
          <MockImage kind="hero" photo={brandPhotos.assortment} />
          <div className="hero-stamp" aria-hidden="true">
            <Sprout size={24} />
            <span>
              Rooted
              <br />
              in home.
            </span>
          </div>
          <div className="hero-photo-note">
            <span className="size-1.5 rounded-full bg-primary" />
            A look inside Iya Yusuf&apos;s Pantry
            <ArrowUpRight size={13} className="ml-auto shrink-0" />
          </div>
        </div>
      </section>
      <div className="values-strip">
        {values.map(({ icon: Icon, title, subtitle }) => (
          <div key={title}>
            <Icon size={23} strokeWidth={1.3} />
            <div>
              <strong>{title}</strong>
              <span>{subtitle}</span>
            </div>
          </div>
        ))}
      </div>
      <section className="section">
        <SectionHeading
          eyebrow="FIND YOUR FAVORITES"
          title="A little of everything you love"
          description="From your daily essentials to something a little special."
          href="/shop"
          action="Shop all categories"
        />
        <div className="category-grid">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.slug}
              category={category}
              index={index}
            />
          ))}
        </div>
        <p className="fine-print mt-4">
          Sample categories · Final collection to be confirmed with Simbiat.
        </p>
      </section>
      <section className="section pt-2!">
        <SectionHeading
          eyebrow="THE PANTRY EDIT"
          title="Good things to start with"
          description="A few familiar favorites to welcome into your kitchen."
          href="/shop"
          action="Shop all products"
        />
        <ProductGrid
          items={[products[1], products[7], products[9], products[3]]}
        />
      </section>
      <section className="pantry-gallery section">
        <SectionHeading
          eyebrow="FROM OUR SHELVES"
          title="Familiar little joys."
          description="A glimpse of the snacks and drinks that have been part of our pantry."
        />
        <div className="pantry-photo-grid">
          {[
            { photo: brandPhotos.snackJars, caption: "Something to share" },
            { photo: brandPhotos.coconut, caption: "A little golden crunch" },
            { photo: brandPhotos.drinks, caption: "A moment to refresh" },
          ].map(({ photo, caption }) => (
            <figure key={caption}>
              <MockImage photo={photo} />
              <figcaption>{caption}</figcaption>
            </figure>
          ))}
        </div>
        <p className="fine-print mt-4">
          Photos from the client&apos;s collection. Current range and packaging
          are being confirmed.
        </p>
      </section>
      <section className="story-section">
        <MockImage kind="story" photo={brandPhotos.snackJars} />
        <div className="story-copy">
          <span className="eyebrow">MORE THAN WHAT’S ON THE SHELF</span>
          <h2>
            Rooted in home.
            <br />
            Shared with you.
          </h2>
          <p>
            Food has a way of bringing us back. To a place, a person, a moment
            around the table.
          </p>
          <p>
            Iya Yusuf&apos;s Pantry brings African food items and snacks to
            customers in the United States, with some products imported directly
            from Nigeria. Behind the business is a focus on authentic
            ingredients and relationships with farmers, fishermen, and
            suppliers.
          </p>
          <Link className="text-link mt-5" href="/about">
            Get to know our story
            <ArrowRight size={16} />
          </Link>
          <span className="fine-print mt-7 block">
            Draft story copy · Subject to client review.
          </span>
        </div>
      </section>
      <section className="section">
        <SectionHeading
          eyebrow="FROM THE PANTRY TO THE PLATE"
          title="A little inspiration for your kitchen"
          description="Approachable recipes to make the most of your ingredients."
          href="/recipes"
          action="Explore all recipes"
        />
        <div className="editorial-grid">
          {recipes.slice(0, 3).map((recipe, index) => (
            <RecipeCard key={recipe.slug} recipe={recipe} index={index} />
          ))}
        </div>
      </section>
      <section className="section border-t border-neutral-200">
        <SectionHeading
          eyebrow="THE PANTRY JOURNAL"
          title="Food has a story. Let’s share it."
          description="Ingredients, culture, and the connections that bring us together."
          href="/blog"
          action="Read the journal"
        />
        <div className="editorial-grid">
          {posts.slice(0, 3).map((post, index) => (
            <BlogCard key={post.slug} post={post} index={index} />
          ))}
        </div>
      </section>
      <Newsletter />
    </div>
  );
}
