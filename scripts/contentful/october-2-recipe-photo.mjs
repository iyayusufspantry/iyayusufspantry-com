// Read-only by default; --apply uploads the supplied photo and publishes only
// the egusi recipe's image fields. Recipe wording remains sample content.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { setDefaultResultOrder } from "node:dns";
import { setTimeout as delay } from "node:timers/promises";
import { management, environmentPath, space } from "./management.mjs";
import { id } from "./export.mjs";

setDefaultResultOrder("ipv4first");
const filename = "1790911898722blob.jpg";
const photoPath = `public/assets/2 oct - second/${filename}`;
const assetId = id("asset", `2026-10-02-${filename}`);
const alt =
  "A close-up of a bowl of egusi soup with leafy greens on a stone counter.";
const recipeId = "pantry-recipe-0fcdb80b38c42158e04a8a89";
const request = (path, options) => management(environmentPath + path, options);
const [recipe, locales, assets] = await Promise.all([
  request(`/entries/${recipeId}`),
  request("/locales"),
  request(`/assets?sys.id=${assetId}`),
]);
const locale = locales.items.find((item) => item.default).code;
function requirePublished(resource) {
  if (
    !resource.sys.publishedVersion ||
    resource.sys.version !== resource.sys.publishedVersion + 1
  )
    throw new Error(`Preserve pending editorial changes: ${resource.sys.id}`);
}
requirePublished(recipe);
let asset = assets.items[0];
if (asset) requirePublished(asset);
if (
  recipe.fields.image?.[locale]?.sys.id === assetId &&
  recipe.fields.imageAlt?.[locale] === alt
) {
  console.log("The egusi recipe photograph is already current.");
  process.exit(0);
}
const bytes = await readFile(photoPath);
console.log(
  JSON.stringify(
    {
      recipe: recipe.fields.title[locale],
      photoPath,
      assetId,
      alt,
      upload: !asset,
      mode: process.argv.includes("--apply") ? "apply" : "plan",
    },
    null,
    2,
  ),
);
if (!process.argv.includes("--apply")) process.exit(0);

const folder = "artifacts/client-feedback-2026-10-02/recipe-photo";
await mkdir(folder, { recursive: true });
await writeFile(
  `${folder}/backup-${Date.now()}.json`,
  JSON.stringify({ recipe, asset, locale }, null, 2),
);
if (!asset) {
  const response = await fetch(
    `https://upload.contentful.com/spaces/${encodeURIComponent(space)}/uploads`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CMA_TOKEN}`,
        "Content-Type": "application/octet-stream",
      },
      body: bytes,
      signal: AbortSignal.timeout(120000),
    },
  );
  if (!response.ok)
    throw new Error(`Photo upload failed: HTTP ${response.status}`);
  const upload = await response.json();
  asset = await request(`/assets/${assetId}`, {
    method: "PUT",
    body: {
      fields: {
        title: { [locale]: "October 2 - Egusi soup recipe placeholder" },
        description: { [locale]: alt },
        file: {
          [locale]: {
            fileName: filename,
            contentType: "image/jpeg",
            uploadFrom: {
              sys: { type: "Link", linkType: "Upload", id: upload.sys.id },
            },
          },
        },
      },
    },
  });
  await request(`/assets/${assetId}/files/${locale}/process`, {
    method: "PUT",
    version: asset.sys.version,
  });
  for (let attempt = 0; attempt < 30; attempt++) {
    asset = await request(`/assets/${assetId}`);
    if (asset.fields.file[locale].url) break;
    await delay(1000);
  }
  if (!asset.fields.file[locale].url)
    throw new Error("Photo processing timed out");
  asset = await request(`/assets/${assetId}/published`, {
    method: "PUT",
    version: asset.sys.version,
  });
}
const updated = await request(`/entries/${recipeId}`, {
  method: "PUT",
  version: recipe.sys.version,
  body: {
    fields: {
      ...recipe.fields,
      image: {
        ...recipe.fields.image,
        [locale]: { sys: { type: "Link", linkType: "Asset", id: assetId } },
      },
      imageAlt: { ...recipe.fields.imageAlt, [locale]: alt },
    },
  },
});
await request(`/entries/${recipeId}/published`, {
  method: "PUT",
  version: updated.sys.version,
});
console.log(
  "Published the supplied egusi soup photograph on the existing recipe.",
);
