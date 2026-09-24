import { getContent } from "@/lib/content/server";
import { CheckoutPage } from "@/components/commerce";
import { StripeCheckout } from "@/components/stripe-checkout";
import { checkoutEnabled } from "@/lib/payments/config";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/checkout/page.tsx"];
  return { title: copy["copy-1"] };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const params = await searchParams;
  return checkoutEnabled() ? (
    <StripeCheckout cancelled={params.cancelled === "1"} />
  ) : (
    <CheckoutPage />
  );
}
