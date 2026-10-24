// Preview by default. --apply publishes only the client's corrected jar label.
import { setDefaultResultOrder } from "node:dns";
import { mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { management, environmentPath } from "./management.mjs";

setDefaultResultOrder("ipv4first");
const request = (path, options) => management(environmentPath + path, options);
const [products, locales] = await Promise.all([
  request("/entries?content_type=pantryProduct&limit=1000"),
  request("/locales"),
]);
if (products.total !== products.items.length)
  throw new Error("Incomplete catalog inspection");
const locale = locales.items.find((item) => item.default)?.code;
if (!locale) throw new Error("Missing default locale");
const matches = products.items.filter(
  (entry) => entry.fields.slug?.[locale] === "classic-chin-chin",
);
if (matches.length !== 1)
  throw new Error("Expected exactly one supplied Chin Chin listing");
const entry = matches[0];
const previous = entry.fields.unit?.[locale];
if (!["7 oz jar", "16 oz jar"].includes(previous))
  throw new Error("The Chin Chin jar label changed; inspect before updating");
if (
  !entry.sys.publishedVersion ||
  entry.sys.version !== entry.sys.publishedVersion + 1
)
  throw new Error("Preserve the unpublished Chin Chin editor draft");
const changed = previous !== "16 oz jar";
const apply = process.argv.includes("--apply");
const folder = "artifacts/client-feedback-2026-10-16";
await mkdir(folder, { recursive: true });
const plan = {
  mode: apply ? "apply" : "preview",
  entryId: entry.sys.id,
  slug: entry.fields.slug[locale],
  previous,
  changes: changed ? { unit: "16 oz jar" } : {},
  samplePrice: entry.fields.samplePrice?.[locale],
  sizes: entry.fields.sizes?.[locale],
  version: entry.sys.version,
};
await writeFile(`${folder}/plan.json`, JSON.stringify(plan, null, 2));
console.log(JSON.stringify(plan, null, 2));
if (apply && changed) {
  await writeFile(
    `${folder}/backup-${Date.now()}.json`,
    JSON.stringify({ locale, entry }, null, 2),
  );
  const updated = await request(`/entries/${entry.sys.id}`, {
    method: "PUT",
    version: entry.sys.version,
    body: {
      fields: {
        ...entry.fields,
        unit: { ...entry.fields.unit, [locale]: "16 oz jar" },
      },
    },
  });
  const { unit: oldUnit, ...otherBefore } = entry.fields;
  const { unit: newUnit, ...otherAfter } = updated.fields;
  if (
    !isDeepStrictEqual(otherBefore, otherAfter) ||
    !isDeepStrictEqual(newUnit, { ...oldUnit, [locale]: "16 oz jar" })
  )
    throw new Error("Unexpected field changes; saved draft was not published");
  await request(`/entries/${updated.sys.id}/published`, {
    method: "PUT",
    version: updated.sys.version,
  });
  console.log(`Published jar label for ${entry.sys.id}`);
}
