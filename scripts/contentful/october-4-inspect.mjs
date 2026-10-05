// Read-only intake snapshot; credentials and private configuration are not printed.
import { management, environmentPath } from "./management.mjs";
import { mkdir, writeFile } from "node:fs/promises";

const [entries, assets, types, locales] = await Promise.all(
  [
    "entries?limit=1000",
    "assets?limit=1000",
    "content_types?limit=1000",
    "locales",
  ].map((resource) => management(`${environmentPath}/${resource}`)),
);
const locale = locales.items.find((item) => item.default).code;
await mkdir("artifacts/client-feedback-2026-10-04", { recursive: true });
await writeFile(
  "artifacts/client-feedback-2026-10-04/current.json",
  JSON.stringify(
    {
      entries: entries.items,
      assets: assets.items,
      types: types.items,
      locales: locales.items,
    },
    null,
    2,
  ),
);
for (const entry of entries.items.filter((item) =>
  ["pantryProduct", "pantryRecipe", "pantryPage"].includes(
    item.sys.contentType.sys.id,
  ),
)) {
  const fields = Object.fromEntries(
    Object.entries(entry.fields).map(([key, value]) => [key, value[locale]]),
  );
  console.log(
    JSON.stringify({
      id: entry.sys.id,
      type: entry.sys.contentType.sys.id,
      version: entry.sys.version,
      published: entry.sys.publishedVersion,
      slug: fields.slug,
      name: fields.name || fields.title,
      unit: fields.unit,
    }),
  );
}
