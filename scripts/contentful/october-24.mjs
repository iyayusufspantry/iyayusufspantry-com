// Preview by default. --apply adds the two supplied homepage cover bindings.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { setDefaultResultOrder } from "node:dns";
import { setTimeout as delay } from "node:timers/promises";
import { management, environmentPath, space } from "./management.mjs";
import { id } from "./export.mjs";

setDefaultResultOrder("ipv4first");
const request = (path, options) => management(environmentPath + path, options);
const folder = "artifacts/client-feedback-2026-10-24";
const definitions = [
  {
    field: "communityImage",
    label: "Community stories highlight cover",
    filename: "1792739465552blob.jpg",
    title: "Community stories — supplied food collage",
    description:
      "A collage of golden snacks, a bottled red drink, seasoned rice and a sauced dish, supplied for the pantry community highlight.",
  },
  {
    field: "merchImage",
    label: "Merch highlight cover",
    filename: "1792738286909blob.jpg",
    title: "Merch — supplied Pantry People cap",
    description:
      "Olive-green cap embroidered with Pantry People and a shopping-cart emblem.",
  },
];
function requirePublished(resource) {
  if (
    !resource.sys.publishedVersion ||
    resource.sys.version !== resource.sys.publishedVersion + 1
  )
    throw new Error(`Preserve pending editor changes: ${resource.sys.id}`);
}
const [model, settings, locales] = await Promise.all([
  request("/content_types/pantrySiteSettings"),
  request("/entries?content_type=pantrySiteSettings&limit=1000"),
  request("/locales"),
]);
if (settings.total !== 1 || settings.items.length !== 1)
  throw new Error("Expected exactly one site-settings entry");
const entry = settings.items[0];
const locale = locales.items.find((item) => item.default)?.code;
if (!locale) throw new Error("Missing default locale");
requirePublished(model);
requirePublished(entry);
const covers = await Promise.all(
  definitions.map(async (definition) => {
    const path = `public/assets/simibiat 24 oct/${definition.filename}`;
    const bytes = await readFile(path);
    const assetId = id("asset", `2026-10-24-${definition.filename}`);
    const found = await request(`/assets?sys.id=${assetId}`);
    const asset = found.items[0];
    if (asset) {
      requirePublished(asset);
      if (
        asset.fields.file?.[locale]?.fileName !== definition.filename ||
        asset.fields.description?.[locale] !== definition.description
      )
        throw new Error(`Existing asset changed: ${assetId}`);
    }
    const field = model.fields.find((field) => field.id === definition.field);
    if (
      field &&
      (field.type !== "Link" ||
        field.linkType !== "Asset" ||
        field.required ||
        field.localized ||
        field.disabled ||
        field.omitted)
    )
      throw new Error(`Unexpected cover field: ${definition.field}`);
    const value = { sys: { type: "Link", linkType: "Asset", id: assetId } };
    const current = entry.fields[definition.field]?.[locale];
    if (current && !isDeepStrictEqual(current, value))
      throw new Error(
        `Cover already has a different editor selection: ${definition.field}`,
      );
    return {
      ...definition,
      path,
      bytes,
      assetId,
      asset,
      value,
      changed: !isDeepStrictEqual(current, value),
      hash: createHash("sha256").update(bytes).digest("hex"),
    };
  }),
);
const missing = covers
  .filter((cover) => !model.fields.some((field) => field.id === cover.field))
  .map((cover) => ({
    id: cover.field,
    name: cover.label,
    type: "Link",
    linkType: "Asset",
    localized: false,
    required: false,
    validations: [{ linkMimetypeGroup: ["image"] }],
  }));
const plan = {
  mode: process.argv.includes("--apply") ? "apply" : "preview",
  settingsId: entry.sys.id,
  addFields: missing.map((field) => field.id),
  covers: covers.map(({ field, path, assetId, asset, changed, hash }) => ({
    field,
    path,
    assetId,
    sha256: hash,
    upload: !asset,
    changed,
  })),
};
await mkdir(folder, { recursive: true });
await writeFile(`${folder}/cover-plan.json`, JSON.stringify(plan, null, 2));
console.log(JSON.stringify(plan, null, 2));
if (
  process.argv.includes("--apply") &&
  (missing.length || covers.some((cover) => cover.changed || !cover.asset))
) {
  await writeFile(
    `${folder}/cover-backup-${Date.now()}.json`,
    JSON.stringify(
      { locale, model, entry, assets: covers.map((cover) => cover.asset) },
      null,
      2,
    ),
  );
  // Upload/process assets before changing the schema or published settings.
  for (const cover of covers) {
    if (cover.asset) continue;
    const response = await fetch(
      `https://upload.contentful.com/spaces/${encodeURIComponent(space)}/uploads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CMA_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: cover.bytes,
        signal: AbortSignal.timeout(60000),
      },
    );
    if (!response.ok)
      throw new Error(`Cover upload failed (${response.status})`);
    const upload = await response.json();
    let asset = await request(`/assets/${cover.assetId}`, {
      method: "PUT",
      body: {
        fields: {
          title: { [locale]: cover.title },
          description: { [locale]: cover.description },
          file: {
            [locale]: {
              fileName: cover.filename,
              contentType: "image/jpeg",
              uploadFrom: {
                sys: { type: "Link", linkType: "Upload", id: upload.sys.id },
              },
            },
          },
        },
      },
    });
    await request(`/assets/${cover.assetId}/files/${locale}/process`, {
      method: "PUT",
      version: asset.sys.version,
    });
    for (let attempt = 0; attempt < 30; attempt++) {
      asset = await request(`/assets/${cover.assetId}`);
      if (asset.fields.file?.[locale]?.url) break;
      await delay(1000);
    }
    if (!asset.fields.file?.[locale]?.url)
      throw new Error("Cover processing timed out");
    await request(`/assets/${cover.assetId}/published`, {
      method: "PUT",
      version: asset.sys.version,
    });
  }
  if (missing.length) {
    const updated = await request("/content_types/pantrySiteSettings", {
      method: "PUT",
      version: model.sys.version,
      body: {
        name: model.name,
        description: model.description,
        displayField: model.displayField,
        fields: [...model.fields, ...missing],
      },
    });
    if (
      !isDeepStrictEqual(
        updated.fields.slice(0, model.fields.length),
        model.fields,
      )
    )
      throw new Error("Unexpected schema changes; model was not activated");
    await request("/content_types/pantrySiteSettings/published", {
      method: "PUT",
      version: updated.sys.version,
    });
  }
  if (covers.some((cover) => cover.changed)) {
    const fields = { ...entry.fields };
    for (const cover of covers)
      if (cover.changed)
        fields[cover.field] = { ...fields[cover.field], [locale]: cover.value };
    const updated = await request(`/entries/${entry.sys.id}`, {
      method: "PUT",
      version: entry.sys.version,
      body: { fields },
    });
    if (!isDeepStrictEqual(updated.fields, fields))
      throw new Error("Unexpected settings changes; draft was not published");
    await request(`/entries/${entry.sys.id}/published`, {
      method: "PUT",
      version: updated.sys.version,
    });
  }
  console.log(
    "Published the two homepage cover bindings. No merchandise product was created.",
  );
}
