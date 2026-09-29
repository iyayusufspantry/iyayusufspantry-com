// Plan by default; --apply saves drafts. --publish-staged publishes exact saved versions.
// Deploy the approved-product display changes before publishing this batch.
// --additional-snacks selects the separate Donkwa and Coconut Candy Crunch batch.
import nextEnv from "@next/env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { id } from "./export.mjs";
import {
  products as originalProducts,
  additionalSnacks,
  story,
} from "./september-29-content.mjs";

nextEnv.loadEnvConfig(process.cwd());
const snacksOnly = process.argv.includes("--additional-snacks");
const products = snacksOnly ? additionalSnacks : originalProducts;
const folder = `artifacts/client-feedback-2026-09-29${snacksOnly ? "-snacks" : ""}`;
const stagedPath = `${folder}/staged.json`;
const apply = process.argv.includes("--apply");
const space = process.env.CONTENTFUL_SPACE_ID;
const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
if (!space || !process.env.CMA_TOKEN)
  throw new Error("Missing Contentful management configuration");
const base = `https://api.contentful.com/spaces/${space}/environments/${environment}`;
async function request(resource, method = "GET", body, version, type) {
  const upload = resource === "/uploads";
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(
      upload
        ? `https://upload.contentful.com/spaces/${space}/uploads`
        : base + resource,
      {
        method,
        headers: {
          Authorization: `Bearer ${process.env.CMA_TOKEN}`,
          "Content-Type": upload
            ? "application/octet-stream"
            : "application/vnd.contentful.management.v1+json",
          ...(version === undefined
            ? {}
            : { "X-Contentful-Version": String(version) }),
          ...(type ? { "X-Contentful-Content-Type": type } : {}),
        },
        ...(body === undefined
          ? {}
          : { body: upload ? body : JSON.stringify(body) }),
        signal: AbortSignal.timeout(30000),
      },
    );
    if (response.status === 429 || response.status >= 500) {
      await delay(1000 * (attempt + 1));
      continue;
    }
    if (response.status === 404) return null;
    if (!response.ok)
      throw new Error(`${method} ${resource}: HTTP ${response.status}`);
    return response.status === 204 ? null : response.json();
  }
  throw new Error(`Retry limit: ${resource}`);
}
async function all(kind) {
  const items = [];
  for (let skip = 0; ;) {
    const data = await request(`/${kind}?limit=1000&skip=${skip}`);
    items.push(...data.items);
    skip += data.items.length;
    if (skip >= data.total) return items;
    if (!data.items.length) throw new Error(`Incomplete ${kind}`);
  }
}
if (process.argv.includes("--publish-staged")) {
  if (!apply)
    throw new Error(
      "Use --apply --publish-staged after deploying the display changes",
    );
  const staged = JSON.parse(await readFile(stagedPath, "utf8"));
  if (
    !staged.complete ||
    staged.space !== space ||
    staged.environment !== environment
  )
    throw new Error("Incomplete batch or wrong environment");
  for (const item of staged.items) {
    const current = await request(`/${item.kind}/${item.id}`);
    item.published =
      current?.sys.publishedVersion === item.version &&
      current.sys.version === item.version + 1;
    if (!item.published && current?.sys.version !== item.version)
      throw new Error(`Saved version changed: ${item.id}`);
  }
  // Assets, new products, variants, then updated products and page copy.
  for (const item of [...staged.items].sort((a, b) => a.order - b.order)) {
    if (!item.published)
      await request(
        `/${item.kind}/${item.id}/published`,
        "PUT",
        undefined,
        item.version,
      );
    console.log(`Published ${item.kind}: ${item.id}`);
  }
  process.exit(0);
}
if (apply && existsSync(stagedPath))
  throw new Error(
    "Batch already staged. Inspect staged.json before publishing or resuming manually.",
  );
const [entries, assets, locales] = await Promise.all([
  all("entries"),
  all("assets"),
  all("locales"),
]);
const locale = locales.find((l) => l.default).code;
const fields = (entry) =>
  Object.fromEntries(
    Object.entries(entry.fields).map(([key, value]) => [key, value[locale]]),
  );
