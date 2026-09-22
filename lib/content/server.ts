import "server-only";
import { cache } from "react";
import { mapContent, type CmsResource } from "./map";

export const CONTENTFUL_TAG = "contentful";

// Only published content reaches the storefront. Credentials never enter client props.
async function collection(kind: "entries" | "assets"): Promise<CmsResource[]> {
  const space = process.env.CONTENTFUL_SPACE_ID;
  const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
  const token = process.env.CONTENTFUL_DELIVERY_TOKEN;
  if (!space || !token)
    throw new Error("Contentful delivery configuration is missing");
  const items: CmsResource[] = [];
  for (let skip = 0; ;) {
    const url = new URL(
      `https://cdn.contentful.com/spaces/${encodeURIComponent(space)}/environments/${encodeURIComponent(environment)}/${kind}`,
    );
    url.search = new URLSearchParams({
      limit: "1000",
      skip: String(skip),
      include: "0",
      order: "sys.createdAt,sys.id",
    }).toString();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "force-cache",
      next: { tags: [CONTENTFUL_TAG], revalidate: 60 },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(`Contentful ${kind} request failed (${response.status})`);
    const result = await response.json();
    if (!Array.isArray(result.items) || !Number.isInteger(result.total))
      throw new Error("Invalid Contentful collection");
    items.push(...result.items);
    skip += result.items.length;
    if (skip >= result.total) return items;
    if (!result.items.length)
      throw new Error("Incomplete Contentful collection");
  }
}

export const getContent = cache(async () => {
  const [entries, assets] = await Promise.all([
    collection("entries"),
    collection("assets"),
  ]);
  return mapContent(entries, assets);
});
