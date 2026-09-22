import { getContent } from "@/lib/content/server";
import { PrototypeDirectory } from "@/components/scope-presentation";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/prototype/page.tsx"];
  return { title: copy["copy-1"] };
}
export default PrototypeDirectory;
