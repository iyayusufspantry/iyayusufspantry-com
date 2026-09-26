import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { management, environmentPath } from "./management.mjs";
import { mapContent } from "../../lib/content/map";

// Editor labels only. Routes, binding keys and customer-facing text stay intact.
const pageNames = {
  "/": "Homepage",
  "/about": "About us",
  "/blog": "Blog overview",
  "/blog/[slug]": "Blog article page",
  "/cart": "Shopping cart",
  "/checkout": "Checkout",
  "/contact": "Contact us",
  "/order-confirmation": "Order confirmation",
  "/privacy": "Privacy page",
  "/prototype": "Client preview directory",
  "/prototype/owner": "Owner dashboard preview",
  "/recipes": "Recipes overview",
  "/recipes/[slug]": "Recipe detail page",
  "/scope": "Project scope",
  "/search": "Search results",
  "/shipping": "Shipping page",
  "/shop": "Shop overview",
  "/shop/[slug]": "Product detail page",
  "/sign-in/[[...sign-in]]": "Sign in",
  "/sign-up/[[...sign-up]]": "Create an account",
  "/terms": "Terms page",
};
const copyNames = {
  "app/not-found.tsx": "Page not found messages",
  "app/error.tsx": "Website error messages",
  "app/layout.tsx": "Website accessibility labels",
  "components/shop-browser.tsx": "Shop filters and sorting",
  "components/scope-presentation.tsx": "Project review presentation",
  "components/owner-preview.tsx": "Owner preview labels",
  "components/content-browser.tsx": "Blog and recipe filters",
  "components/contact.tsx": "Contact form labels and messages",
  "components/cart-provider.tsx": "Shopping cart notifications",
  "components/auth-page.tsx": "Sign in and registration messages",
  "components/auth-controls.tsx": "Account menu labels",
  "components/cart-review.tsx": "Cart summary and actions",
  "components/catalog.tsx": "Product cards and availability labels",
  "components/commerce.tsx": "Checkout form and order messages",
  "components/product-detail.tsx": "Product details and purchase labels",
  "components/site-search.tsx": "Search form and result messages",
  "components/site-shell.tsx": "Header, footer and newsletter",
  "components/policy-page.tsx": "Policy page labels",
  "data/scope.ts": "Project scope and client decisions",
};
const menuNames = {
  main: "Header menu",
  explore: "Footer explore menu",
  help: "Footer help menu",
};
const primaryViews = [
  ["pantryProduct", "Products"],
  ["pantryCategory", "Product categories"],
  ["pantryVariant", "Product sizes and prices"],
  ["pantryPage", "Website pages"],
  ["pantryRecipe", "Recipes"],
  ["pantryArticle", "Blog articles"],
  ["pantryPolicy", "Policies"],
  ["pantryFaq", "Frequently asked questions"],
  ["pantryNavigation", "Navigation menus"],
  ["pantrySiteSettings", "Brand and contact settings"],
  ["pantryCopy", "Forms and shared website text"],
];
const linkedViews = [
  ["pantryTextBlock", "Website text items"],
  ["pantrySection", "Article and policy sections"],
  ["pantryMenuLink", "Individual menu links"],
  ["pantrySetting", "Individual brand and contact values"],
];
const apply = process.argv.includes("--apply");
const request = (path, options) => management(environmentPath + path, options);
async function all(kind) {
  const items = [];
  for (;;) {
    const page = await request(`/${kind}?limit=100&skip=${items.length}`);
    items.push(...page.items);
    if (items.length >= page.total) return items;
  }
}
const [ui, entries, assets, locales, types] = await Promise.all([
  request("/ui_config"),
  all("entries"),
  all("assets"),
  all("locales"),
  all("content_types"),
]);
const locale = locales.find((item) => item.default).code;
const value = (entry, field) => entry.fields[field]?.[locale];
const names = new Map();
const prefixReplacements = new Map();
for (const entry of entries) {
  const type = entry.sys.contentType.sys.id;
  const oldTitle = value(entry, "title");
  let name;
  let legacyName;
  if (type === "pantryPage") {
    const route = value(entry, "route");
    name = pageNames[route];
    legacyName = route === "/" ? "Homepage" : route;
  } else if (type === "pantryCopy") {
    const key = value(entry, "key");
    name = copyNames[key];
    legacyName =
      key === "data/scope.ts"
        ? "Prototype scope and screen directory"
        : key
            ?.split("/")
            .at(-1)
            ?.replace(/\.tsx?$/, "");
  } else if (type === "pantryNavigation") {
    const key = value(entry, "key");
    name = menuNames[key];
    legacyName = `${key} navigation`;
  }
  if (!name || !legacyName) continue;
  prefixReplacements.set(legacyName + " / ", name + " / ");
  // Preserve names the client has already customized.
  if (oldTitle === legacyName && oldTitle !== name)
    names.set(entry.sys.id, name);
}
for (const entry of entries) {
  if (!linkedViews.some(([type]) => type === entry.sys.contentType.sys.id))
    continue;
  const oldTitle = value(entry, "title");
  if (!oldTitle) continue;
  for (const [prefix, replacement] of prefixReplacements) {
    if (prefix !== replacement && oldTitle.startsWith(prefix)) {
      names.set(
        entry.sys.id,
        (replacement + oldTitle.slice(prefix.length)).slice(0, 240),
      );
      break;
    }
  }
}
const planned = structuredClone(entries);
const changes = [];
const skipped = [];
for (const entry of planned) {
  const title = names.get(entry.sys.id);
  if (!title) continue;
  if (
    !entry.sys.publishedVersion ||
    entry.sys.version !== entry.sys.publishedVersion + 1
  ) {
    skipped.push(entry.sys.id);
    continue;
  }
  entry.fields.title[locale] = title;
  changes.push(entry);
}
const unwrap = (rows) =>
  rows.map((entry) => ({
    sys: entry.sys,
    fields: Object.fromEntries(
      Object.entries(entry.fields).map(([key, field]) => [key, field[locale]]),
    ),
  }));
