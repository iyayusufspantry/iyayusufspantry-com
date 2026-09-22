import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const id = (type, key) =>
  `pantry-${type}-${createHash("sha256").update(key).digest("hex").slice(0, 24)}`;
// Archived import source only; never imported by the application.
export async function createManifest() {
  return JSON.parse(
    await readFile(new URL("./seed.json", import.meta.url), "utf8"),
  );
}

export function validateManifest(manifest) {
  const entryIds = new Set(manifest.entries.map((e) => e.id));
  const assetIds = new Set(manifest.assets.map((a) => a.id));
  if (
    entryIds.size !== manifest.entries.length ||
    assetIds.size !== manifest.assets.length
  )
    throw new Error("Duplicate migration IDs");
  function validateLinks(value) {
    if (!value || typeof value !== "object") return;
    if (
      value.sys?.type === "Link" &&
      !(value.sys.linkType === "Asset" ? assetIds : entryIds).has(value.sys.id)
    )
      throw new Error(`Unresolved reference: ${value.sys.id}`);
    Object.values(value).forEach(validateLinks);
  }
  for (const entry of manifest.entries) {
    const model = manifest.models.find((m) => m.id === entry.contentType);
    if (!model) throw new Error(`Unknown content type ${entry.contentType}`);
    for (const f of model.fields)
      if (
        f.required &&
        (entry.fields[f.id] === undefined || entry.fields[f.id] === "")
      )
        throw new Error(`Missing ${entry.id}.${f.id}`);
    for (const field of Object.keys(entry.fields))
      if (!model.fields.some((f) => f.id === field))
        throw new Error(`Unknown field ${entry.contentType}.${field}`);
    validateLinks(entry.fields);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const manifest = await createManifest();
  validateManifest(manifest);
  await mkdir(path.join(root, "artifacts/contentful"), { recursive: true });
  await writeFile(
    path.join(root, "artifacts/contentful/manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        models: manifest.models.length,
        assets: manifest.assets.length,
        entries: manifest.entries.length,
        counts: Object.fromEntries(
          manifest.models.map((m) => [
            m.name,
            manifest.entries.filter((e) => e.contentType === m.id).length,
          ]),
        ),
      },
      null,
      2,
    ),
  );
}
