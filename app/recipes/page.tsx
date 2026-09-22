import { getContent } from "@/lib/content/server";
import { ContentBrowser } from "@/components/content-browser";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/recipes/page.tsx"];
  return { title: copy["copy-1"] };
}
export default function Page() {
  return <ContentBrowser kind="recipes" />;
}
