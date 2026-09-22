import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { isDeepStrictEqual } from "node:util";
import { createManifest, validateManifest, root } from "./export.mjs";

const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(
  root,
);
const apply = process.argv.includes("--apply");
const publish = process.argv.includes("--publish");
const refreshSource = process.argv.includes("--refresh-source");
const space = process.env.CONTENTFUL_SPACE_ID;
const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
const token = process.env.CMA_TOKEN;
const report = {
  environment,
  mode: apply ? (publish ? "publish" : "draft") : "plan",
  modelsCreated: 0,
  modelsActivated: 0,
  assetsCreated: 0,
  assetsPublished: 0,
  entriesCreated: 0,
  entriesUpdated: 0,
  entriesPublished: 0,
  preserved: [],
  completed: false,
};
const output = path.join(root, "artifacts/contentful");

if (!space || !token)
  throw new Error(
    "Configure CONTENTFUL_SPACE_ID and CMA_TOKEN before migration.",
  );
const base = `https://api.contentful.com/spaces/${encodeURIComponent(space)}/environments/${encodeURIComponent(environment)}`;

async function request(
  resource,
  {
    method = "GET",
    body,
    version,
    headers = {},
    allow404 = false,
    upload = false,
  } = {},
) {
  const url = upload
    ? `https://upload.contentful.com/spaces/${encodeURIComponent(space)}/uploads`
    : `${base}${resource}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    let response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": upload
            ? "application/octet-stream"
            : "application/vnd.contentful.management.v1+json",
          ...(version === undefined
            ? {}
            : { "X-Contentful-Version": String(version) }),
          ...headers,
        },
        ...(body === undefined
          ? {}
          : { body: upload ? body : JSON.stringify(body) }),
        signal: AbortSignal.timeout(60000),
      });
    } catch (error) {
      const code = error.cause?.code || error.name;
      if (attempt === 5)
        throw new Error(`${method} ${resource}: network failure (${code})`);
      console.log(`Retrying ${method} ${resource} after ${code}`);
      await delay((attempt + 1) * 1000);
      continue;
    }
    if (response.status === 429 || response.status >= 500) {
      await delay(
        Math.min(
          10000,
          (Number(response.headers.get("x-contentful-ratelimit-reset")) ||
            attempt + 1) * 1000,
        ),
      );
      continue;
    }
    if (response.status === 404 && allow404) return null;
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const code = data.sys?.id || "UnknownError";
      // Never print headers, request bodies, tokens, or complete error objects.
      const paths = data.details?.errors?.map((e) => ({
        name: e.name,
        path: e.path,
      }));
      throw new Error(
        `${method} ${resource}: HTTP ${response.status} ${code}${paths ? ` ${JSON.stringify(paths)}` : ""}`,
      );
    }
    return data;
  }
  throw new Error(`Retries exhausted: ${method} ${resource}`);
}

async function collection(resource) {
  const items = [];
  for (let skip = 0; ; skip += 100) {
    const result = await request(`${resource}?limit=100&skip=${skip}`);
    items.push(...result.items);
    if (items.length >= result.total) return items;
  }
}

const localized = (fields, locale) =>
  Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, { [locale]: value }]),
  );
const versionHeaders = (item) => item.sys.version;
const needsPublish = (item) =>
  item.sys.publishedVersion === undefined ||
  item.sys.version > item.sys.publishedVersion + 1;

async function migrate() {
  let lastImport;
  try {
    lastImport = JSON.parse(
      await readFile(path.join(output, "last-import.json"), "utf8"),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const manifest = await createManifest();
  validateManifest(manifest);
  await mkdir(output, { recursive: true });
  await writeFile(
    path.join(output, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  const [types, assets, entries, locales] = await Promise.all([
    collection("/content_types"),
    collection("/assets"),
    collection("/entries"),
    collection("/locales"),
  ]);
  const locale = locales.find((l) => l.default)?.code;
  if (!locale)
    throw new Error("The Contentful environment has no default locale.");
  report.locale = locale;
  report.planned = {
    contentTypes: manifest.models.length,
    assets: manifest.assets.length,
    entries: manifest.entries.length,
  };
  report.existing = {
    contentTypes: types.length,
    assets: assets.length,
    entries: entries.length,
  };
  console.log(
    JSON.stringify({
      environment,
      locale,
      planned: report.planned,
      existing: report.existing,
      apply,
      publish,
    }),
  );
  if (!apply) return;

  // Keep a timestamped snapshot before mutations; never remove existing records.
  await writeFile(
    path.join(output, `before-${Date.now()}.json`),
    JSON.stringify({ types, assets, entries }, null, 2),
  );
  const typeMap = new Map(types.map((t) => [t.sys.id, t]));
  for (const model of manifest.models) {
    if (typeMap.has(model.id)) {
      const existing = typeMap.get(model.id);
      if (
        existing.name !== model.name ||
        existing.displayField !== model.displayField
      )
        throw new Error(`Content type ID collision: ${model.id}`);
      continue;
    }
    const { id, ...body } = model;
    // Create all targets before adding circular product/recipe/variant references.
    body.fields = body.fields.filter(
      (f) => f.type !== "Link" && f.items?.type !== "Link",
    );
    const created = await request(`/content_types/${id}`, {
      method: "PUT",
      body,
    });
    typeMap.set(id, created);
    report.modelsCreated++;
  }
  for (const model of manifest.models) {
    let existing = typeMap.get(model.id);
    if (existing.sys.publishedVersion !== undefined) {
      // An existing activated model belongs to the editor; do not alter it.
      for (const f of model.fields) {
        const actual = existing.fields.find((a) => a.id === f.id);
        if (!actual || actual.type !== f.type || actual.linkType !== f.linkType)
          throw new Error(`Incompatible existing model: ${model.id}.${f.id}`);
      }
      continue;
    }
    const { id, ...body } = model;
    existing = await request(`/content_types/${id}`, {
      method: "PUT",
      version: versionHeaders(existing),
      body,
    });
    await request(`/content_types/${id}/published`, {
      method: "PUT",
      version: versionHeaders(existing),
    });
    report.modelsActivated++;
    console.log(`Activated content type: ${model.name}`);
  }

  const assetMap = new Map(assets.map((a) => [a.sys.id, a]));
  for (const asset of manifest.assets) {
    let existing = assetMap.get(asset.id);
    if (!existing) {
      const upload = await request("/uploads", {
        method: "POST",
        upload: true,
        body: await readFile(path.join(root, asset.file)),
      });
      existing = await request(`/assets/${asset.id}`, {
        method: "PUT",
        body: {
          fields: localized(
            {
              title: asset.title,
              description: asset.description,
              file: {
                contentType: asset.contentType,
                fileName: path.basename(asset.file),
                uploadFrom: {
                  sys: { type: "Link", linkType: "Upload", id: upload.sys.id },
                },
              },
            },
            locale,
          ),
        },
      });
      report.assetsCreated++;
    }
    if (!existing.fields.file?.[locale]?.url) {
      await request(
        `/assets/${asset.id}/files/${encodeURIComponent(locale)}/process`,
        { method: "PUT", version: versionHeaders(existing) },
      );
      for (let tries = 0; tries < 30; tries++) {
        await delay(1500);
        existing = await request(`/assets/${asset.id}`);
        if (existing.fields.file?.[locale]?.url) break;
      }
      if (!existing.fields.file?.[locale]?.url)
        throw new Error(`Asset processing did not complete: ${asset.file}`);
    }
    if (publish && needsPublish(existing)) {
      // Never publish editor changes from a previous run implicitly.
      if (
        assetMap.has(asset.id) &&
        (existing.fields.title?.[locale] !== asset.title ||
          existing.fields.description?.[locale] !== asset.description ||
          existing.fields.file?.[locale]?.details?.size !== asset.size)
      )
        report.preserved.push(`asset:${asset.id}`);
      else {
        await request(`/assets/${asset.id}/published`, {
          method: "PUT",
          version: versionHeaders(existing),
        });
        report.assetsPublished++;
      }
    }
    console.log(`Imported asset: ${asset.file}`);
  }

  const entryMap = new Map(entries.map((e) => [e.sys.id, e]));
  const createdEntries = [];
  for (const entry of manifest.entries) {
    if (entryMap.has(entry.id)) {
      if (entryMap.get(entry.id).sys.contentType.sys.id !== entry.contentType)
        throw new Error(`Entry ID collision: ${entry.id}`);
      const existing = entryMap.get(entry.id);
      const previous = lastImport?.entries.find((e) => e.id === entry.id);
      const matches = (seed) =>
        seed &&
        Object.keys(existing.fields).every((key) => key in seed.fields) &&
        Object.entries(seed.fields).every(([key, value]) => {
          const saved = existing.fields[key];
          if (Array.isArray(value) && value.length === 0 && !saved) return true;
          return isDeepStrictEqual(saved, { [locale]: value });
        });
      if (refreshSource && matches(previous) && !matches(entry)) {
        const updated = await request(`/entries/${entry.id}`, {
          method: "PUT",
          version: versionHeaders(existing),
          body: { fields: localized(entry.fields, locale) },
        });
        createdEntries.push(updated);
        report.entriesUpdated++;
      } else if (publish && matches(entry) && needsPublish(existing)) {
        createdEntries.push(existing);
      } else report.preserved.push(`entry:${entry.id}`);
      continue;
    }
    const created = await request(`/entries/${entry.id}`, {
      method: "PUT",
      headers: { "X-Contentful-Content-Type": entry.contentType },
      body: { fields: localized(entry.fields, locale) },
    });
    createdEntries.push(created);
    report.entriesCreated++;
    if (report.entriesCreated % 10 === 0)
      console.log(
        `Created ${report.entriesCreated}/${manifest.entries.length} entries`,
      );
  }
  if (publish)
    for (const entry of createdEntries) {
      await request(`/entries/${entry.sys.id}/published`, {
        method: "PUT",
        version: versionHeaders(entry),
      });
      report.entriesPublished++;
    }
  const [finalTypes, finalAssets, finalEntries] = await Promise.all([
    collection("/content_types"),
    collection("/assets"),
    collection("/entries"),
  ]);
  const assertIds = (expected, actual, label) => {
    const ids = new Set(actual.map((i) => i.sys.id));
    if (expected.some((e) => !ids.has(e.id)))
      throw new Error(`${label} verification failed`);
  };
  assertIds(manifest.models, finalTypes, "Content type");
  assertIds(manifest.assets, finalAssets, "Asset");
  assertIds(manifest.entries, finalEntries, "Entry");
  report.verified = {
    contentTypes: finalTypes.length,
    assets: finalAssets.length,
    entries: finalEntries.length,
  };
  report.completed = true;
  await writeFile(
    path.join(output, "last-import.json"),
    JSON.stringify(manifest, null, 2),
  );
}

try {
  await migrate();
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
} finally {
  await mkdir(output, { recursive: true });
  await writeFile(
    path.join(output, "migration-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
