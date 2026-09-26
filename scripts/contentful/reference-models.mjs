// Additive schema: legacy JSON stays available for older deployments/rollback.
const field = (id, name, type = "Symbol", extra = {}) => ({
  id,
  name,
  type,
  localized: false,
  required: false,
  ...extra,
});
const model = (id, name, fields) => ({
  id,
  name,
  displayField: "title",
  description:
    "Editable website content. Publish linked entries after editing.",
  fields: [
    field("title", "Editor title", "Symbol", { required: true }),
    ...fields,
  ],
});
const refs = (id, name, type) =>
  field(id, name, "Array", {
    items: {
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: [type] }],
    },
  });
export const referenceModels = [
  model("pantryTextBlock", "Website text", [
    field("key", "Website binding (do not change)", "Symbol", {
      required: true,
      disabled: true,
    }),
    field("text", "Text", "Text"),
  ]),
  model("pantrySection", "Content section", [
    field("heading", "Heading"),
    field("text", "Paragraph", "Text"),
    field("href", "Page link"),
    field("group", "Group"),
  ]),
  model("pantryMenuLink", "Navigation link", [
    field("label", "Link label", "Symbol", { required: true }),
    field("href", "Website path", "Symbol", {
      required: true,
      validations: [{ regexp: { pattern: "^/", flags: "" } }],
    }),
  ]),
  model("pantrySetting", "Brand or contact value", [
    field("key", "Website binding (do not change)", "Symbol", {
      required: true,
      disabled: true,
    }),
    field("text", "Value", "Text"),
    field("boolean", "Placeholder contact details", "Boolean"),
  ]),
];
export const referenceFields = {
  pantryPage: [
    field("source", "Website binding (do not change)", "Symbol", {
      disabled: true,
    }),
    refs("textBlocks", "Page text", "pantryTextBlock"),
  ],
  pantryCopy: [
    field("source", "Website binding (do not change)", "Symbol", {
      disabled: true,
    }),
    refs("textBlocks", "Shared text", "pantryTextBlock"),
    refs("decisionRefs", "Review decisions", "pantrySection"),
    refs("featureRefs", "Scope features", "pantrySection"),
    refs("screenRefs", "Preview screens", "pantrySection"),
    field("clientMaterials", "Client materials", "Array", {
      items: { type: "Symbol" },
    }),
    field("exclusions", "Scope exclusions", "Array", {
      items: { type: "Symbol" },
    }),
  ],
  pantryPolicy: [refs("sectionRefs", "Policy sections", "pantrySection")],
  pantryArticle: [refs("sectionRefs", "Article sections", "pantrySection")],
  pantryNavigation: [refs("linkRefs", "Menu links", "pantryMenuLink")],
  pantrySiteSettings: [
    refs("colorRefs", "Brand colours", "pantrySetting"),
    refs("contactRefs", "Contact details", "pantrySetting"),
  ],
};
export const legacyFields = {
  pantryPage: ["content", "body"],
  pantryCopy: ["content", "body"],
  pantryPolicy: ["sections", "body"],
  pantryArticle: ["sections", "body"],
  pantryNavigation: ["items"],
  pantrySiteSettings: ["brandColors", "contactDetails"],
};
for (const fields of Object.values(referenceFields)) {
  fields.push(
    field("referenceVersion", "Reference schema version", "Integer", {
      disabled: true,
    }),
  );
}
