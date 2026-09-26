import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mapContent } from "../../lib/content/map";
import { planReferences } from "./reference-plan.mjs";
const seed = JSON.parse(await readFile("scripts/contentful/seed.json", "utf8"));
function setup() {
  const original = seed.entries.map((e) => ({
    sys: { id: e.id, contentType: { sys: { id: e.contentType } } },
    fields: e.fields,
  }));
  const managed = original.map((e) => ({
    ...e,
    fields: Object.fromEntries(
      Object.entries(e.fields).map(([k, v]) => [k, { "en-US": v }]),
    ),
  }));
  const plan = planReferences(managed, "en-US");
  const entries = structuredClone(original);
  for (const p of plan.parents)
    Object.assign(
      entries.find((e) => e.sys.id === p.entry.sys.id).fields,
      p.additions,
    );
  for (const c of plan.children)
    entries.push({
      sys: { id: c.id, contentType: { sys: { id: c.type } } },
      fields: c.fields,
    });
  const assets = seed.assets.map((a) => ({
    sys: { id: a.id },
    fields: {
      title: a.title,
      description: a.description,
      file: { url: `https://images.ctfassets.net/test/${a.id}/image.jpg` },
    },
  }));
  return { entries, original, assets };
}
test("reference migration preserves every displayed value and plans no duplicate entries on rerun", () => {
  const { entries, original, assets } = setup();
  assert.deepEqual(mapContent(entries, assets), mapContent(original, assets));
  const managed = entries.map((e) => ({
    ...e,
    fields: Object.fromEntries(
      Object.entries(e.fields).map(([k, v]) => [k, { "en-US": v }]),
    ),
  }));
  assert.deepEqual(planReferences(managed, "en-US"), {
    children: [],
    parents: [],
  });
});
test("linked text, sections, menus and settings override archived JSON; section order is preserved", () => {
  const { entries, assets } = setup();
  const resolve = (ref) => entries.find((e) => e.sys.id === ref.sys.id);
  const home = entries.find((e) => e.fields.route === "/");
  resolve(home.fields.textBlocks[0]).fields.text = "New homepage wording";
  const policy = entries.find((e) => e.fields.kind === "privacy");
  policy.fields.sectionRefs.reverse();
  resolve(policy.fields.sectionRefs[0]).fields.heading = "New first heading";
  const nav = entries.find((e) => e.fields.key === "main");
  resolve(nav.fields.linkRefs[0]).fields.label = "New label";
  const settings = entries.find(
    (e) => e.sys.contentType?.sys.id === "pantrySiteSettings",
  );
  resolve(settings.fields.contactRefs[0]).fields.text = "owner@example.com";
  const result = mapContent(entries, assets);
  assert.ok(
    Object.values(result.copy["app/page.tsx"]).includes("New homepage wording"),
  );
  assert.equal(result.policies.privacy.sections[0][0], "New first heading");
  assert.equal(result.navigation.main[0][0], "New label");
  assert.equal(result.settings.contactDetails.email, "owner@example.com");
});
test("unpublished and explicitly cleared reference lists never restore stale JSON", () => {
  const { entries, assets } = setup();
  const policy = entries.find((e) => e.fields.kind === "privacy");
  const ids = policy.fields.sectionRefs.map((r) => r.sys.id);
  assert.deepEqual(
    mapContent(
      entries.filter((e) => !ids.includes(e.sys.id)),
      assets,
    ).policies.privacy.sections,
    [],
  );
  policy.fields.sectionRefs = [];
  assert.deepEqual(mapContent(entries, assets).policies.privacy.sections, []);
  delete policy.fields.sectionRefs;
  assert.deepEqual(mapContent(entries, assets).policies.privacy.sections, []);
});
test("wrong linked content types and unsafe referenced URLs are rejected", () => {
  const { entries, assets } = setup();
  const nav = entries.find((e) => e.fields.key === "main");
  const item = entries.find((e) => e.sys.id === nav.fields.linkRefs[0].sys.id);
  item.fields.href = "javascript:alert(1)";
  assert.throws(() => mapContent(entries, assets), /navigation/);
  item.sys.contentType.sys.id = "pantrySection";
  assert.throws(() => mapContent(entries, assets), /reference/);
});
