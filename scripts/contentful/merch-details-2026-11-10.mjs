// Preview by default. Update confirmed display details and draft product totals;
// never allocate shirt sizes, create sale variants, or reset operational stock.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { setDefaultResultOrder } from "node:dns";
import { isDeepStrictEqual } from "node:util";
import { management, environmentPath } from "./management.mjs";

setDefaultResultOrder("ipv4first");
const request = (path, options) => management(environmentPath + path, options);
const intake = JSON.parse(
  await readFile("docs/starting-stock-merch-2026-11-10.json", "utf8"),
);
const previous = JSON.parse(
  await readFile("docs/starting-stock-merch-2026-11-04.json", "utf8"),
);
if (
  intake.products.length !== 3 ||
  new Set(intake.products.map((item) => item.slug)).size !== 3 ||
  intake.products.some(
    (item) =>
      !previous.products.some((old) => old.slug === item.slug) ||
      item.startingQuantity !== 12 ||
      item.priceCents !== (item.slug.endsWith("-shirt") ? 2500 : 3500),
  ) ||
  intake.totalUnits !== 36
)
  throw new Error("Unexpected November 10 merch intake");
const [locales, model, products, previews, variants] = await Promise.all([
  request("/locales"),
  request("/content_types/pantryMerchPreview"),
  request("/entries?content_type=pantryProduct&limit=1000"),
  request("/entries?content_type=pantryMerchPreview&limit=1000"),
  request("/entries?content_type=pantryVariant&limit=1000"),
]);
for (const collection of [products, previews, variants])
  if (collection.total !== collection.items.length)
    throw new Error("Incomplete CMS inventory");
const locale = locales.items.find((item) => item.default)?.code;
if (!locale) throw new Error("Missing default locale");
function cleanPublished(resource) {
  if (
    !resource.sys.publishedVersion ||
    resource.sys.version !== resource.sys.publishedVersion + 1
  )
    throw new Error(`Preserve unpublished changes: ${resource.sys.id}`);
}
cleanPublished(model);
const priceField = model.fields.find((field) => field.id === "priceCents");
if (
  priceField &&
  (priceField.type !== "Integer" ||
    priceField.localized ||
    priceField.required ||
    priceField.disabled ||
    priceField.omitted)
)
  throw new Error("Unexpected preview price field");
const changes = [];
for (const item of intake.products) {
  const old = previous.products.find((entry) => entry.slug === item.slug);
  for (const [kind, collection] of [
    ["product", products],
    ["preview", previews],
  ]) {
    const matches = collection.items.filter(
      (entry) => entry.fields.slug?.[locale] === item.slug,
    );
    if (matches.length !== 1)
      throw new Error(`Ambiguous ${kind}: ${item.slug}`);
    const existing = matches[0];
    if (kind === "product") {
      if (
        existing.sys.publishedVersion ||
        variants.items.some(
          (variant) =>
            variant.fields.product?.[locale]?.sys.id === existing.sys.id,
        )
      )
        throw new Error(`Sale product needs inventory review: ${item.slug}`);
      const quantity = existing.fields.startingQuantity?.[locale];
      if (![old.startingQuantity, item.startingQuantity].includes(quantity))
        throw new Error(`Product quantity changed: ${item.slug}`);
    } else cleanPublished(existing);
    const currentSizes = existing.fields.sizes?.[locale] ?? [];
    if (
      !isDeepStrictEqual(currentSizes, old.sizes) &&
      !isDeepStrictEqual(currentSizes, item.sizes)
    )
      throw new Error(`Sizes changed: ${item.slug}`);
    const field = kind === "product" ? "samplePrice" : "priceCents";
    const price = kind === "product" ? item.priceCents / 100 : item.priceCents;
    const currentPrice = existing.fields[field]?.[locale];
    if (currentPrice !== undefined && currentPrice !== price)
      throw new Error(`Price changed: ${item.slug}`);
    const fields = structuredClone(existing.fields);
    fields[field] = { ...fields[field], [locale]: price };
    fields.sizes = { ...fields.sizes, [locale]: item.sizes };
    if (kind === "product")
      fields.startingQuantity = {
        ...fields.startingQuantity,
        [locale]: item.startingQuantity,
      };
    changes.push({
      kind,
      slug: item.slug,
      existing,
      fields,
      changed: !isDeepStrictEqual(fields, existing.fields),
    });
  }
}
const apply = process.argv.includes("--apply");
const folder = "artifacts/merch-details-2026-11-10";
await mkdir(folder, { recursive: true });
const plan = {
  mode: apply ? "apply" : "preview",
  addPreviewPriceField: !priceField,
  quantityBasis: intake.quantityBasis,
  products: intake.products,
  changes: changes.map(({ kind, slug, changed }) => ({ kind, slug, changed })),
  publication: "Publish display previews only; sale products remain drafts",
  operationalInventoryChanged: false,
};
await writeFile(`${folder}/plan.json`, JSON.stringify(plan, null, 2));
console.log(JSON.stringify(plan, null, 2));
if (!apply) process.exit(0);
await writeFile(
  `${folder}/backup-${Date.now()}.json`,
  JSON.stringify(
    { locale, model, entries: changes.map((c) => c.existing) },
    null,
    2,
  ),
);
if (!priceField) {
  const saved = await request("/content_types/pantryMerchPreview", {
    method: "PUT",
    version: model.sys.version,
    body: {
      name: model.name,
      description: model.description,
      displayField: model.displayField,
      fields: [
        ...model.fields,
        {
          id: "priceCents",
          name: "Confirmed display price (USD cents)",
          type: "Integer",
          localized: false,
          required: false,
          disabled: false,
          omitted: false,
          validations: [{ range: { min: 0 } }],
        },
      ],
    },
  });
  await request("/content_types/pantryMerchPreview/published", {
    method: "PUT",
    version: saved.sys.version,
  });
}
for (const change of changes) {
  if (!change.changed) continue;
  const saved = await request(`/entries/${change.existing.sys.id}`, {
    method: "PUT",
    version: change.existing.sys.version,
    body: { fields: change.fields },
  });
  if (!isDeepStrictEqual(saved.fields, change.fields))
    throw new Error(`Unexpected saved fields: ${change.slug}`);
  if (change.kind === "preview")
    await request(`/entries/${saved.sys.id}/published`, {
      method: "PUT",
      version: saved.sys.version,
    });
}
for (const change of changes) {
  const saved = await request(`/entries/${change.existing.sys.id}`);
  if (!isDeepStrictEqual(saved.fields, change.fields))
    throw new Error(`Verification failed: ${change.slug}`);
  if (change.kind === "preview") cleanPublished(saved);
  else if (saved.sys.publishedVersion)
    throw new Error(`Product unexpectedly published: ${change.slug}`);
}
await writeFile(`${folder}/verified.json`, JSON.stringify(plan, null, 2));
console.log(
  "Verified prices, cap size and draft totals. No sale variants or stock changed.",
);
