import { getContent } from "@/lib/content/server";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/product-detail";
export async function generateStaticParams() {
  const { products } = await getContent();

  return products.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { products, copy: allCopy } = await getContent();
  const copy = allCopy["app/shop/[slug]/page.tsx"];

  const { slug } = await params;
  return {
    title: products.find((p) => p.slug === slug)?.name ?? copy["copy-1"],
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { products } = await getContent();

  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  return <ProductDetail key={slug} product={product} />;
}
