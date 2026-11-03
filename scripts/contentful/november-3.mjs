// Preview by default. --apply publishes supplied merch previews, never sale variants.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { setDefaultResultOrder } from "node:dns";
import { setTimeout as delay } from "node:timers/promises";
import { isDeepStrictEqual } from "node:util";
import { management, environmentPath, space } from "./management.mjs";
import { id } from "./export.mjs";

setDefaultResultOrder("ipv4first");
const request = (path, options) => management(environmentPath + path, options);
const folder = "artifacts/client-feedback-2026-11-03";
const apply = process.argv.includes("--apply");
const sizes = ["Medium", "Large", "Extra-large", "XX-large"];
const items = [
  {
    slug: "i-rock-with-iya-yusufs-pantry-shirt",
    name: "I Rock with Iya Yusuf’s Pantry T-shirt",
    description:
      "Cream T-shirt with the I Rock with Iya Yusuf’s Pantry design.",
    sizes,
    files: [
      [
        "1793650610442blob.jpg",
        "Cream I Rock with Iya Yusuf’s Pantry T-shirt, shown in full.",
      ],
    ],
  },
  {
    slug: "my-roots-have-flavor-shirt",
    name: "My Roots Have Flavor T-shirt",
    description: "Orange T-shirt with the My Roots Have Flavor design.",
    sizes,
    files: [
      [
        "1793650687904blob.jpg",
        "Orange My Roots Have Flavor T-shirt, shown in full.",
      ],
    ],
  },
  {
    slug: "pantry-people-cap",
    name: "Pantry People Cap",
    description:
      "Olive-green cap with Pantry People embroidery and Iya Yusuf’s Pantry details.",
    sizes: [],
    files: [
      [
        "1793650782280blob.jpg",
        "Front of the olive-green Pantry People cap with embroidered shopping cart.",
      ],
      [
        "1793650791867blob.jpg",
        "Side of the olive-green cap with Iya Yusuf’s Pantry embroidery.",
      ],
      [
        "1793650801094blob.jpg",
        "Opposite side of the olive-green cap with Since March 2024 embroidery.",
      ],
    ],
  },
];
const fields = [
  { id: "name", name: "Name", type: "Symbol", required: true },
  {
    id: "slug",
    name: "Slug",
    type: "Symbol",
    required: true,
    validations: [{ unique: true }],
  },
  { id: "description", name: "Description", type: "Text", required: true },
  {
    id: "sizes",
    name: "Confirmed sizes",
    type: "Array",
    items: { type: "Symbol" },
  },
  {
    id: "photos",
    name: "Photos",
    type: "Array",
    required: true,
    items: {
      type: "Link",
      linkType: "Asset",
      validations: [{ linkMimetypeGroup: ["image"] }],
    },
  },
  { id: "sortOrder", name: "Sort order", type: "Integer", required: true },
].map((field) => ({
  localized: false,
  required: false,
  validations: [],
  disabled: false,
  omitted: false,
  ...field,
}));
const [types, locales, allEntries, allAssets] = await Promise.all([
  request("/content_types?limit=1000"),
  request("/locales"),
  request("/entries?limit=1000"),
  request("/assets?limit=1000"),
]);
if (
  allEntries.total > allEntries.items.length ||
  allAssets.total > allAssets.items.length
)
  throw new Error("Paginate the CMS inventory before updating");
