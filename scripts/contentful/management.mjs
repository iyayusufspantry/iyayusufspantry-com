import { createRequire } from "node:module";
import { root } from "./export.mjs";
const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(
  root,
);
export const space = process.env.CONTENTFUL_SPACE_ID;
export const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
export const environmentPath = `/environments/${encodeURIComponent(environment)}`;
export async function management(
  resource,
  { method = "GET", body, version } = {},
) {
  if (!space || !process.env.CMA_TOKEN)
    throw new Error("Contentful management configuration is missing");
  for (let attempt = 0; attempt < 4; attempt++) {
    let response;
    try {
      response = await fetch(
        `https://api.contentful.com/spaces/${encodeURIComponent(space)}${resource}`,
        {
          method,
          signal: AbortSignal.timeout(15000),
          headers: {
            Authorization: `Bearer ${process.env.CMA_TOKEN}`,
            "Content-Type": "application/vnd.contentful.management.v1+json",
            ...(version ? { "X-Contentful-Version": String(version) } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
      );
    } catch {
      if (attempt === 3)
        throw new Error("Contentful management connection failed");
    }
    if (response && response.status !== 429 && response.status < 500) {
      if (!response.ok)
        throw new Error(
          `Contentful management request failed (${response.status})`,
        );
      return response.json();
    }
    await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000));
  }
  throw new Error("Contentful management retry limit reached");
}
