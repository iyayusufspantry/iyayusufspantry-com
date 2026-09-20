import {
  cp,
  mkdir,
  readdir,
  readFile,
  writeFile,
  access,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";

const [milestone, stage] = process.argv.slice(2);
if (
  ![milestone, stage].every(
    (value) =>
      typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,60}$/.test(value),
  )
)
  throw new Error(
    "Usage: npm run archive:milestone -- 01-foundations after (letters, digits and hyphens only)",
  );
const destination = path.resolve("artifacts/milestones", milestone, stage);
const sources = [
  ["artifacts/screenshots", "screenshots"],
  ["playwright-report", "test-report"],
  [
    "artifacts/pdf/Simbiat-Foundation-Progress.pdf",
    "Simbiat-Foundation-Progress.pdf",
  ],
  ["docs/development-log.md", "development-log.md"],
  ["docs/production-foundations.md", "production-foundations.md"],
  ["docs/content-model.md", "content-model.md"],
  ["docs/product-intake.csv", "product-intake.csv"],
];
for (const [source] of sources) await access(source);
await mkdir(path.dirname(destination), { recursive: true });
// No recursive flag: an existing stage is an error, not an overwrite.
await mkdir(destination);
for (const [source, target] of sources)
  await cp(source, path.join(destination, target), { recursive: true });
async function files(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await files(target)));
    else output.push(target);
  }
  return output;
}
const hashes = [];
for (const file of await files(destination))
  hashes.push({
    path: path.relative(destination, file).replaceAll("\\", "/"),
    sha256: createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
  });
const manifest = {
  milestone,
  stage,
  capturedAt: new Date().toISOString(),
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  workingTreeStatus: execFileSync("git", ["status", "--short"], {
    encoding: "utf8",
  }).trim(),
  note: "Local evidence archive. See development-log.md for validation results and production limitations. Source commit may have uncommitted changes, listed above.",
  files: hashes,
};
await writeFile(
  path.join(destination, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(`Milestone archived: ${destination} (${hashes.length} files)`);