const locale = locales.items.find((item) => item.default)?.code;
if (!locale) throw new Error("Missing default locale");
const type = types.items.find((item) => item.sys.id === "pantryMerchPreview");
function published(resource) {
  if (
    resource &&
    (!resource.sys.publishedVersion ||
      resource.sys.version !== resource.sys.publishedVersion + 1)
  )
    throw new Error(`Preserve editor draft: ${resource.sys.id}`);
}
if (type) {
  published(type);
  // An existing model is reusable only with the intended types and links.
  for (const field of fields) {
    const found = type.fields.find((item) => item.id === field.id);
    if (
      !found ||
      found.type !== field.type ||
      found.items?.linkType !== field.items?.linkType
    )
      throw new Error(`Unexpected preview model field: ${field.id}`);
  }
}
const assets = [];
const entries = items.map((item, index) => {
  const photos = item.files.map(([filename, description]) => {
    const assetId = id("asset", `2026-11-03-${filename}`);
    const existing = allAssets.items.find((asset) => asset.sys.id === assetId);
    published(existing);
    if (
      existing &&
      (existing.fields.file?.[locale]?.fileName !== filename ||
        existing.fields.description?.[locale] !== description)
    )
      throw new Error(`Asset has changed: ${assetId}`);
    assets.push({ assetId, filename, description, existing });
    return { sys: { type: "Link", linkType: "Asset", id: assetId } };
  });
  const entryId = id("merch-preview", item.slug);
  const values = Object.fromEntries(
    Object.entries({
      name: item.name,
      slug: item.slug,
      description: item.description,
      ...(item.sizes.length ? { sizes: item.sizes } : {}),
      photos,
      sortOrder: index,
    }).map(([key, value]) => [key, { [locale]: value }]),
  );
  const existing = allEntries.items.find((entry) => entry.sys.id === entryId);
  if (existing?.sys.publishedVersion || existing?.sys.version !== 1)
    published(existing);
  if (existing && !isDeepStrictEqual(existing.fields, values))
    throw new Error(`Preview was edited; preserve it: ${entryId}`);
  if (
    allEntries.items.some(
      (entry) =>
        entry.sys.id !== entryId &&
        entry.sys.contentType?.sys.id === "pantryMerchPreview" &&
        entry.fields.slug?.[locale] === item.slug,
    )
  )
    throw new Error(`Duplicate preview slug: ${item.slug}`);
  return { entryId, values, existing };
});
// Validate all source files before the first remote mutation.
for (const asset of assets)
  asset.bytes = await readFile(`new/${asset.filename}`);
await mkdir(folder, { recursive: true });
const plan = {
  mode: apply ? "apply" : "preview",
  createModel: !type,
  uploadAssets: assets
    .filter((asset) => !asset.existing)
    .map((asset) => asset.filename),
  createEntries: entries
    .filter((entry) => !entry.existing)
    .map((entry) => entry.entryId),
  publishDrafts: entries
    .filter((entry) => entry.existing && !entry.existing.sys.publishedVersion)
    .map((entry) => entry.entryId),
};
await writeFile(`${folder}/merch-plan.json`, JSON.stringify(plan, null, 2));
console.log(JSON.stringify(plan, null, 2));
if (!apply) process.exit(0);
await writeFile(
  `${folder}/merch-backup-${Date.now()}.json`,
  JSON.stringify(
    {
      type,
      entries: entries.map((entry) => entry.existing),
      assets: assets.map((asset) => asset.existing),
    },
    null,
    2,
  ),
);
if (!type) {
  const created = await request("/content_types/pantryMerchPreview", {
    method: "PUT",
    body: {
      name: "Merch preview",
      description:
        "Upcoming merchandise photographs and confirmed sizes. No checkout prices or stock.",
      displayField: "name",
      fields,
    },
  });
  await request("/content_types/pantryMerchPreview/published", {
    method: "PUT",
    version: created.sys.version,
  });
}
for (const asset of assets) {
  if (asset.existing) continue;
  const response = await fetch(
    `https://upload.contentful.com/spaces/${encodeURIComponent(space)}/uploads`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CMA_TOKEN}`,
        "Content-Type": "application/octet-stream",
      },
      body: asset.bytes,
      signal: AbortSignal.timeout(60000),
    },
  );
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  const upload = await response.json();
  let saved = await request(`/assets/${asset.assetId}`, {
    method: "PUT",
    body: {
      fields: {
        title: { [locale]: asset.description },
        description: { [locale]: asset.description },
        file: {
          [locale]: {
            fileName: asset.filename,
            contentType: "image/jpeg",
            uploadFrom: {
              sys: { type: "Link", linkType: "Upload", id: upload.sys.id },
            },
          },
        },
      },
    },
  });
  await request(`/assets/${asset.assetId}/files/${locale}/process`, {
    method: "PUT",
    version: saved.sys.version,
  });
  for (let attempt = 0; attempt < 30; attempt++) {
    saved = await request(`/assets/${asset.assetId}`);
    if (saved.fields.file?.[locale]?.url) break;
    await delay(1000);
  }
  if (!saved.fields.file?.[locale]?.url)
    throw new Error("Image processing timed out");
  await request(`/assets/${asset.assetId}/published`, {
    method: "PUT",
    version: saved.sys.version,
  });
}
for (const entry of entries) {
  if (entry.existing?.sys.publishedVersion) continue;
  const saved =
    entry.existing ??
    (await request(`/entries/${entry.entryId}`, {
      method: "PUT",
      contentType: "pantryMerchPreview",
      body: { fields: entry.values },
    }));
  if (!isDeepStrictEqual(saved.fields, entry.values))
    throw new Error("Unexpected saved preview; not publishing");
  await request(`/entries/${entry.entryId}/published`, {
    method: "PUT",
    version: saved.sys.version,
  });
}
console.log("Merch previews published; no prices, variants or stock created.");
