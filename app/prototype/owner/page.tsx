import { getContent } from "@/lib/content/server";
import { OwnerPreview } from "@/components/owner-preview";

export async function generateMetadata() {
  const copy = (await getContent()).copy["app/prototype/owner/page.tsx"];
  return { title: copy["copy-1"] };
}
export default function Page() {
  return <OwnerPreview />;
}
