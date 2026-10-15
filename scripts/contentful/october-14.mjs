// Preview by default. --apply publishes only the requested weight and new category.
import { setDefaultResultOrder } from "node:dns";
import { mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { management, environmentPath } from "./management.mjs";
import { id } from "./export.mjs";

setDefaultResultOrder("ipv4first");
const request = (path, options) => management(environmentPath + path, options);
const [products, categories, locales] = await Promise.all([
  request("/entries?content_type=pantryProduct&limit=1000"),
  request("/entries?content_type=pantryCategory&limit=1000"),
  request("/locales"),
]);
if (
  products.total > products.items.length ||
  categories.total > categories.items.length
)
  throw new Error("Incomplete catalog inspection");
const locale = locales.items.find((item) => item.default).code;
const fields = (entry) =>
  Object.fromEntries(
    Object.entries(entry.fields).map(([key, value]) => [key, value[locale]]),
  );
const matches = products.items.filter(
  (entry) => fields(entry).name?.trim().toLowerCase() === "chin chin",
);
if (matches.length !== 1)
  throw new Error("Expected exactly one supplied Chin Chin listing");
const chinChin = matches[0];
if (!["jar", "7 oz jar"].includes(fields(chinChin).unit))
  throw new Error("The Chin Chin pack size changed; inspect before updating");
const merch = categories.items.filter(
  (entry) => fields(entry).slug === "merch",
);
if (merch.length > 1) throw new Error("Duplicate merch category");
const category = merch[0];
const desired = [
  {
    entry: chinChin,
    type: "pantryProduct",
    entryId: chinChin.sys.id,
    values: { unit: "7 oz jar" },
  },
  {
    entry: category,
    type: "pantryCategory",
    entryId: category?.sys.id ?? id("category", "merch"),
    values: {
      name: "Merch",
      slug: "merch",
      description: "Aprons, tote bags, T-shirts, hats and stickers.",
      icon: "merch",
      sortOrder: category
        ? fields(category).sortOrder
        : Math.max(
            0,
            ...categories.items.map(
              (entry) => Number(fields(entry).sortOrder) || 0,
            ),
          ) + 1,
      approvalStatus: "approved",
    },
  },
];
const plan = desired.flatMap((item) => {
  const changed = Object.fromEntries(
    Object.entries(item.values).filter(
      ([key, value]) =>
        !isDeepStrictEqual(item.entry && fields(item.entry)[key], value),
    ),
  );
  if (!Object.keys(changed).length) return [];
  if (
    item.entry &&
    (!item.entry.sys.publishedVersion ||
      item.entry.sys.version !== item.entry.sys.publishedVersion + 1)
  )
    throw new Error(`Preserve editor draft: ${item.entryId}`);
  return [{ ...item, values: changed }];
});
const folder = "artifacts/client-feedback-2026-10-14";
await mkdir(folder, { recursive: true });
await writeFile(
  `${folder}/plan.json`,
  JSON.stringify(
    plan.map(({ entry, ...item }) => ({
      ...item,
      version: entry?.sys.version,
    })),
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      mode: process.argv.includes("--apply") ? "apply" : "preview",
      chinChin: {
        name: fields(chinChin).name,
        slug: fields(chinChin).slug,
        unit: fields(chinChin).unit,
        samplePrice: fields(chinChin).samplePrice,
        sizes: fields(chinChin).sizes,
      },
      changes: plan.map(({ entryId, values }) => ({ id: entryId, values })),
    },
    null,
    2,
  ),
);
if (!process.argv.includes("--apply") || !plan.length) process.exit(0);
await writeFile(
  `${folder}/backup-${Date.now()}.json`,
  JSON.stringify(
    { locale, entries: desired.map((item) => item.entry ?? null) },
    null,
    2,
  ),
);
for (const item of plan) {
  const updated = await request(`/entries/${item.entryId}`, {
    method: "PUT",
    version: item.entry?.sys.version,
    contentType: item.entry ? undefined : item.type,
    body: {
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
  });
  await request(`/entries/${updated.sys.id}/published`, {
    method: "PUT",
    version: updated.sys.version,
  });
  console.log(`Published ${item.entryId}`);
}
