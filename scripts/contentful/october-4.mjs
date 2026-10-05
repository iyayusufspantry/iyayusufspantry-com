// Plan by default. --apply stages drafts; --apply --publish-staged publishes
// only inspected versions and unpublishes the requested plantain content.
import nextEnv from "@next/env";
import { setDefaultResultOrder } from "node:dns";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { id } from "./export.mjs";
import { photos, photoDirectory, products } from "./october-4-content.mjs";
import { models } from "./models.mjs";

setDefaultResultOrder("ipv4first");
nextEnv.loadEnvConfig(process.cwd());
const folder = "artifacts/client-feedback-2026-10-04";
const stagedPath = `${folder}/staged.json`;
const apply = process.argv.includes("--apply");
const space = process.env.CONTENTFUL_SPACE_ID;
const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
if (!space || !process.env.CMA_TOKEN)
  throw new Error("Missing management configuration");
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
    const result = await request(`/${kind}?limit=1000&skip=${skip}`);
    items.push(...result.items);
    skip += result.items.length;
    if (skip >= result.total) return items;
    if (!result.items.length) throw new Error(`Incomplete ${kind}`);
  }
}
if (process.argv.includes("--publish-staged")) {
  if (!apply)
    throw new Error(
      "Use --apply --publish-staged after inspecting the preview",
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
    item.done =
      item.action === "unpublish"
        ? !current?.sys.publishedVersion &&
          current?.sys.version === item.version + 1
        : current?.sys.publishedVersion === item.version &&
          current?.sys.version === item.version + 1;
    if (!item.done && current?.sys.version !== item.version)
      throw new Error(`Saved version changed: ${item.id}`);
  }
  for (const item of [...staged.items].sort((a, b) => a.order - b.order)) {
    if (!item.done)
      await request(
        `/${item.kind}/${item.id}/published`,
        item.action === "unpublish" ? "DELETE" : "PUT",
        undefined,
        item.version,
      );
    console.log(
      `${item.action === "unpublish" ? "Unpublished" : "Published"}: ${item.id}`,
    );
  }
  process.exit(0);
}
if (apply && existsSync(stagedPath))
  throw new Error(
    "Batch already staged; inspect before publishing or resuming",
  );
const [entries, assets, locales, schema] = await Promise.all([
  all("entries"),
  all("assets"),
  all("locales"),
  request("/content_types/pantryProduct"),
]);
const locale = locales.find((item) => item.default).code;
const fields = (entry) =>
  Object.fromEntries(
    Object.entries(entry.fields).map(([key, value]) => [key, value[locale]]),
  );
const link = (entryId, linkType = "Entry") => ({
  sys: { type: "Link", linkType, id: entryId },
});
const entryFor = (type, slug) =>
  entries.find(
    (entry) =>
      entry.sys.contentType.sys.id === type && fields(entry).slug === slug,
  );
const clean = (entry) => {
  if (
    entry?.sys.publishedVersion &&
    entry.sys.version !== entry.sys.publishedVersion + 1
  )
    throw new Error(`Preserve pending changes: ${entry.sys.id}`);
};
const plan = [];
function change(entryId, type, values, order = 3) {
  const entry = entries.find((item) => item.sys.id === entryId);
  clean(entry);
  if (entry && !entry.sys.publishedVersion)
    throw new Error(`Preserve existing draft: ${entryId}`);
  const changed = Object.fromEntries(
    Object.entries(values).filter(([key, value]) => {
      if (!entry) return true;
      const previous = fields(entry)[key];
      // Contentful omits empty optional arrays when publishing an entry.
      if (previous === undefined && Array.isArray(value) && !value.length)
        return false;
      return !isDeepStrictEqual(previous, value);
    }),
  );
  if (Object.keys(changed).length)
    plan.push({ id: entryId, type, values: changed, entry, order });
}
const uploads = [];
const photoRefs = Object.fromEntries(
  Object.entries(photos).map(([role, [filename, alt]]) => {
    const assetId = id("asset", `2026-10-04-${basename(filename)}`);
    const existing = assets.find((item) => item.sys.id === assetId);
    clean(existing);
    if (existing && !existing.sys.publishedVersion)
      throw new Error(`Preserve asset draft: ${assetId}`);
    if (!existing)
      uploads.push({
        id: assetId,
        filename: basename(filename),
        path: `${photoDirectory}/${filename}`,
        alt,
        title: `October 4 - ${role}`,
      });
    return [role, link(assetId, "Asset")];
  }),
);
for (const asset of uploads) await readFile(asset.path);
for (const product of products) {
  const existing = entryFor("pantryProduct", product.slug);
  const productId = existing?.sys.id ?? id("product", product.slug);
  const category = entryFor("pantryCategory", product.category);
  if (!category) throw new Error(`Missing category: ${product.category}`);
  const variantRefs = product.variants.map(({ size, priceCents }) => {
    const variantId = `${product.slug}:${size}:Standard`;
    const variantEntryId = id("variant", variantId);
    change(
      variantEntryId,
      "pantryVariant",
      {
        variantId,
        product: link(productId),
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
    (entry) =>
      entry.sys.contentType.sys.id === "pantryVariant" &&
      fields(entry).product?.sys.id === productId &&
      fields(entry).active &&
      !variantRefs.some((ref) => ref.sys.id === entry.sys.id),
  ))
    change(old.sys.id, "pantryVariant", { active: false }, 2);
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
      allergens: product.allergens,
      sizes: product.variants.map((variant) => variant.size),
      dietary: ["Standard"],
      samplePrice:
        Math.min(...product.variants.map((variant) => variant.priceCents)) /
        100,
      variants: variantRefs,
      photos: product.photos.map((role) => photoRefs[role]),
      approvalStatus: "approved",
      ...(product.learnMoreUrl ? { learnMoreUrl: product.learnMoreUrl } : {}),
      ...(!existing ? { sortOrder: 15 + products.indexOf(product) } : {}),
    },
    existing ? 3 : 1,
  );
}
const drinkRecipe = entryFor("pantryRecipe", "hibiscus-cooler");
if (!drinkRecipe) throw new Error("Missing drink recipe");
change(drinkRecipe.sys.id, "pantryRecipe", {
  image: photoRefs.zobo,
  imageAlt: photos.zobo[1],
});
const zobo = entryFor("pantryProduct", "zobo-drink");
if (!zobo) throw new Error("Missing Zobo product");
const zoboPhotos = fields(zobo).photos ?? [];
change(zobo.sys.id, "pantryProduct", {
  photos: [
    ...zoboPhotos.filter((ref) => ref.sys.id !== photoRefs.zobo.sys.id),
    photoRefs.zobo,
  ],
});

