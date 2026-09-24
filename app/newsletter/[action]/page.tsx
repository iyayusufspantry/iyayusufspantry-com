import { notFound } from "next/navigation";
import { NewsletterManage } from "@/components/newsletter-manage";
export const metadata = {
  title: "Newsletter preferences",
  referrer: "no-referrer" as const,
};
export default async function Page({
  params,
}: {
  params: Promise<{ action: string }>;
}) {
  const { action } = await params;
  if (action !== "confirm" && action !== "unsubscribe") notFound();
  return <NewsletterManage action={action} />;
}
