// Read-only by default. --apply updates and publishes only the journal photograph.
import nextEnv from "@next/env";
import { setDefaultResultOrder } from "node:dns";
import { mkdir, writeFile } from "node:fs/promises";
setDefaultResultOrder("ipv4first");
nextEnv.loadEnvConfig(process.cwd());
const base = `https://api.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT || "master"}`;
if (!process.env.CMA_TOKEN || !process.env.CONTENTFUL_SPACE_ID)
  throw new Error("Missing Contentful configuration");
async function request(path, method = "GET", body, version) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.CMA_TOKEN}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      ...(version === undefined
        ? {}
        : { "X-Contentful-Version": String(version) }),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(`${method} ${path}: HTTP ${response.status}`);
  return response.json();
}
const article = await request(
  "/entries/pantry-article-a216fbe81b58e6ef875b1744",
);
const settings = await request(
  "/entries/pantry-settings-0d6e4079e36703ebd37c0072",
);
const locale = (await request("/locales")).items.find((l) => l.default).code;
for (const entry of [article, settings]) {
  if (
    !entry.sys.publishedVersion ||
    entry.sys.version !== entry.sys.publishedVersion + 1
  )
    throw new Error(`Preserve pending editorial changes: ${entry.sys.id}`);
}
const image = settings.fields.assortmentImage[locale];
const asset = await request(`/assets/${image.sys.id}`);
if (
  !asset.sys.publishedVersion ||
  asset.sys.version !== asset.sys.publishedVersion + 1
)
  throw new Error("Publish the current assortment image first");
const imageAlt =
  asset.fields.description?.[locale] || asset.fields.title[locale];
if (
  article.fields.image[locale].sys.id === image.sys.id &&
  article.fields.imageAlt?.[locale] === imageAlt
) {
  console.log("Journal photograph is already current.");
} else {
  console.log(
    JSON.stringify(
      {
        article: article.fields.title[locale],
        previousImage: article.fields.image[locale].sys.id,
        image: image.sys.id,
        imageAlt,
      },
      null,
      2,
    ),
  );
  if (process.argv.includes("--apply")) {
    await mkdir("artifacts/client-feedback-2026-10-01", { recursive: true });
    await writeFile(
      `artifacts/client-feedback-2026-10-01/journal-backup-${Date.now()}.json`,
      JSON.stringify(article, null, 2),
    );
    const saved = await request(
      `/entries/${article.sys.id}`,
      "PUT",
      {
        fields: {
          ...article.fields,
          image: { ...article.fields.image, [locale]: image },
          imageAlt: { ...article.fields.imageAlt, [locale]: imageAlt },
        },
      },
      article.sys.version,
    );
    await request(
      `/entries/${article.sys.id}/published`,
      "PUT",
      undefined,
      saved.sys.version,
    );
    console.log("Published the updated journal photograph.");
  }
}