// Keep records recoverable while removing the product, sample recipe and links.
const removed = [
  entryFor("pantryProduct", "plantain-chips"),
  entryFor("pantryRecipe", "plantain-snack-bowl"),
].filter(Boolean);
for (const entry of removed) clean(entry);
const removedIds = new Set(removed.map((entry) => entry.sys.id));
for (const entry of entries) {
  const values = fields(entry);
  const updates = {};
  for (const key of [
    "featuredProducts",
    "featuredRecipes",
    "products",
    "recipes",
  ]) {
    if (
      Array.isArray(values[key]) &&
      values[key].some((ref) => removedIds.has(ref?.sys?.id))
    )
      updates[key] = values[key].filter((ref) => !removedIds.has(ref?.sys?.id));
  }
  if (Object.keys(updates).length && !removedIds.has(entry.sys.id))
    change(entry.sys.id, entry.sys.contentType.sys.id, updates);
  if (
    entry.sys.contentType.sys.id === "pantryVariant" &&
    removedIds.has(values.product?.sys.id) &&
    values.active
  )
    change(entry.sys.id, "pantryVariant", { active: false }, 2);
}
const removals = removed.filter((entry) => entry.sys.publishedVersion);
const learnMoreField = models
  .find((model) => model.id === "pantryProduct")
  .fields.find((field) => field.id === "learnMoreUrl");
const needsSchema = !schema.fields.some(
  (field) => field.id === learnMoreField.id,
);
if (needsSchema && schema.sys.version !== schema.sys.publishedVersion + 1)
  throw new Error("Preserve pending product schema changes");
await mkdir(folder, { recursive: true });
await writeFile(
  `${folder}/plan.json`,
  JSON.stringify(
    {
      uploads,
      schema: needsSchema ? learnMoreField : null,
      entries: plan.map(({ entry, ...item }) => ({
        ...item,
        previousVersion: entry?.sys.version,
      })),
      unpublish: removals.map((entry) => entry.sys.id),
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
      schema: needsSchema,
      unpublish: removals.map((entry) => fields(entry).slug),
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
  JSON.stringify({ entries, assets, schema, locale }, null, 2),
);
if (needsSchema) {
  const updated = await request(
    "/content_types/pantryProduct",
    "PUT",
    {
      name: schema.name,
      description: schema.description,
      displayField: schema.displayField,
      fields: [...schema.fields, learnMoreField],
    },
    schema.sys.version,
  );
  await request(
    "/content_types/pantryProduct/published",
    "PUT",
    undefined,
    updated.sys.version,
  );
}
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
    throw new Error(`Processing timeout: ${asset.filename}`);
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
  const index = entries.findIndex((entry) => entry.sys.id === item.id);
  if (index === -1) entries.push(updated);
  else entries[index] = updated;
  console.log(`Saved draft: ${item.id}`);
}
for (const entry of removals)
  staged.items.push({
    kind: "entries",
    id: entry.sys.id,
    version: entry.sys.version,
    order: 4,
    action: "unpublish",
  });
const flatten = (rows) =>
  rows.map((entry) => ({ sys: entry.sys, fields: fields(entry) }));
await writeFile(
  `${folder}/preview-content.json`,
  JSON.stringify({
    entries: flatten(entries.filter((entry) => !removedIds.has(entry.sys.id))),
    assets: flatten(assets),
  }),
);
staged.complete = true;
await save();
console.log("October 4 drafts and preview saved; inspect before publishing.");
