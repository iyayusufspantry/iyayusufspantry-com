import { getContent } from "@/lib/content/server";
import { ConfirmationPage } from "@/components/commerce";
import { StripeConfirmation } from "@/components/stripe-checkout";
export async function generateMetadata() {
  const copy = (await getContent()).copy["app/order-confirmation/page.tsx"];
  return { title: copy["copy-1"] };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  return params.session_id ? (
    <StripeConfirmation sessionId={params.session_id} />
  ) : (
    <ConfirmationPage />
  );
}
