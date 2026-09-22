import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { root } from "./export.mjs";

const require = createRequire(import.meta.url);
createRequire(require.resolve("next/package.json"))("@next/env").loadEnvConfig(
  root,
);
const manifest = JSON.parse(
  await readFile(path.join(root, "artifacts/contentful/manifest.json"), "utf8"),
);
const base = `https://api.contentful.com/spaces/${encodeURIComponent(process.env.CONTENTFUL_SPACE_ID)}/environments/${encodeURIComponent(process.env.CONTENTFUL_ENVIRONMENT || "master")}`;
async function all(resource) {
  const items = [];
  for (let skip = 0; ; skip += 100) {
    const response = await fetch(`${base}/${resource}?limit=100&skip=${skip}`, {
      headers: { Authorization: `Bearer ${process.env.CMA_TOKEN}` },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(
        `Contentful verification: ${resource} HTTP ${response.status}`,
      );
    const data = await response.json();
    items.push(...data.items);
    if (items.length >= data.total) return items;
  }
}
const [entries, assets, locales, types] = await Promise.all([
  all("entries"),
  all("assets"),
  all("locales"),
  all("content_types"),
]);
const locale = locales.find((l) => l.default).code;
const differences = [];
for (const expected of manifest.entries) {
  const actual = entries.find((e) => e.sys.id === expected.id);
  if (!actual) {
    differences.push(`${expected.id}: missing`);
    continue;
  }
  for (const [key, value] of Object.entries(expected.fields)) {
    const saved = actual.fields[key]?.[locale];
    // Contentful omits empty optional arrays when storing entries.
    if (Array.isArray(value) && value.length === 0 && saved === undefined)
      continue;
    if (!isDeepStrictEqual(value, saved))
      differences.push(`${expected.id}.${key}`);
  }
}
for (const expected of manifest.assets) {
  const actual = assets.find((a) => a.sys.id === expected.id);
  const file = actual?.fields.file?.[locale];
  if (!file?.url || file.details?.size !== expected.size)
    differences.push(`${expected.id}: asset processing/size mismatch`);
}
for (const expected of manifest.models) {
  const actual = types.find((t) => t.sys.id === expected.id);
  if (actual?.sys.publishedVersion === undefined)
    differences.push(`${expected.id}: content type not active`);
}
const report = {
  verifiedAt: new Date().toISOString(),
  contentTypes: manifest.models.length,
  entries: manifest.entries.length,
  assets: manifest.assets.length,
  differences,
  passed: differences.length === 0,
};
await writeFile(
  path.join(root, "artifacts/contentful/verification-report.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
