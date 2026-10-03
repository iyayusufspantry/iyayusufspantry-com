// Plan by default; --apply saves drafts; --apply --publish-staged publishes reviewed versions.
import nextEnv from "@next/env";
import { setDefaultResultOrder } from "node:dns";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { id } from "./export.mjs";
import {
  products,
  photos,
  photoDirectory,
  story,
} from "./october-2-content.mjs";

setDefaultResultOrder("ipv4first");
nextEnv.loadEnvConfig(process.cwd());
const folder = "artifacts/client-feedback-2026-10-02";
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
        signal: AbortSignal.timeout(upload ? 120000 : 30000),
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
    throw new Error("Use --apply --publish-staged after reviewing the preview");
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
const uploads = [];
const photoRefs = Object.fromEntries(
  Object.entries(photos).map(([role, [filename, alt]]) => {
    const assetId = id("asset", `2026-10-02-${filename}`);
    const existing = assets.find((asset) => asset.sys.id === assetId);
    if (
      existing &&
      (!existing.sys.publishedVersion ||
        existing.sys.version !== existing.sys.publishedVersion + 1)
    )
      throw new Error(`Preserve asset draft: ${assetId}`);
    if (!existing)
      uploads.push({
        id: assetId,
        filename,
        path: `${photoDirectory}/${filename}`,
        alt,
        title: `October 2 — ${role}`,
      });
    return [role, link(assetId, "Asset")];
  }),
);
// Check every local input before saving any remote changes.
for (const asset of uploads) await readFile(asset.path);
const settings = entries.find(
  (entry) => entry.sys.contentType.sys.id === "pantrySiteSettings",
);
if (!settings) throw new Error("Missing site settings");
function productEntry(slug) {
  const entry = entries.find(
    (e) =>
      e.sys.contentType.sys.id === "pantryProduct" && fields(e).slug === slug,
  );
  return entry;
}
for (const product of products) {
  let existing = productEntry(product.slug);
  if (!existing) {
    if (!product.category)
      throw new Error("Missing existing product: " + product.slug);
    const category = entries.find(
      (e) =>
        e.sys.contentType.sys.id === "pantryCategory" &&
        fields(e).slug === product.category,
    );
    if (!category) throw new Error("Missing category: " + product.category);
    existing = { sys: { id: id("product", product.slug) } };
    // Publish a complete product first so the new variants have a valid reference.
    change(
      existing.sys.id,
      "pantryProduct",
      {
        slug: product.slug,
        category: link(category.sys.id),
        sortOrder: 6,
        name: product.name,
        description: product.description,
        unit: product.unit,
        usage: product.usage,
        ingredients: product.ingredients,
        allergens: product.allergens,
        sizes: product.variants.map((v) => v.size),
        dietary: ["Standard"],
        samplePrice:
          Math.min(...product.variants.map((v) => v.priceCents)) / 100,
        variants: product.variants.map((v) =>
          link(id("variant", product.slug + ":" + v.size + ":Standard")),
        ),
        photos: product.photos.map((role) => photoRefs[role]),
        approvalStatus: "approved",
      },
      1,
    );
  }
  const variantRefs = product.variants.map(({ size, priceCents }) => {
    const variantId = `${product.slug}:${size}:Standard`;
    const variantEntryId = id("variant", variantId);
    change(
      variantEntryId,
      "pantryVariant",
      {
        variantId,
        product: link(existing.sys.id),
        size,
        dietary: "Standard",
        priceCents,
        currency: "USD",
        active: true,
        approvalStatus: "approved",
      },
      2,
    );
    return link(variantEntryId);
  });
  for (const old of entries.filter(
    (e) =>
      e.sys.contentType.sys.id === "pantryVariant" &&
      fields(e).product?.sys.id === existing.sys.id &&
      fields(e).active &&
      !variantRefs.some((ref) => ref.sys.id === e.sys.id),
  ))
    change(old.sys.id, "pantryVariant", { active: false }, 2);
  if (productEntry(product.slug))
    change(existing.sys.id, "pantryProduct", {
      name: product.name,
      description: product.description,
      unit: product.unit,
      usage: product.usage,
      ingredients: product.ingredients,
      allergens: product.allergens,
      sizes: product.variants.map((variant) => variant.size),
      dietary: ["Standard"],
      samplePrice:
        Math.min(...product.variants.map((variant) => variant.priceCents)) /
        100,
      variants: variantRefs,
      photos: product.photos.map((role) => photoRefs[role]),
      approvalStatus: "approved",
    });
}
const sectionRefs = story.paragraphs.map((text, index) => {
  const sectionId = id("section", story.slug + "-" + index);
  change(
    sectionId,
    "pantrySection",
    { title: story.title + " - paragraph " + (index + 1), text },
    1,
  );
  return link(sectionId);
});
change(id("article", story.slug), "pantryArticle", {
  slug: story.slug,
  title: story.title,
  author: story.author,
  description: story.description,
  category: "Community stories",
  publicationDate: "2026-10-02T00:00:00Z",
  displayDate: "October 2, 2026",
  readTime: "2 min read",
  approvalStatus: "approved",
  sortOrder: -10,
  referenceVersion: 1,
  sectionRefs,
  image: fields(settings).assortmentImage,
});
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
      products: products.map(({ name, unit, variants }) => ({
        name,
        unit,
        variants,
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
            { ...item.entry?.fields[key], [locale]: value },
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
  "October 2 content saved as drafts. Preview before publishing the saved versions.",
);
