import { getContent } from "@/lib/content/server";
import { ContactPage } from "@/components/contact";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/contact/page.tsx"];
  return { title: copy["copy-1"] };
}
export default ContactPage;
