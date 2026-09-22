// Add the runtime bindings without replacing existing editorial content.
import { readFile, writeFile } from "node:fs/promises";
import { management, environmentPath } from "./management.mjs";
import { id, root } from "./export.mjs";
import path from "node:path";
const manifest = JSON.parse(
  await readFile(new URL("./seed.json", import.meta.url), "utf8"),
);
const roles = {
  assortment: "/assets/IMG_2998.jpeg",
  snackJars: "/assets/IMG_6415.jpeg",
  coconut: "/assets/IMG_3005.jpeg",
  drinks: "/assets/IMG_5211.jpeg",
  palmOil: "/assets/IMG_3083.jpeg",
};
const remoteModel = await management(
  `${environmentPath}/content_types/pantrySiteSettings`,
);
const fields = Object.keys(roles).map((role) => ({
  id: `${role}Image`,
  name: `${role} image`,
  type: "Link",
  linkType: "Asset",
  localized: false,
  required: false,
}));
const missing = fields.filter(
  (f) => !remoteModel.fields.some((existing) => existing.id === f.id),
);
if (missing.length) {
  const model = await management(
    `${environmentPath}/content_types/pantrySiteSettings`,
    {
      method: "PUT",
      version: remoteModel.sys.version,
      body: {
        name: remoteModel.name,
        displayField: remoteModel.displayField,
        description: remoteModel.description,
        fields: [...remoteModel.fields, ...missing],
      },
    },
  );
  await management(
    `${environmentPath}/content_types/pantrySiteSettings/published`,
    { method: "PUT", version: model.sys.version },
  );
}
const seedModel = manifest.models.find((m) => m.id === "pantrySiteSettings");
for (const f of fields)
  if (!seedModel.fields.some((existing) => existing.id === f.id))
    seedModel.fields.push(f);
let count = 0;
for (const seed of manifest.entries) {
  const additions =
    seed.fields.content?.blocks?.filter((b) =>
      /^(extra|label|default|template)-/.test(b.key),
    ) || [];
  if (seed.contentType !== "pantrySiteSettings" && !additions.length) continue;
  const entry = await management(`${environmentPath}/entries/${seed.id}`);
  // Never publish someone else's pending draft edits.
  if (
    entry.sys.publishedVersion !== undefined &&
    entry.sys.version !== entry.sys.publishedVersion + 1
  )
    throw new Error(
      `Publish or resolve pending editorial changes before connecting ${seed.id}`,
    );
  let changed = false;
  if (seed.contentType === "pantrySiteSettings") {
    for (const [role, src] of Object.entries(roles)) {
      const name = `${role}Image`;
      const value = {
        sys: { type: "Link", linkType: "Asset", id: id("asset", src) },
      };
      seed.fields[name] = value;
      if (!entry.fields[name]) {
        entry.fields[name] = { "en-US": value };
        changed = true;
      }
    }
  } else {
    const blocks = entry.fields.content["en-US"].blocks;
    for (const block of additions)
      if (!blocks.some((b) => b.key === block.key)) {
        blocks.push(block);
        changed = true;
      }
  }
  if (!changed) continue;
  const saved = await management(`${environmentPath}/entries/${seed.id}`, {
    method: "PUT",
    version: entry.sys.version,
    body: { fields: entry.fields },
  });
  await management(`${environmentPath}/entries/${seed.id}/published`, {
    method: "PUT",
    version: saved.sys.version,
  });
  count++;
}
await writeFile(
  new URL("./seed.json", import.meta.url),
  JSON.stringify(manifest, null, 2),
);
await writeFile(
  path.join(root, "artifacts/contentful/manifest.json"),
  JSON.stringify(manifest, null, 2),
);
console.log(
  `Connected and published ${count} content entries. Existing text preserved.`,
);
