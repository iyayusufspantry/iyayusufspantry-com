import { createHash } from "node:crypto";
export const reference = (id) => ({
  sys: { type: "Link", linkType: "Entry", id },
});
export function planReferences(entries, locale) {
  const children = [];
  const parents = [];
  for (const entry of entries) {
    const type = entry.sys.contentType.sys.id;
    const f = Object.fromEntries(
      Object.entries(entry.fields).map(([key, value]) => [key, value[locale]]),
    );
    const additions = {};
    if (f.referenceVersion === 1) continue;
    const child = (kind, key, values) => {
      const id =
        "pantry-ref-" +
        createHash("sha256")
          .update(entry.sys.id + ":" + kind + ":" + key)
          .digest("hex")
          .slice(0, 32);
      children.push({
        id,
        type: kind,
        fields: {
          title:
            `${f.title || f.businessName || type} / ${values.heading || values.label || key}`.slice(
              0,
              240,
            ),
          ...values,
        },
      });
      return reference(id);
    };
    // Do not recreate removed references or reset edited child entries on rerun.
    if (
      ["pantryPage", "pantryCopy"].includes(type) &&
      f.content?.source &&
      f.textBlocks === undefined
    ) {
      additions.source = f.content.source;
      additions.textBlocks = f.content.blocks.map((b) =>
        child("pantryTextBlock", b.key, {
          key: b.key,
          text: b.text,
          title: `${f.title} / ${b.kind}: ${b.text.slice(0, 100)}`.slice(
            0,
            240,
          ),
        }),
      );
    }
    if (
      ["pantryArticle", "pantryPolicy"].includes(type) &&
      f.sectionRefs === undefined
    ) {
      additions.sectionRefs = (f.sections || []).map((s, i) =>
        child(
          "pantrySection",
          String(i),
          Array.isArray(s) ? { heading: s[0], text: s[1] } : s,
        ),
      );
    }
    if (type === "pantryNavigation" && f.linkRefs === undefined)
      additions.linkRefs = f.items.map((item, i) =>
        child("pantryMenuLink", String(i), item),
      );
    if (type === "pantrySiteSettings")
      for (const [old, key] of [
        ["brandColors", "colorRefs"],
        ["contactDetails", "contactRefs"],
      ]) {
        if (f[key] === undefined)
          additions[key] = Object.entries(f[old]).map(([k, v]) =>
            child("pantrySetting", old + ":" + k, {
              key: k,
              ...(typeof v === "boolean" ? { boolean: v } : { text: v }),
            }),
          );
      }
    if (
      type === "pantryCopy" &&
      f.key === "data/scope.ts" &&
      f.decisionRefs === undefined
    ) {
      additions.decisionRefs = f.content.openDecisions.map((s, i) =>
        child("pantrySection", "decision" + i, { heading: s[0], text: s[1] }),
      );
      additions.featureRefs = f.content.scopeFeatures.map((s, i) =>
        child("pantrySection", "feature" + i, { heading: s[0], text: s[1] }),
      );
      additions.screenRefs = f.content.prototypeScreens.map((s, i) =>
        child("pantrySection", "screen" + i, {
          heading: s.name,
          text: s.purpose,
          href: s.href,
          group: s.group,
        }),
      );
      additions.clientMaterials = f.content.clientMaterials;
      additions.exclusions = f.content.exclusions;
    }
    if (
      Object.keys(additions).length ||
      [
        "pantryPage",
        "pantryCopy",
        "pantryPolicy",
        "pantryArticle",
        "pantryNavigation",
        "pantrySiteSettings",
      ].includes(type)
    ) {
      additions.referenceVersion = 1;
      parents.push({ entry, additions });
    }
  }
  return { children, parents };
}
