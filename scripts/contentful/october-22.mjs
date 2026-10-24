// Preview by default; --apply publishes the supplied collage and contact updates.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { setDefaultResultOrder } from "node:dns";
import { setTimeout as delay } from "node:timers/promises";
import { isDeepStrictEqual } from "node:util";
import { management, environmentPath, space } from "./management.mjs";
import { id } from "./export.mjs";

setDefaultResultOrder("ipv4first");
const request = (path, options) => management(environmentPath + path, options);
const folder = "artifacts/client-feedback-2026-10-22";
const filename = "1792604044512blob.jpg";
const photoPath = `public/${filename}`;
const assetId = id("asset", `2026-10-22-${filename}`);
const alt =
  "The hands behind our snacks: a collage of gloved hands preparing snacks, golden snack balls, a woven drying tray and peanuts, from Iya Yusuf’s Pantry.";
const definitions = [
  {
    id: "pantry-ref-9b11b471ae13f768851c5fc09b907900",
    key: "phone",
    before: "Phone number to be supplied",
    after: "+1 713-498-4010",
  },
  {
    id: "pantry-ref-fd955fe3131b026ecf6ca9cbe0145eab",
    key: "copy-31",
    before:
      "Final contact channels will be added when the business details are confirmed.",
    after:
      "Call us with your questions. Our customer support email and WhatsApp details will be added once confirmed.",
  },
  {
    id: "pantry-ref-b859af85cc786ce26c2fb0e0381d3bc1",
    key: "copy-38",
    before: "Placeholder",
    after: "To be confirmed",
  },
  {
    id: "pantry-ref-8617152833dfdd442127dfb341a97b8d",
    key: "copy-39",
    before: "Response times and opening hours need client approval.",
    after:
      "For questions about an order, please include your order number when contacting us.",
  },
];
const bytes = await readFile(photoPath);
const [locales, article, assets, ...entries] = await Promise.all([
  request("/locales"),
  request("/entries/pantry-article-4e0a24727bb71f964626d785"),
  request(`/assets?sys.id=${assetId}`),
  ...definitions.map(({ id }) => request(`/entries/${id}`)),
]);
const locale = locales.items.find((item) => item.default)?.code;
if (!locale) throw new Error("Missing default locale");
function requirePublished(resource) {
  if (
    !resource.sys.publishedVersion ||
    resource.sys.version !== resource.sys.publishedVersion + 1
  )
    throw new Error(`Preserve pending editorial changes: ${resource.sys.id}`);
}
for (const entry of [article, ...entries]) requirePublished(entry);
if (article.fields.slug?.[locale] !== "closer-to-the-source")
  throw new Error("Unexpected sourcing article");
let asset = assets.items[0];
if (asset) {
  requirePublished(asset);
  if (
    asset.fields.file?.[locale]?.fileName !== filename ||
    asset.fields.description?.[locale] !== alt
  )
    throw new Error(
      "Existing collage asset changed; inspect before continuing",
    );
}
const desired = definitions.map((definition, index) => {
  const entry = entries[index];
  const current = entry.fields.text?.[locale];
  if (
    entry.fields.key?.[locale] !== definition.key ||
    ![definition.before, definition.after].includes(current)
  )
    throw new Error(`Contact text changed; inspect ${entry.sys.id}`);
  return { entry, values: { text: definition.after } };
});
desired.push({
  entry: article,
  values: {
    image: { sys: { type: "Link", linkType: "Asset", id: assetId } },
    imageAlt: alt,
  },
});
const changes = desired.flatMap(({ entry, values }) => {
  const changed = Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => !isDeepStrictEqual(entry.fields[key]?.[locale], value),
    ),
  );
  return Object.keys(changed).length ? [{ entry, values: changed }] : [];
});
const plan = {
  mode: process.argv.includes("--apply") ? "apply" : "preview",
  photoPath,
  assetId,
  upload: !asset,
  changes: changes.map(({ entry, values }) => ({
    id: entry.sys.id,
    version: entry.sys.version,
    values,
  })),
};
await mkdir(folder, { recursive: true });
await writeFile(`${folder}/plan.json`, JSON.stringify(plan, null, 2));
console.log(JSON.stringify(plan, null, 2));
if (process.argv.includes("--apply") && (changes.length || !asset)) {
  await writeFile(
    `${folder}/backup-${Date.now()}.json`,
    JSON.stringify({ locale, article, entries, asset }, null, 2),
  );
  if (!asset) {
    const response = await fetch(
      `https://upload.contentful.com/spaces/${encodeURIComponent(space)}/uploads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CMA_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        body: bytes,
        signal: AbortSignal.timeout(60000),
      },
    );
    if (!response.ok)
      throw new Error(`Collage upload failed: HTTP ${response.status}`);
    const upload = await response.json();
    asset = await request(`/assets/${assetId}`, {
      method: "PUT",
      body: {
        fields: {
          title: { [locale]: "The hands behind our snacks — supplied collage" },
          description: { [locale]: alt },
          file: {
            [locale]: {
              fileName: filename,
              contentType: "image/jpeg",
              uploadFrom: {
                sys: { type: "Link", linkType: "Upload", id: upload.sys.id },
              },
            },
          },
        },
      },
    });
    await request(`/assets/${assetId}/files/${locale}/process`, {
      method: "PUT",
      version: asset.sys.version,
    });
    for (let attempt = 0; attempt < 30; attempt++) {
      asset = await request(`/assets/${assetId}`);
      if (asset.fields.file?.[locale]?.url) break;
      await delay(1000);
    }
    if (!asset.fields.file?.[locale]?.url)
      throw new Error("Collage processing timed out");
    asset = await request(`/assets/${assetId}/published`, {
      method: "PUT",
      version: asset.sys.version,
    });
  }
  for (const { entry, values } of changes) {
    const fields = {
      ...entry.fields,
      ...Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          { ...entry.fields[key], [locale]: value },
        ]),
      ),
    };
    const updated = await request(`/entries/${entry.sys.id}`, {
      method: "PUT",
      version: entry.sys.version,
      body: { fields },
    });
    if (!isDeepStrictEqual(updated.fields, fields))
      throw new Error("Unexpected saved fields; draft was not published");
    await request(`/entries/${updated.sys.id}/published`, {
      method: "PUT",
      version: updated.sys.version,
    });
    console.log(`Published ${updated.sys.id}`);
  }
}
