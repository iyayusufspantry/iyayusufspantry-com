import { getContent } from "@/lib/content/server";
import { ContactPage } from "@/components/contact";
import { contactEnabled } from "@/lib/operations/runtime";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/contact/page.tsx"];
  return { title: copy["copy-1"] };
}
export default function Page() {
  return <ContactPage enabled={contactEnabled()} />;
}
