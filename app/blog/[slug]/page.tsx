import { getContent } from "@/lib/content/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { BlogCard, MockImage, SectionHeading } from "@/components/catalog";
import { Button } from "@/components/ui/button";

export async function generateStaticParams() {
  const { posts } = await getContent();

  return posts.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { posts, copy: allCopy } = await getContent();
  const copy = allCopy["app/blog/[slug]/page.tsx"];

  const { slug } = await params;
  return {
    title: posts.find((p) => p.slug === slug)?.title ?? copy["copy-1"],
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { posts, products, journalPhotos, copy: allCopy } = await getContent();
  const copy = allCopy["app/blog/[slug]/page.tsx"];

  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const product = products.find((p) => p.slug === post.product);
  return (
    <div className="site-container page-bottom">
      <Link className="text-link mt-10" href="/blog">
        <ArrowLeft size={14} /> {copy["copy-2"]}{" "}
      </Link>
      <header className="editorial-heading">
        <span className="eyebrow">{post.category}</span>
        <h1>{post.title}</h1>
        <p>{post.description}</p>
        <span className="text-sm text-neutral-500">
          {post.date} {copy["copy-3"]} {post.readTime} {copy["copy-4"]}{" "}
        </span>
      </header>
      <MockImage
        label={post.category}
        photo={journalPhotos[post.slug]}
        kind="article"
        className="editorial-hero"
      />
      <article className="article-body">
        <p className="notice"> {copy["copy-5"]} </p>
        {post.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.text}</p>
          </section>
        ))}
        {product && (
          <div className="article-product-cta">
            <span className="eyebrow">{copy["copy-6"]}</span>
            <h2>
              {copy["copy-7"]} {product.name.toLowerCase()}
            </h2>
            <p> {copy["copy-8"]} </p>
            <Button asChild>
              <Link href={`/shop/${product.slug}`}>
                {" "}
                {copy["copy-9"]} <ArrowRight />
              </Link>
            </Button>
          </div>
        )}
      </article>
      <section className="section border-t border-neutral-200">
        <SectionHeading
          eyebrow={copy["copy-10"]}
          title={copy["copy-11"]}
          href="/blog"
          action={copy["copy-12"]}
        />
        <div className="editorial-grid">
          {posts
            .filter((p) => p.slug !== slug)
            .slice(0, 3)
            .map((p, index) => (
              <BlogCard key={p.slug} post={p} index={index} />
            ))}
        </div>
      </section>
    </div>
  );
}
