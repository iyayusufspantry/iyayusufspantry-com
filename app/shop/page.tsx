import { getContent } from "@/lib/content/server";
import { ShopBrowser } from "@/components/shop-browser";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/shop/page.tsx"];
  return { title: copy["copy-1"] };
}
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <ShopBrowser key={category ?? "All"} initialCategory={category} />;
}
