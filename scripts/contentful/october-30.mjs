// Preview by default. --apply publishes only the requested Nigerian dates copy.
import { mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { setDefaultResultOrder } from "node:dns";
import { management, environmentPath } from "./management.mjs";

setDefaultResultOrder("ipv4first");
const request = (path, options) => management(environmentPath + path, options);
const [products, locales] = await Promise.all([
  request("/entries?content_type=pantryProduct&fields.slug=tiger-nut-drink"),
  request("/locales"),
]);
if (products.total !== 1 || products.items.length !== 1)
  throw new Error("Expected exactly one Tiger Nut Drink listing");
const locale = locales.items.find((item) => item.default)?.code;
if (!locale) throw new Error("Missing default locale");
const entry = products.items[0];
if (
  !entry.sys.publishedVersion ||
  entry.sys.version !== entry.sys.publishedVersion + 1
)
  throw new Error("Preserve the unpublished Tiger Nut Drink editor draft");

const previous = {
  description:
    "Creamy, mellow, and gently spiced—our tiger nut drink blends tiger nuts and water with ginger, cloves, cinnamon, and the sweetness of honey. Enjoy chilled for a refreshing taste of tradition.",
  ingredients:
    "Ingredients: tiger nuts, water, ginger, cloves, cinnamon, and honey.",
};
const corrected = {
  description:
    "Creamy, mellow, and gently spiced—our tiger nut drink blends tiger nuts, Nigerian dates, and water with ginger, cloves, cinnamon, and the sweetness of honey. Enjoy chilled for a refreshing taste of tradition.",
  ingredients:
    "Ingredients: tiger nuts, Nigerian dates, water, ginger, cloves, cinnamon, and honey.",
};
const fields = structuredClone(entry.fields);
const changes = {};
for (const [key, value] of Object.entries(corrected)) {
  const current = entry.fields[key]?.[locale];
  if (current !== previous[key] && current !== value)
    throw new Error(`Unexpected ${key}; inspect before updating`);
  if (current !== value) {
    fields[key][locale] = value;
    changes[key] = { previous: current, corrected: value };
  }
}
const apply = process.argv.includes("--apply");
const folder = "artifacts/client-feedback-2026-10-30";
await mkdir(folder, { recursive: true });
const plan = {
  mode: apply ? "apply" : "preview",
  entryId: entry.sys.id,
  version: entry.sys.version,
  changes,
};
await writeFile(`${folder}/plan.json`, JSON.stringify(plan, null, 2));
console.log(JSON.stringify(plan, null, 2));
if (apply && Object.keys(changes).length) {
  await writeFile(
    `${folder}/product-backup-${Date.now()}.json`,
    JSON.stringify({ locale, entry }, null, 2),
  );
  const updated = await request(`/entries/${entry.sys.id}`, {
    method: "PUT",
    version: entry.sys.version,
    body: { fields },
  });
  if (!isDeepStrictEqual(updated.fields, fields))
    throw new Error("Unexpected saved fields; draft was not published");
  await request(`/entries/${entry.sys.id}/published`, {
    method: "PUT",
    version: updated.sys.version,
  });
  console.log(`Published Nigerian dates correction for ${entry.sys.id}`);
}