const link = (entryId, linkType = "Entry") => ({
  sys: { type: "Link", linkType, id: entryId },
});
const plan = [];
function change(entryId, type, values, order = 3) {
  const entry = entries.find((e) => e.sys.id === entryId);
  if (
    entry?.sys.publishedVersion &&
    entry.sys.version !== entry.sys.publishedVersion + 1
  )
    throw new Error(`Preserve pending editor changes: ${entryId}`);
  if (entry && !entry.sys.publishedVersion)
    throw new Error(`Preserve existing draft: ${entryId}`);
  const changed = Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => !entry || !isDeepStrictEqual(fields(entry)[key], value),
    ),
  );
  if (Object.keys(changed).length)
    plan.push({ id: entryId, type, values: changed, entry, order });
}
function copy(source, key, text) {
  const parent = entries.find(
    (e) =>
      (fields(e).source || fields(e).content?.source) === source &&
      fields(e).textBlocks,
  );
  const item =
    parent &&
    fields(parent)
      .textBlocks.map((ref) => entries.find((e) => e.sys.id === ref.sys.id))
      .find((e) => e && fields(e).key === key);
  if (!item) throw new Error(`Missing text: ${source} ${key}`);
  change(item.sys.id, "pantryTextBlock", { text });
}
const about = {
  "copy-3": "Our Story",
  "copy-4": story[0],
  "copy-5": "FOUR GENERATIONS OF CARE",
  "copy-6": "From our family",
  "copy-7": "to yours.",
  "copy-8": story[1],
  "copy-9": story[2],
  "copy-10": story[3],
  "copy-11": "Rooted in heritage",
  "copy-12":
    "Our story begins with Iya Shob in Abule Ado, Lagos, Nigeria, and continues through four generations.",
  "copy-13": "A passion for authentic food",
  "copy-14":
    "African foods and snacks that nourish us and bring back cherished memories.",
  "copy-15": "From our family to yours",
  "copy-16":
    "A mother and daughter sharing generations of knowledge, care, and entrepreneurial spirit.",
  "copy-19":
    "Discover the foods and snacks that bring a taste of our heritage to your table.",
};
if (!snacksOnly) {
  for (const [key, text] of Object.entries(about))
    copy("app/about/page.tsx", key, text);
  copy("app/page.tsx", "copy-37", story[0]);
  copy("app/page.tsx", "copy-38", story[2]);
  copy("app/page.tsx", "copy-40", story[3]);
}