assert.deepEqual(
  mapContent(unwrap(entries), unwrap(assets)),
  mapContent(unwrap(planned), unwrap(assets)),
  "Editor labels must not change website content",
);
function view([type, title]) {
  assert(
    types.some((item) => item.sys.id === type),
    `Missing content type ${type}`,
  );
  return {
    id: `pantry-editor-${type}`,
    title,
    contentTypeId: type,
    contentTypeIds: [type],
    searchText: "",
    searchFilters: [],
    displayedFieldIds: ["contentType", "updatedAt", "author"],
    order: { fieldId: "updatedAt", direction: "descending" },
  };
}
const oldFolder =
  ui.entryListViews.find(
    (folder) =>
      folder.id === "pantry-edit-website" ||
      folder.views.some((item) => item.id === "pantry-editor-pantryProduct"),
  ) ||
  ui.entryListViews.find(
    (folder) => folder.title === "Content Type" && !folder.views.length,
  );
const ownIds = new Set(
  [...primaryViews, ...linkedViews].map(([id]) => `pantry-editor-${id}`),
);
function folder(id, title, views) {
  const existing = ui.entryListViews.find((item) => item.id === id);
  return {
    ...existing,
    id,
    title,
    views: [
      ...views.map(view),
      ...(existing?.views || []).filter((item) => !ownIds.has(item.id)),
    ],
  };
}
const mainId = oldFolder?.id || "pantry-edit-website";
const linkedId = "pantry-linked-items";
const body = structuredClone(ui);
delete body.sys;
body.entryListViews = [
  folder(mainId, "Edit website", primaryViews),
  ...ui.entryListViews.filter((item) => ![mainId, linkedId].includes(item.id)),
  folder(linkedId, "Linked items (advanced)", linkedViews),
];
const uiChanged = !isDeepStrictEqual(ui.entryListViews, body.entryListViews);
console.log(
  JSON.stringify({
    mode: apply ? "apply" : "plan",
    sharedViews: primaryViews.length + linkedViews.length,
    uiChanged,
    editorLabels: changes.length,
    skippedDrafts: skipped,
    websiteContent: "unchanged",
  }),
);
if (!apply) process.exit(0);
await mkdir("artifacts/contentful", { recursive: true });
const backup = `artifacts/contentful/editor-workspace-before-${Date.now()}.json`;
await writeFile(
  backup,
  JSON.stringify({ ui, entries, assets, locale }, null, 2),
);
console.log(`Backup saved: ${backup}`);
if (uiChanged) {
  const latest = await request("/ui_config");
  assert.deepEqual(
    latest,
    ui,
    "Workspace changed during planning; rerun to preserve those edits",
  );
  await request("/ui_config", { method: "PUT", body, version: ui.sys.version });
}
// Bound concurrency; the management helper backs off on rate limits. Optimistic
// version checks prevent overwriting edits made after the snapshot.
for (let offset = 0; offset < changes.length; offset += 4) {
  const results = await Promise.allSettled(
    changes.slice(offset, offset + 4).map(async (entry) => {
      const updated = await request(`/entries/${entry.sys.id}`, {
        method: "PUT",
        version: entry.sys.version,
        body: {
          fields: entry.fields,
          ...(entry.metadata ? { metadata: entry.metadata } : {}),
        },
      });
      await request(`/entries/${entry.sys.id}/published`, {
        method: "PUT",
        version: updated.sys.version,
      });
    }),
  );
  for (const result of results)
    if (result.status === "rejected") throw result.reason;
  if (offset % 40 === 0 || offset + 4 >= changes.length)
    console.log(
      `Updated editor labels: ${Math.min(offset + 4, changes.length)}/${changes.length}`,
    );
}
const [verifiedUi, verifiedEntries] = await Promise.all([
  request("/ui_config"),
  all("entries"),
]);
assert.deepEqual(verifiedUi.entryListViews, body.entryListViews);
for (const entry of changes) {
  const saved = verifiedEntries.find((item) => item.sys.id === entry.sys.id);
  assert.equal(value(saved, "title"), value(entry, "title"));
  assert.equal(saved.sys.version, saved.sys.publishedVersion + 1);
}
assert.deepEqual(
  mapContent(unwrap(verifiedEntries), unwrap(assets)),
  mapContent(unwrap(entries), unwrap(assets)),
);
console.log(
  "Shared views and editor labels verified; mapped website content is unchanged.",
);
console.log(
  JSON.stringify(
    primaryViews.map(([type, title]) => ({
      title,
      entries: verifiedEntries.filter(
        (item) => item.sys.contentType.sys.id === type,
      ).length,
    })),
  ),
);
