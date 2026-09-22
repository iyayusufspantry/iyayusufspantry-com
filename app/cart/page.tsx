import { getContent } from "@/lib/content/server";
import { CartPage } from "@/components/commerce";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/cart/page.tsx"];
  return { title: copy["copy-1"] };
}
export default CartPage;
