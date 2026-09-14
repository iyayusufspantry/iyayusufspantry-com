import { ShopBrowser } from "@/components/shop-browser";
export const metadata = { title: "Shop" };
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <ShopBrowser key={category ?? "All"} initialCategory={category} />;
}
