import { getContent } from "@/lib/content/server";
import { SiteSearch } from "@/components/site-search";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/search/page.tsx"];
  return { title: copy["copy-1"] };
}
export default SiteSearch;
