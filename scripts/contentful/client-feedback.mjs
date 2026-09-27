// Apply Simbiat's September 27 feedback without restoring archived seed content.
// Run without --apply to inspect; --apply saves drafts and a local preview snapshot.
// After deploying the display code, --apply --publish-staged publishes saved versions.
import nextEnv from "@next/env";
import { existsSync } from "node:fs";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { id } from "./export.mjs";

nextEnv.loadEnvConfig(process.cwd());
const apply = process.argv.includes("--apply");
const stagedPath = "artifacts/client-feedback/staged.json";
const space = process.env.CONTENTFUL_SPACE_ID;
const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
if (!space || !process.env.CMA_TOKEN)
  throw new Error("Missing Contentful management configuration");
const base = `https://api.contentful.com/spaces/${space}/environments/${environment}`;
async function request(resource, method = "GET", body, version, type) {
  const upload = resource === "/uploads";
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(
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
        signal: AbortSignal.timeout(30000),
      },
    );
    if (response.status === 429 || response.status >= 500) {
      await delay(1000 * (attempt + 1));
      continue;
    }
    if (response.status === 404) return null;
    if (!response.ok)
      throw new Error(`${method} ${resource}: HTTP ${response.status}`);
    return response.status === 204 ? null : response.json();
  }
  throw new Error(`Retry limit: ${resource}`);
}
async function all(kind) {
  const items = [];
  for (let skip = 0; ;) {
    const data = await request(`/${kind}?limit=1000&skip=${skip}`);
    items.push(...data.items);
    skip += data.items.length;
    if (skip >= data.total) return items;
  }
}
if (process.argv.includes("--publish-staged")) {
  if (!apply)
    throw new Error(
      "Use --apply --publish-staged after deploying the display code",
    );
  const staged = JSON.parse(await readFile(stagedPath, "utf8"));
  if (staged.space !== space || staged.environment !== environment)
    throw new Error("Staged content belongs to another environment");
  // Check the whole batch before publishing; never publish later editor changes.
  for (const item of staged.items) {
    const current = await request(`/${item.kind}/${item.id}`);
    item.alreadyPublished =
      current.sys.publishedVersion === item.version &&
      current.sys.version === item.version + 1;
    if (!item.alreadyPublished && current.sys.version !== item.version)
      throw new Error(`Staged version changed: ${item.id}`);
  }
  for (const item of staged.items) {
    if (item.alreadyPublished) continue;
    await request(
      `/${item.kind}/${item.id}/published`,
      "PUT",
      undefined,
      item.version,
    );
    console.log(`Published ${item.kind}: ${item.id}`);
  }
  process.exit(0);
}
if (apply && existsSync(stagedPath))
  throw new Error(
    "Feedback is already staged. Use --apply --publish-staged after deploying the display code.",
  );
const [entries, locales, articleModel] = await Promise.all([
  all("entries"),
  all("locales"),
  request("/content_types/pantryArticle"),
]);
const locale = locales.find((l) => l.default).code;
const fields = (entry) =>
  Object.fromEntries(
    Object.entries(entry.fields).map(([key, value]) => [key, value[locale]]),
  );
const link = (entryId, linkType = "Entry") => ({
  sys: { type: "Link", linkType, id: entryId },
});
const plan = [];
function change(entry, values) {
  if (!entry) throw new Error("Expected Contentful entry is missing");
  if (
    entry.sys.publishedVersion &&
    entry.sys.version !== entry.sys.publishedVersion + 1
  )
    throw new Error(`Preserve pending editor changes: ${entry.sys.id}`);
  const changed = Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => !isDeepStrictEqual(fields(entry)[key], value),
    ),
  );
  if (Object.keys(changed).length)
    plan.push({
      id: entry.sys.id,
      type: entry.sys.contentType.sys.id,
      values: changed,
      entry,
    });
}
function create(type, key, values) {
  const entryId = id(type.replace("pantry", "").toLowerCase(), key);
  const existing = entries.find((e) => e.sys.id === entryId);
  // Preserve subsequent editorial changes on reruns.
  if (!existing) plan.push({ id: entryId, type, values });
  return entryId;
}
function copy(source, key, text) {
  const parent = entries.find(
    (e) =>
      (fields(e).source || fields(e).content?.source) === source &&
      fields(e).textBlocks,
  );
  const item = fields(parent)
    .textBlocks.map((ref) => entries.find((e) => e.sys.id === ref.sys.id))
    .find((e) => fields(e).key === key);
  change(item, { text });
}
copy("app/page.tsx", "copy-8", "Experience authentic");
copy("app/page.tsx", "copy-9", "Nigerian");
copy("app/page.tsx", "copy-10", "foods.");
copy(
  "app/page.tsx",
  "copy-11",
  "A taste of home. A world of good food. Discover Nigerian pantry essentials, familiar snacks, and drinks that bring you closer to home.",
);
copy(
  "app/page.tsx",
  "copy-22",
  "Explore your favorites, from pantry essentials to drinks.",
);
copy(
  "components/site-shell.tsx",
  "copy-28",
  "Experience authentic Nigerian foods.",
);
copy(
  "components/site-shell.tsx",
  "copy-29",
  "A taste of home. A world of good food.",
);
copy("components/content-browser.tsx", "copy-20", "Stories labeled as samples");
const settings = entries.find(
  (e) => e.sys.contentType.sys.id === "pantrySiteSettings",
);
change(settings, { tagline: "Experience authentic Nigerian foods." });
create("pantryCategory", "drinks", {
  name: "Drinks",
  slug: "drinks",
  description: "A refreshing taste of home.",
  icon: "drinks",
  sortOrder: 5,
  approvalStatus: "approved",
});

