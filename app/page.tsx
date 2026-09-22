import { getContent } from "@/lib/content/server";
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

export default async function Home() {
  const {
    featured,
    categories,
    products,
    recipes,
    posts,
    brandPhotos,
    copy: allCopy,
  } = await getContent();
  const copy = allCopy["app/page.tsx"];
  const values = [
    {
      icon: Sprout,
      title: copy["copy-1"],
      subtitle: copy["copy-2"],
    },
    {
      icon: Heart,
      title: copy["copy-3"],
      subtitle: copy["copy-4"],
    },
    {
      icon: PackageCheck,
      title: copy["copy-5"],
      subtitle: copy["copy-6"],
    },
  ];

  return (
    <div className="site-container">
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-rule" /> {copy["copy-7"]}{" "}
          </span>
          <h1>
            {" "}
            {copy["copy-8"]} <br />
            {copy["copy-9"]} <span>{copy["copy-10"]}</span>
          </h1>
          <p> {copy["copy-11"]} </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/shop">
                {" "}
                {copy["copy-12"]} <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/recipes">{copy["copy-13"]}</Link>
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
            <span>{copy["copy-14"]}</span>
          </div>
        </div>
        <div className="hero-visual">
          <MockImage kind="hero" photo={brandPhotos.assortment} />
          <div className="hero-stamp" aria-hidden="true">
            <Sprout size={24} />
            <span>
              {" "}
              {copy["copy-15"]} <br /> {copy["copy-16"]}{" "}
            </span>
          </div>
          <div className="hero-photo-note">
            <span className="size-1.5 rounded-full bg-primary" />{" "}
            {copy["copy-17"]}{" "}
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
          eyebrow={copy["copy-18"]}
          title={copy["copy-19"]}
          description={copy["copy-20"]}
          href="/shop"
          action={copy["copy-21"]}
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
        <p className="fine-print mt-4"> {copy["copy-22"]} </p>
      </section>
      <section className="section pt-2!">
        <SectionHeading
          eyebrow={copy["copy-23"]}
          title={copy["copy-24"]}
          description={copy["copy-25"]}
          href="/shop"
          action={copy["copy-26"]}
        />
        <ProductGrid
          items={featured.products.flatMap((slug) =>
            products.filter((p) => p.slug === slug),
          )}
        />
      </section>
      <section className="pantry-gallery section">
        <SectionHeading
          eyebrow={copy["copy-27"]}
          title={copy["copy-28"]}
          description={copy["copy-29"]}
        />
        <div className="pantry-photo-grid">
          {[
            { photo: brandPhotos.snackJars, caption: copy["copy-30"] },
            { photo: brandPhotos.coconut, caption: copy["copy-31"] },
            { photo: brandPhotos.drinks, caption: copy["copy-32"] },
          ].map(({ photo, caption }) => (
            <figure key={caption}>
              <MockImage photo={photo} />
              <figcaption>{caption}</figcaption>
            </figure>
          ))}
        </div>
        <p className="fine-print mt-4"> {copy["copy-33"]} </p>
      </section>
      <section className="story-section">
        <MockImage kind="story" photo={brandPhotos.snackJars} />
        <div className="story-copy">
          <span className="eyebrow">{copy["copy-34"]}</span>
          <h2>
            {" "}
            {copy["copy-35"]} <br /> {copy["copy-36"]}{" "}
          </h2>
          <p> {copy["copy-37"]} </p>
          <p> {copy["copy-38"]} </p>
          <Link className="text-link mt-5" href="/about">
            {" "}
            {copy["copy-39"]} <ArrowRight size={16} />
          </Link>
          <span className="fine-print mt-7 block"> {copy["copy-40"]} </span>
        </div>
      </section>
      <section className="section">
        <SectionHeading
          eyebrow={copy["copy-41"]}
          title={copy["copy-42"]}
          description={copy["copy-43"]}
          href="/recipes"
          action={copy["copy-44"]}
        />
        <div className="editorial-grid">
          {featured.recipes
            .flatMap((slug) => recipes.filter((r) => r.slug === slug))
            .map((recipe, index) => (
              <RecipeCard key={recipe.slug} recipe={recipe} index={index} />
            ))}
        </div>
      </section>
      <section className="section border-t border-neutral-200">
        <SectionHeading
          eyebrow={copy["copy-45"]}
          title={copy["copy-46"]}
          description={copy["copy-47"]}
          href="/blog"
          action={copy["copy-48"]}
        />
        <div className="editorial-grid">
          {featured.posts
            .flatMap((slug) => posts.filter((p) => p.slug === slug))
            .map((post, index) => (
              <BlogCard key={post.slug} post={post} index={index} />
            ))}
        </div>
      </section>
      <Newsletter />
    </div>
  );
}
