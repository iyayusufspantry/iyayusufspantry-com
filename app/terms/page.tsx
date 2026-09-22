import { getContent } from "@/lib/content/server";
import { PolicyPage } from "@/components/policy-page";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/terms/page.tsx"];
  return { title: copy["copy-1"] };
}
export default function Page() {
  return <PolicyPage type="terms" />;
}