const uploads = [];
for (const [index, product] of products.entries()) {
  const existing = entries.find(
    (e) =>
      e.sys.contentType.sys.id === "pantryProduct" &&
      fields(e).slug === product.slug,
  );
  const productId = existing?.sys.id || id("product", product.slug);
  const category = entries.find(
    (e) =>
      e.sys.contentType.sys.id === "pantryCategory" &&
      fields(e).slug === product.category,
  );
  if (!category) throw new Error(`Missing category: ${product.category}`);
  const variantId = `${product.slug}:Standard:Standard`;
  const variantEntryId = id("variant", variantId);
  const photoRefs = product.photos.map(([filename, alt], photoIndex) => {
    const assetId = id("asset", `2026-09-29-${filename}`);
    const existingAsset = assets.find((a) => a.sys.id === assetId);
    if (
      existingAsset &&
      (!existingAsset.sys.publishedVersion ||
        existingAsset.sys.version !== existingAsset.sys.publishedVersion + 1)
    )
      throw new Error(`Preserve asset draft: ${assetId}`);
    if (!existingAsset)
      uploads.push({
        id: assetId,
        filename,
        path: `${product.photoDirectory || "public/assets/29-sep-2026"}/${filename}`,
        alt,
        title: `${product.name} — photo ${photoIndex + 1}`,
      });
    return link(assetId, "Asset");
  });
  for (const old of entries.filter(
    (e) =>
      e.sys.contentType.sys.id === "pantryVariant" &&
      fields(e).product?.sys.id === productId &&
      e.sys.id !== variantEntryId &&
      fields(e).active,
  )) {
    change(old.sys.id, "pantryVariant", { active: false }, 2);
  }
  change(
    productId,
    "pantryProduct",
    {
      name: product.name,
      slug: product.slug,
      category: link(category.sys.id),
      description: product.description,
      unit: product.unit,
      usage: product.usage,
      ingredients: product.ingredients,
      allergens: product.allergens || "",
      sizes: ["Standard"],
      dietary: ["Standard"],
      samplePrice: product.priceCents / 100,
      variants: [link(variantEntryId)],
      photos: photoRefs,
      sortOrder: existing
        ? fields(existing).sortOrder
        : (snacksOnly ? -5 : -3) + index,
      approvalStatus: "approved",
    },
    existing ? 3 : 1,
  );
  change(
    variantEntryId,
    "pantryVariant",
    {
      variantId,
      product: link(productId),
      size: "Standard",
      dietary: "Standard",
      priceCents: product.priceCents,
      currency: "USD",
      active: true,
      approvalStatus: "approved",
    },
    2,
  );
}
await mkdir(folder, { recursive: true });
await writeFile(
  `${folder}/plan.json`,
  JSON.stringify(
    {
      uploads,
      entries: plan.map(({ entry, ...item }) => ({
        ...item,
        previousVersion: entry?.sys.version,
      })),
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      mode: apply ? "draft" : "plan",
      uploads: uploads.length,
      entries: plan.length,
      products: products.map(({ name, unit, priceCents }) => ({
        name,
        unit,
        priceCents,
      })),
    },
    null,
    2,
  ),
);
if (!apply) process.exit(0);
await writeFile(
  `${folder}/backup-${Date.now()}.json`,
  JSON.stringify({ entries, assets, locale }, null, 2),
);
const staged = { space, environment, complete: false, items: [] };
const save = () => writeFile(stagedPath, JSON.stringify(staged, null, 2));
await save();
for (const asset of uploads) {
  const upload = await request("/uploads", "POST", await readFile(asset.path));
  const created = await request(`/assets/${asset.id}`, "PUT", {
    fields: {
      title: { [locale]: asset.title },
      description: { [locale]: asset.alt },
      file: {
        [locale]: {
          fileName: asset.filename,
          contentType: "image/jpeg",
          uploadFrom: link(upload.sys.id, "Upload"),
        },
      },
    },
  });
  staged.items.push({
    kind: "assets",
    id: asset.id,
    version: created.sys.version,
    order: 0,
  });
  await save();
  await request(
    `/assets/${asset.id}/files/${locale}/process`,
    "PUT",
    undefined,
    created.sys.version,
  );
  let processed;
  for (let attempt = 0; attempt < 30; attempt++) {
    processed = await request(`/assets/${asset.id}`);
    if (processed.fields.file[locale].url) break;
    await delay(1000);
  }
  if (!processed.fields.file[locale].url)
    throw new Error(`Asset processing timeout: ${asset.filename}`);
  staged.items.at(-1).version = processed.sys.version;
  await save();
  assets.push(processed);
  console.log(`Saved photo: ${asset.title}`);
}
for (const item of plan) {
  const updated = await request(
    `/entries/${item.id}`,
    "PUT",
    {
      fields: {
        ...item.entry?.fields,
        ...Object.fromEntries(
          Object.entries(item.values).map(([key, value]) => [
            key,
            { [locale]: value },
          ]),
        ),
      },
    },
    item.entry?.sys.version,
    item.type,
  );
  staged.items.push({
    kind: "entries",
    id: item.id,
    version: updated.sys.version,
    order: item.order,
  });
  await save();
  const index = entries.findIndex((e) => e.sys.id === item.id);
  if (index === -1) entries.push(updated);
  else entries[index] = updated;
  console.log(`Saved draft: ${item.id}`);
}
const flatten = (rows) =>
  rows.map((entry) => ({ sys: entry.sys, fields: fields(entry) }));
await writeFile(
  `${folder}/preview-content.json`,
  JSON.stringify({ entries: flatten(entries), assets: flatten(assets) }),
);
staged.complete = true;
await save();
console.log(
  "September 29 content saved as drafts. Preview before deploying and publishing the saved versions.",
);
