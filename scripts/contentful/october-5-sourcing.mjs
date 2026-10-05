// Read-only by default; --apply updates the supplied sourcing article.
import { mkdir, writeFile } from "node:fs/promises";
import { setDefaultResultOrder } from "node:dns";
import { isDeepStrictEqual } from "node:util";
import { management, environmentPath } from "./management.mjs";
import { richText } from "./models.mjs";

export const sourcingStory = {
  slug: "closer-to-the-source",
  title: "The People Behind Our Ingredients",
  description: "Our story begins with the people who grow our food.",
  paragraphs: [
    "At Iya Yusuf’s Pantry, our story begins with the people who grow our food. Most of our ingredients are grown by us or sourced directly from local farmers who are fairly compensated for their work.",
    "These direct relationships help us keep middlemen out of the process and trace those ingredients back to the farms they came from. It’s a personal connection that matters to us—honoring the hands behind every harvest and bringing a little of that care into your kitchen.",
  ],
};

setDefaultResultOrder("ipv4first");
const request = (path, options) => management(environmentPath + path, options);
const [articles, locales] = await Promise.all([
  request(
    "/entries?content_type=pantryArticle&fields.slug=closer-to-the-source",
  ),
  request("/locales"),
]);
if (articles.items.length !== 1)
  throw new Error("Expected one sourcing article");
const article = articles.items[0];
const locale = locales.items.find((item) => item.default).code;
const fields = (entry) =>
  Object.fromEntries(
    Object.entries(entry.fields).map(([key, value]) => [key, value[locale]]),
  );
const sections = await Promise.all(
  (fields(article).sectionRefs ?? []).map((ref) =>
    request(`/entries/${ref.sys.id}`),
  ),
);
const folder = "artifacts/client-feedback-2026-10-05-sourcing";
await mkdir(folder, { recursive: true });
await writeFile(
  `${folder}/inspection.json`,
  JSON.stringify({ article, sections, locale }, null, 2),
);
if (sections.length !== sourcingStory.paragraphs.length)
  throw new Error("Inspect the changed article structure before updating");
for (const entry of [article, ...sections]) {
  if (
    !entry.sys.publishedVersion ||
    entry.sys.version !== entry.sys.publishedVersion + 1
  )
    throw new Error(`Preserve pending editorial changes: ${entry.sys.id}`);
}
const content = sourcingStory.paragraphs.map((text) => ({ heading: "", text }));
const desired = [
  ...sections.map((entry, index) => ({
    entry,
    values: {
      title: `${sourcingStory.title} / paragraph ${index + 1}`,
      heading: "",
      text: sourcingStory.paragraphs[index],
    },
  })),
  {
    entry: article,
    values: {
      title: sourcingStory.title,
      description: sourcingStory.description,
      sections: content,
      body: richText(content),
      approvalStatus: "approved",
      publicationDate: "2026-10-05T00:00:00Z",
      displayDate: "October 5, 2026",
      readTime: "1 min read",
    },
  },
];
const plan = desired.flatMap(({ entry, values }) => {
  const changed = Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => !isDeepStrictEqual(fields(entry)[key], value),
    ),
  );
  return Object.keys(changed).length ? [{ entry, values: changed }] : [];
});
await writeFile(
  `${folder}/plan.json`,
  JSON.stringify(
    plan.map(({ entry, values }) => ({
      id: entry.sys.id,
      version: entry.sys.version,
      values,
    })),
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      mode: process.argv.includes("--apply") ? "apply" : "plan",
      path: `/blog/${sourcingStory.slug}`,
      entries: plan.length,
      title: sourcingStory.title,
      description: sourcingStory.description,
      paragraphs: sourcingStory.paragraphs,
      image: fields(article).image ?? "Photo coming soon",
    },
    null,
    2,
  ),
);
if (!process.argv.includes("--apply") || !plan.length) process.exit(0);
await writeFile(
  `${folder}/backup-${Date.now()}.json`,
  JSON.stringify({ article, sections, locale }, null, 2),
);
const saved = [];
for (const { entry, values } of plan) {
  const updated = await request(`/entries/${entry.sys.id}`, {
    method: "PUT",
    version: entry.sys.version,
    body: {
      fields: {
        ...entry.fields,
        ...Object.fromEntries(
          Object.entries(values).map(([key, value]) => [
            key,
            { ...entry.fields[key], [locale]: value },
          ]),
        ),
      },
    },
  });
  saved.push({ id: updated.sys.id, version: updated.sys.version });
  await writeFile(`${folder}/saved.json`, JSON.stringify(saved, null, 2));
}
// Publish only our saved versions; publish the parent after its paragraphs.
for (const entry of saved) {
  await request(`/entries/${entry.id}/published`, {
    method: "PUT",
    version: entry.version,
  });
  console.log(`Published sourcing content: ${entry.id}`);
}
