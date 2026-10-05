// Remaining requests from the October 4 Last Pictures thread.
// Plan by default; --apply saves drafts; --apply --publish-staged publishes
// exactly the reviewed saved versions. Email exports stay in ignored artifacts.
import nextEnv from "@next/env";
import { setDefaultResultOrder } from "node:dns";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { id } from "./export.mjs";
setDefaultResultOrder("ipv4first");
nextEnv.loadEnvConfig(process.cwd());
const folder = "artifacts/client-feedback-2026-10-05-catalog";
const stagedPath = `${folder}/staged.json`;
const apply = process.argv.includes("--apply");
const space = process.env.CONTENTFUL_SPACE_ID;
const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
if (!space || !process.env.CMA_TOKEN)
  throw Error("Missing management configuration");
const base = `https://api.contentful.com/spaces/${space}/environments/${environment}`;
async function request(resource, method = "GET", body, version, type) {
  const upload = resource === "/uploads";
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(
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
    if (r.status === 429 || r.status >= 500) {
      await delay(1000 * (attempt + 1));
      continue;
    }
    if (r.status === 404) return null;
    if (!r.ok) throw Error(`${method} ${resource}: HTTP ${r.status}`);
    return r.status === 204 ? null : r.json();
  }
  throw Error(`Retry limit: ${resource}`);
}
async function all(kind) {
  const items = [];
  for (let skip = 0; ;) {
    const r = await request(`/${kind}?limit=1000&skip=${skip}`);
    items.push(...r.items);
    skip += r.items.length;
    if (skip >= r.total) return items;
    if (!r.items.length) throw Error(`Incomplete ${kind}`);
  }
}
if (process.argv.includes("--publish-staged")) {
  if (!apply)
    throw Error("Use --apply --publish-staged after inspecting drafts");
  const staged = JSON.parse(await readFile(stagedPath, "utf8"));
  if (
    !staged.complete ||
    staged.space !== space ||
    staged.environment !== environment
  )
    throw Error("Incomplete batch or wrong environment");
  for (const item of staged.items) {
    const current = await request(`/${item.kind}/${item.id}`);
    item.done =
      current?.sys.publishedVersion === item.version &&
      current?.sys.version === item.version + 1;
    if (!item.done && current?.sys.version !== item.version)
      throw Error(`Saved version changed: ${item.id}`);
  }
  for (const item of [...staged.items].sort((a, b) => a.order - b.order)) {
    if (!item.done)
      await request(
        `/${item.kind}/${item.id}/published`,
        "PUT",
        undefined,
        item.version,
      );
    console.log(`Published: ${item.id}`);
  }
  process.exit(0);
}
if (apply && existsSync(stagedPath))
  throw Error("Batch already staged; inspect before publishing or resuming");
const [entries, assets, locales] = await Promise.all(
  ["entries", "assets", "locales"].map(all),
);
const locale = locales.find((l) => l.default).code;
const fields = (e) =>
  Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k, v[locale]]));