const poem =
  "Kookoo roo koo. The sound of the early bird is not the only thing striking the air. The pestle calls, and the hot yams answer quietly, a melody that is all too famous. Efo ebolo, eja yinyan, and Ponmo, the pot holds all kinds of mouthwatering delicacies as each bite unlocks a memory of times past. An eager yearning that satisfies and fills the heart is born. Iya Yusuf’s Pantry is a bridge that connects Nigeria to you, bringing to life what was once a memory.";
const sectionId = create("pantrySection", "kookoo-roo-koo-poem", {
  title: "Kookoo roo koo / Poem by Yusuf Sanni",
  text: poem,
});
const assetId = id("asset", "yusuf-sanni-portrait");
const articleId = create("pantryArticle", "kookoo-roo-koo", {
  title: "Kookoo roo koo",
  slug: "kookoo-roo-koo",
  category: "Poetry",
  description:
    "A poem by Yusuf Sanni about Nigerian food, memory, and the connection to home.",
  author: "Yusuf Sanni",
  displayDate: "September 27, 2026",
  publicationDate: "2026-09-27",
  readTime: "1 min read",
  image: link(assetId, "Asset"),
  imageAlt: "Yusuf Sanni leaning on a wooden railing beneath a blue sky.",
  sectionRefs: [link(sectionId)],
  referenceVersion: 1,
  sortOrder: -1,
  approvalStatus: "approved",
});
const home = entries.find((e) => fields(e).route === "/");
const featured = fields(home).featuredArticles || [];
if (!featured.some((ref) => ref.sys.id === articleId))
  change(home, {
    featuredArticles: [link(articleId), ...featured].slice(0, 3),
  });
const asset = await request(`/assets/${assetId}`);
console.log(
  JSON.stringify(
    {
      mode: apply ? "draft" : "plan",
      authorField: !articleModel.fields.some((f) => f.id === "author"),
      portrait: asset ? "exists" : "upload supplied portrait",
      entries: plan.map(({ id, type, values }) => ({ id, type, values })),
    },
    null,
    2,
  ),
);
if (!apply) process.exit(0);
const staged = { space, environment, items: [] };
const previewEntries = structuredClone(entries);
await mkdir("artifacts/client-feedback", { recursive: true });
await writeFile(
  `artifacts/client-feedback/backup-${Date.now()}.json`,
  JSON.stringify(
    {
      entries: plan.filter((p) => p.entry).map((p) => p.entry),
      articleModel,
      asset,
    },
    null,
    2,
  ),
);
if (!articleModel.fields.some((f) => f.id === "author")) {
  const updated = await request(
    "/content_types/pantryArticle",
    "PUT",
    {
      name: articleModel.name,
      description: articleModel.description,
      displayField: articleModel.displayField,
      fields: [
        ...articleModel.fields,
        {
          id: "author",
          name: "Author",
          type: "Symbol",
          localized: false,
          required: false,
          validations: [],
        },
      ],
    },
    articleModel.sys.version,
  );
  await request(
    "/content_types/pantryArticle/published",
    "PUT",
    undefined,
    updated.sys.version,
  );
}
if (!asset) {
  const upload = await request(
    "/uploads",
    "POST",
    await readFile("public/assets/yusuf-sanni.png"),
  );
  const created = await request(`/assets/${assetId}`, "PUT", {
    fields: {
      title: { [locale]: "Yusuf Sanni" },
      description: {
        [locale]: "Yusuf Sanni leaning on a wooden railing beneath a blue sky.",
      },
      file: {
        [locale]: {
          fileName: "yusuf-sanni.png",
          contentType: "image/png",
          uploadFrom: link(upload.sys.id, "Upload"),
        },
      },
    },
  });
  await request(
    `/assets/${assetId}/files/${locale}/process`,
    "PUT",
    undefined,
    created.sys.version,
  );
  let processed;
  for (let attempt = 0; attempt < 30; attempt++) {
    processed = await request(`/assets/${assetId}`);
    if (processed.fields.file[locale].url) break;
    await delay(1000);
  }
  if (!processed.fields.file[locale].url)
    throw new Error("Portrait processing did not finish");
  staged.items.push({
    kind: "assets",
    id: assetId,
    version: processed.sys.version,
  });
}
for (const item of plan) {
  const updated = await request(
    `/entries/${item.id}`,
    "PUT",
    {
      fields: {
        ...item.entry?.fields,
        ...Object.fromEntries(
          Object.entries(item.values).map(([key, value]) => [
            key,
            { [locale]: value },
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
  });
  const index = previewEntries.findIndex((e) => e.sys.id === item.id);
  if (index === -1) previewEntries.push(updated);
  else previewEntries[index] = updated;
  await writeFile(stagedPath, JSON.stringify(staged, null, 2));
  console.log(`Saved draft ${item.type}: ${item.id}`);
}
const flatten = (rows) =>
  rows.map((entry) => ({ sys: entry.sys, fields: fields(entry) }));
await writeFile(
  "artifacts/client-feedback/preview-content.json",
  JSON.stringify({
    entries: flatten(previewEntries),
    assets: flatten(await all("assets")),
  }),
);
console.log(
  "Client feedback staged. Publish saved versions only after deploying the display code. Live content is unchanged.",
);
