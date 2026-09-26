import nextEnv from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import {
  referenceModels,
  referenceFields,
  legacyFields,
} from "./reference-models.mjs";
import { planReferences } from "./reference-plan.mjs";
import { mapContent } from "../../lib/content/map";
nextEnv.loadEnvConfig(process.cwd());
const apply = process.argv.includes("--apply");
const space = process.env.CONTENTFUL_SPACE_ID;
const env = process.env.CONTENTFUL_ENVIRONMENT || "master";
if (!space || !process.env.CMA_TOKEN)
  throw new Error("Contentful management configuration missing");
const base = `https://api.contentful.com/spaces/${space}/environments/${env}`;
async function request(resource, method = "GET", body, version, type) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(base + resource, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.CMA_TOKEN}`,
        "Content-Type": "application/vnd.contentful.management.v1+json",
        ...(version !== undefined
          ? { "X-Contentful-Version": String(version) }
          : {}),
        ...(type ? { "X-Contentful-Content-Type": type } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 429 || response.status >= 500) {
      await delay(1000 * (attempt + 1));
      continue;
    }
    if (response.status === 404) return null;
    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `${method} ${resource}: HTTP ${response.status} ${JSON.stringify(error.details || error.sys?.id)}`,
      );
    }
    return response.json();
  }
  throw new Error("Contentful retry limit reached");
}
async function all(kind) {
  const items = [];
  for (let skip = 0; ;) {
    const data = await request(`/${kind}?limit=100&skip=${skip}`);
    items.push(...data.items);
    skip += data.items.length;
    if (skip >= data.total) return items;
  }
}
const [entries, assets, types, locales] = await Promise.all([
  all("entries"),
  all("assets"),
  all("content_types"),
  all("locales"),
]);
const locale = locales.find((l) => l.default).code;
const plan = planReferences(entries, locale);
for (const { entry } of plan.parents)
  if (
    !entry.sys.publishedVersion ||
    entry.sys.version !== entry.sys.publishedVersion + 1
  )
    throw new Error(
      `Resolve unpublished edits before migrating ${entry.sys.id}`,
    );
function unlocalize(rows) {
  return rows.map((e) => ({
    sys: e.sys,
    fields: Object.fromEntries(
      Object.entries(e.fields).map(([k, v]) => [k, v[locale]]),
    ),
  }));
}
const before = mapContent(
  unlocalize(entries.filter((e) => e.sys.publishedVersion)),
  unlocalize(assets),
);
const planned = structuredClone(entries);
for (const { entry, additions } of plan.parents)
  Object.assign(
    planned.find((e) => e.sys.id === entry.sys.id).fields,
    Object.fromEntries(
      Object.entries(additions).map(([k, v]) => [k, { [locale]: v }]),
    ),
  );
for (const child of plan.children) {
  if (!planned.some((e) => e.sys.id === child.id))
    planned.push({
      sys: { id: child.id, contentType: { sys: { id: child.type } } },
      fields: Object.fromEntries(
        Object.entries(child.fields).map(([k, v]) => [k, { [locale]: v }]),
      ),
    });
}
if (
  !isDeepStrictEqual(
    before,
    mapContent(
      unlocalize(
        planned.filter(
          (e) =>
            e.sys.publishedVersion ||
            plan.children.some((c) => c.id === e.sys.id),
        ),
      ),
      unlocalize(assets),
    ),
  )
)
  throw new Error("Migration would change rendered content");
console.log(
  JSON.stringify({
    mode: apply ? "apply" : "plan",
    newTypes: referenceModels.filter(
      (m) => !types.some((t) => t.sys.id === m.id),
    ).length,
    childEntries: plan.children.length,
    parentEntries: plan.parents.length,
    renderedContent: "identical",
  }),
);
if (!apply) process.exit(0);
await mkdir("artifacts/contentful", { recursive: true });
await writeFile(
  `artifacts/contentful/references-before-${Date.now()}.json`,
  JSON.stringify({ entries, assets, types }, null, 2),
);
// Add fields without deleting/retyping the old schema. Old deployments still render.
for (const definition of [
  ...referenceModels,
  ...Object.entries(referenceFields).map(([id, fields]) => ({ id, fields })),
]) {
  const existing = types.find((t) => t.sys.id === definition.id);
  const fields = existing
    ? structuredClone(existing.fields)
    : definition.fields;
  if (existing)
    for (const f of definition.fields)
      if (!fields.some((v) => v.id === f.id)) fields.push(f);
  for (const f of fields)
    if (legacyFields[definition.id]?.includes(f.id)) {
      f.disabled = true;
      f.required = false;
    }
  if (!existing || !isDeepStrictEqual(fields, existing.fields)) {
    const data = await request(
      "/content_types/" + definition.id,
      "PUT",
      {
        name: existing?.name || definition.name,
        description: existing?.description || definition.description,
        displayField: existing?.displayField || definition.displayField,
        fields,
      },
      existing?.sys.version,
    );
    await request(
      "/content_types/" + definition.id + "/published",
      "PUT",
      undefined,
      data.sys.version,
    );
    console.log("Activated model " + definition.id);
  }
  const editor = await request(
    "/content_types/" + definition.id + "/editor_interface",
  );
  const controls = [...(editor.controls || [])];
  for (const f of definition.fields) {
    if (f.disabled) continue;
    const widgetId =
      f.type === "Array" && f.items?.linkType === "Entry"
        ? "entryLinksEditor"
        : f.type === "Text"
          ? "multipleLine"
          : undefined;
    if (!widgetId) continue;
    const control = {
      fieldId: f.id,
      widgetNamespace: "builtin",
      widgetId,
      settings: {
        helpText:
          f.id === "text"
            ? "Edit the displayed wording. Keep placeholders such as {0} unchanged."
            : "Open a linked entry to edit it. Publish it when ready; drag entries to reorder.",
      },
    };
    const index = controls.findIndex((c) => c.fieldId === f.id);
    if (index < 0) controls.push(control);
    else controls[index] = { ...controls[index], ...control };
  }
  if (!isDeepStrictEqual(controls, editor.controls))
    await request(
      "/content_types/" + definition.id + "/editor_interface",
      "PUT",
      {
        controls,
        ...(editor.editorLayout ? { editorLayout: editor.editorLayout } : {}),
      },
      editor.sys.version,
    );
}
let count = 0;
async function publishChild(child) {
  let current = entries.find((e) => e.sys.id === child.id);
  const fields = Object.fromEntries(
    Object.entries(child.fields)
      .filter(([, v]) => v !== "")
      .map(([k, v]) => [k, { [locale]: v }]),
  );
  if (current) {
    if (!isDeepStrictEqual(current.fields, fields))
      throw new Error(`Existing migration child differs: ${child.id}`);
    if (
      current.sys.publishedVersion &&
      current.sys.version !== current.sys.publishedVersion + 1
    )
      throw new Error("Pending child edits must be resolved");
  } else
    current = await request(
      "/entries/" + child.id,
      "PUT",
      { fields },
      undefined,
      child.type,
    );
  if (!current.sys.publishedVersion)
    await request(
      "/entries/" + child.id + "/published",
      "PUT",
      undefined,
      current.sys.version,
    );
  if (++count % 50 === 0)
    console.log(`Published ${count}/${plan.children.length} linked entries`);
}
// Independent child entries can be published concurrently. Parent writes wait
// for every child; a failed batch stops before any parent references change.
for (let i = 0; i < plan.children.length; i += 4) {
  const results = await Promise.allSettled(
    plan.children.slice(i, i + 4).map(publishChild),
  );
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
}
// Fresh version check before changing each parent; concurrent editor changes stop the run.
for (const { entry, additions } of plan.parents) {
  const current = await request("/entries/" + entry.sys.id);
  if (current.sys.version !== entry.sys.version)
    throw new Error(`Parent changed during migration: ${entry.sys.id}`);
  const updated = await request(
    "/entries/" + entry.sys.id,
    "PUT",
    {
      fields: {
        ...current.fields,
        ...Object.fromEntries(
          Object.entries(additions).map(([k, v]) => [k, { [locale]: v }]),
        ),
      },
    },
    current.sys.version,
  );
  await request(
    "/entries/" + entry.sys.id + "/published",
    "PUT",
    undefined,
    updated.sys.version,
  );
}
const afterEntries = await all("entries");
if (
  !isDeepStrictEqual(
    before,
    mapContent(
      unlocalize(afterEntries.filter((e) => e.sys.publishedVersion)),
      unlocalize(assets),
    ),
  )
)
  throw new Error("Post-migration render verification failed");
console.log(
  "Migration complete; mapped published content is unchanged. Legacy fields retained and hidden in the editor.",
);