const link = (entryId, linkType = "Entry") => ({
  sys: { type: "Link", linkType, id: entryId },
});
const product = (slug) => {
  const e = entries.find(
    (e) =>
      e.sys.contentType.sys.id === "pantryProduct" && fields(e).slug === slug,
  );
  if (!e) throw Error(`Missing product: ${slug}`);
  return e;
};
const clean = (e) => {
  if (
    e &&
    (!e.sys.publishedVersion || e.sys.version !== e.sys.publishedVersion + 1)
  )
    throw Error(`Preserve editor draft: ${e.sys.id}`);
};
const plan = [];
function change(entryId, type, values, order = 3) {
  const entry = entries.find((e) => e.sys.id === entryId);
  clean(entry);
  const changed = Object.fromEntries(
    Object.entries(values).filter(
      ([k, v]) =>
        !isDeepStrictEqual(entry && fields(entry)[k], v) &&
        !(
          entry &&
          fields(entry)[k] === undefined &&
          Array.isArray(v) &&
          !v.length
        ),
    ),
  );
  if (Object.keys(changed).length)
    plan.push({ id: entryId, type, values: changed, entry, order });
}
const photoSpecs = [
  {
    key: "garri",
    path: "public/assets/4 october/1791077388401blob.jpg",
    alt: "Garri piled in a blue bowl.",
    date: "2026-10-04",
  },
  {
    key: "tigerNutsHand",
    path: "public/assets/4 october/1791077409334blob.jpg",
    alt: "A handful of tiger nuts.",
    date: "2026-10-04",
  },
  {
    key: "hibiscus",
    path: "public/assets/5 october/CC9B93FF-7F62-46C8-8FEA-F3A96BF66D65.png",
    alt: "Dried hibiscus flowers piled in a blue bowl.",
    date: "2026-10-05",
  },
];
const uploads = [];
const photoRefs = Object.fromEntries(
  photoSpecs.map((photo) => {
    const assetId = id("asset", `${photo.date}-${basename(photo.path)}`);
    const existing = assets.find((a) => a.sys.id === assetId);
    clean(existing);
    if (!existing)
      uploads.push({ ...photo, id: assetId, filename: basename(photo.path) });
    return [photo.key, link(assetId, "Asset")];
  }),
);
for (const asset of uploads) await readFile(asset.path);
const garri = product("white-garri");
change(garri.sys.id, "pantryProduct", { photos: [photoRefs.garri] });
const tiger = product("tiger-nuts");
change(tiger.sys.id, "pantryProduct", {
  photos: [
    ...(fields(tiger).photos || []).filter(
      (r) => r.sys.id !== photoRefs.tigerNutsHand.sys.id,
    ),
    photoRefs.tigerNutsHand,
  ],
});
const hibiscus = product("dried-hibiscus");
const variantId = "dried-hibiscus:1 oz:Standard";
const variantEntryId = id("variant", variantId);
change(
  variantEntryId,
  "pantryVariant",
  {
    variantId,
    product: link(hibiscus.sys.id),
    size: "1 oz",
    dietary: "Standard",
    priceCents: 300,
    currency: "USD",
    active: true,
    approvalStatus: "approved",
  },
  2,
);
for (const e of entries.filter(
  (e) =>
    e.sys.contentType.sys.id === "pantryVariant" &&
    fields(e).product?.sys.id === hibiscus.sys.id &&
    fields(e).active &&
    e.sys.id !== variantEntryId,
))
  change(e.sys.id, "pantryVariant", { active: false }, 2);
change(hibiscus.sys.id, "pantryProduct", {
  name: "Dried Hibiscus Flower",
  description:
    "Tart, vibrant red calyxes used worldwide for herbal teas, refreshing aguas frescas, and culinary recipes.",
  unit: "1 oz",
  usage: "Use for herbal teas, refreshing aguas frescas, and culinary recipes.",
  ingredients: "",
  allergens: "",
  sizes: ["1 oz"],
  dietary: ["Standard"],
  samplePrice: 3,
  variants: [link(variantEntryId)],
  photos: [photoRefs.hibiscus],
  approvalStatus: "approved",
});
await mkdir(folder, { recursive: true });
await writeFile(
  `${folder}/plan.json`,
  JSON.stringify(
    {
      uploads,
      entries: plan.map(({ entry, ...item }) => ({
        ...item,
        previousVersion: entry?.sys.version,
      })),
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
      entries: plan.map((p) => ({ id: p.id, changes: Object.keys(p.values) })),
    },
    null,
    2,
  ),
);
if (!apply) process.exit(0);
await writeFile(
  `${folder}/backup-${Date.now()}.json`,
  JSON.stringify({ entries, assets, locale }, null, 2),
);
const staged = { space, environment, complete: false, items: [] };
const save = () => writeFile(stagedPath, JSON.stringify(staged, null, 2));
await save();
for (const asset of uploads) {
  const upload = await request("/uploads", "POST", await readFile(asset.path));
  const created = await request(`/assets/${asset.id}`, "PUT", {
    fields: {
      title: { [locale]: `Client photo - ${asset.key}` },
      description: { [locale]: asset.alt },
      file: {
        [locale]: {
          fileName: asset.filename,
          contentType: "image/png",
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
    throw Error(`Processing timeout: ${asset.filename}`);
  staged.items.at(-1).version = processed.sys.version;
  await save();
  assets.push(processed);
}
for (const item of plan) {
  const updated = await request(
    `/entries/${item.id}`,
    "PUT",
    {
      fields: {
        ...item.entry?.fields,
        ...Object.fromEntries(
          Object.entries(item.values).map(([k, v]) => [
            k,
            { ...item.entry?.fields[k], [locale]: v },
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
  const index = entries.findIndex((e) => e.sys.id === item.id);
  if (index === -1) entries.push(updated);
  else entries[index] = updated;
}
const flatten = (rows) => rows.map((e) => ({ sys: e.sys, fields: fields(e) }));
await writeFile(
  `${folder}/preview-content.json`,
  JSON.stringify({
    entries: flatten(
      entries.filter(
        (e) => e.sys.publishedVersion || plan.some((p) => p.id === e.sys.id),
      ),
    ),
    assets: flatten(assets),
  }),
);
staged.complete = true;
await save();
console.log("Drafts saved; inspect before publishing.");
