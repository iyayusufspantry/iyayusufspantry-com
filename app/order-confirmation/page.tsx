import { getContent } from "@/lib/content/server";
import { ConfirmationPage } from "@/components/commerce";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/order-confirmation/page.tsx"];
  return { title: copy["copy-1"] };
}
export default ConfirmationPage;
