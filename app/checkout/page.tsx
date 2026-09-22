import { getContent } from "@/lib/content/server";
import { CheckoutPage } from "@/components/commerce";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/checkout/page.tsx"];
  return { title: copy["copy-1"] };
}
export default CheckoutPage;
