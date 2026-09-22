import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createManifest, validateManifest, root } from "./export.mjs";

const manifest = await createManifest();

test("all catalog variants retain immutable IDs, exact cents, and product links", async () => {
  const source = JSON.parse(
    await readFile(
      path.join(root, "scripts/contentful/fixtures/product-variants.json"),
      "utf8",
    ),
  );
  const variants = manifest.entries.filter(
    (e) => e.contentType === "pantryVariant",
  );
  assert.equal(variants.length, source.length);
  for (const original of source) {
    const imported = variants.find((v) => v.fields.variantId === original.id);
    assert.equal(imported.fields.priceCents, original.priceCents);
    assert.equal(imported.fields.currency, original.currency);
    const product = manifest.entries.find(
      (e) => e.id === imported.fields.product.sys.id,
    );
    assert.equal(product.fields.slug, original.productSlug);
  }
});

test("the complete import resolves every relationship and preserves sample status", () => {
  validateManifest(manifest);
  for (const entry of manifest.entries)
    if (entry.contentType !== "pantryNavigation")
      assert.equal(entry.fields.approvalStatus, "sample");
  assert.equal(manifest.assets.length, 16);
});

test("missing linked content stops the import before external writes", () => {
  const invalid = structuredClone(manifest);
  invalid.entries = invalid.entries.filter(
    (e) => e.contentType !== "pantryCategory",
  );
  assert.throws(() => validateManifest(invalid), /Unresolved reference/);
});

test("duplicate identifiers and unknown fields cannot silently corrupt imported data", () => {
  const duplicate = structuredClone(manifest);
  duplicate.entries.push(duplicate.entries[0]);
  assert.throws(() => validateManifest(duplicate), /Duplicate/);
  const extraField = structuredClone(manifest);
  extraField.entries[0].fields.unexpected = "value";
  assert.throws(() => validateManifest(extraField), /Unknown field/);
});

test("brand auth copy is included and private files are outside the import boundary", () => {
  const layout = manifest.entries.find(
    (e) => e.fields.key === "app/layout.tsx",
  );
  assert.ok(
    layout.fields.content.blocks.some((b) => b.text === "Welcome back"),
  );
  assert.ok(
    manifest.entries.every(
      (e) =>
        !e.fields.content?.source ||
        /^(app|components)\//.test(e.fields.content.source),
    ),
  );
  assert.ok(
    manifest.assets.every((a) => /^public\/(assets|brand)\//.test(a.file)),
  );
  assert.ok(
    !manifest.entries.some((e) =>
      /order|stock|session|customer/i.test(e.contentType),
    ),
  );
});
