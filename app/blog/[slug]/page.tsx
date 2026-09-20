import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { posts } from "@/data/posts";
import { products } from "@/data/products";
import { BlogCard, MockImage, SectionHeading } from "@/components/catalog";
import { Button } from "@/components/ui/button";
import { journalPhotos } from "@/data/brand-assets";
export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: posts.find((p) => p.slug === slug)?.title ?? "Article not found",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const product = products.find((p) => p.slug === post.product)!;
  return (
    <div className="site-container page-bottom">
      <Link className="text-link mt-10" href="/blog">
        <ArrowLeft size={14} />
        Back to the journal
      </Link>
      <header className="editorial-heading">
        <span className="eyebrow">{post.category}</span>
        <h1>{post.title}</h1>
        <p>{post.description}</p>
        <span className="text-sm text-neutral-500">
          {post.date} · {post.readTime} · Sample article
        </span>
      </header>
      <MockImage
        label={post.category}
        photo={journalPhotos[post.slug]}
        kind="article"
        className="editorial-hero"
      />
      <article className="article-body">
        <p className="notice">
          Placeholder editorial copy prepared for scope review. Final wording,
          photography, and publication dates need client approval.
        </p>
        {post.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.text}</p>
          </section>
        ))}
        <div className="article-product-cta">
          <span className="eyebrow">BRING THE STORY TO YOUR KITCHEN</span>
          <h2>Discover {product.name.toLowerCase()}</h2>
          <p>
            Explore this sample product and see how the journal can connect
            readers with the store.
          </p>
          <Button asChild>
            <Link href={`/shop/${product.slug}`}>
              View product
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </article>
      <section className="section border-t border-neutral-200">
        <SectionHeading
          eyebrow="A LITTLE MORE TO EXPLORE"
          title="More from the journal"
          href="/blog"
          action="All stories"
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
