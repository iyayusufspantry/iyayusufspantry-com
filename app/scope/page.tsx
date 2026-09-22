import { getContent } from "@/lib/content/server";
import { ScopePage } from "@/components/scope-presentation";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/scope/page.tsx"];
  return { title: copy["copy-1"] };
}
export default ScopePage;
