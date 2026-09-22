import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENTFUL_TAG } from "@/lib/content/server";
import {
  handleContentfulWebhook,
  type ContentEvent,
} from "@/lib/content/webhook";

export const runtime = "nodejs";

async function waitForDelivery(event: ContentEvent) {
  const token = process.env.CONTENTFUL_DELIVERY_TOKEN;
  if (!token) throw new Error("Delivery token missing");
  const space = encodeURIComponent(process.env.CONTENTFUL_SPACE_ID!);
  const environment = encodeURIComponent(
    process.env.CONTENTFUL_ENVIRONMENT || "master",
  );
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(
      `https://cdn.contentful.com/spaces/${space}/environments/${environment}/${event.kind}/${encodeURIComponent(event.id)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    if (event.removed && response.status === 404) return;
    if (!event.removed && response.ok) {
      const entry = await response.json();
      if (
        !event.publishedAt ||
        Date.parse(entry.sys.updatedAt) >= Date.parse(event.publishedAt)
      )
        return;
    }
    await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
  }
  throw new Error("Delivery update pending");
}

export async function POST(request: Request) {
  return handleContentfulWebhook(
    request,
    {
      secret: process.env.CONTENTFUL_REVALIDATION_SECRET,
      space: process.env.CONTENTFUL_SPACE_ID,
      environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
    },
    async (event) => {
      await waitForDelivery(event);
      revalidateTag(CONTENTFUL_TAG, { expire: 0 });
      revalidatePath("/", "layout");
    },
  );
}
