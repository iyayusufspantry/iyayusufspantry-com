const field = (id, name, type = "Symbol", extra = {}) => ({
  id,
  name,
  type,
  localized: false,
  required: false,
  ...extra,
});
const required = (id, name, type = "Symbol", extra = {}) =>
  field(id, name, type, { required: true, ...extra });
const list = (id, name) =>
  field(id, name, "Array", { items: { type: "Symbol" } });
const link = (id, name, contentTypes) =>
  field(id, name, "Link", {
    linkType: "Entry",
    validations: [{ linkContentType: contentTypes }],
  });
const links = (id, name, contentTypes) =>
  field(id, name, "Array", {
    items: {
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: contentTypes }],
    },
  });
const asset = (id, name) => field(id, name, "Link", { linkType: "Asset" });
const status = () =>
  field("approvalStatus", "Client approval status", "Symbol", {
    validations: [{ in: ["sample", "approved"] }],
  });
const slug = () =>
  required("slug", "Slug", "Symbol", {
    validations: [
      { unique: true },
      { regexp: { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" } },
    ],
  });
const model = (id, name, displayField, fields) => ({
  id,
  name,
  displayField,
  description:
    "Iya Yusuf's Pantry website content. Imported copy remains sample content until client approval.",
  fields,
});

export const models = [
  model("pantryCategory", "Product category", "name", [
    required("name", "Name"),
    slug(),
    field("description", "Description", "Text"),
    field("icon", "Illustration key"),
    field("sortOrder", "Sort order", "Integer"),
    status(),
  ]),
  model("pantryProduct", "Product", "name", [
    required("name", "Name"),
    slug(),
    link("category", "Category", ["pantryCategory"]),
    required("description", "Description", "Text"),
    field("unit", "Pack size"),
    field("usage", "Preparation and storage", "Text"),
    field("ingredients", "Ingredients", "Text"),
    field("allergens", "Allergens", "Text"),
    list("sizes", "Size labels"),
    list("dietary", "Dietary labels — require approval"),
    field("samplePrice", "Sample display price (USD)", "Number", {
      validations: [{ range: { min: 0 } }],
    }),
    links("variants", "Variants", ["pantryVariant"]),
    links("recipes", "Related recipes", ["pantryRecipe"]),
    field("photos", "Product photos", "Array", {
      items: { type: "Link", linkType: "Asset" },
    }),
    field("sortOrder", "Sort order", "Integer"),
    status(),
  ]),
  model("pantryVariant", "Product variant", "variantId", [
    required("variantId", "Immutable variant ID", "Symbol", {
      validations: [{ unique: true }],
    }),
    link("product", "Product", ["pantryProduct"]),
    required("size", "Size"),
    required("dietary", "Dietary option"),
    required("priceCents", "Sample price in cents", "Integer", {
      validations: [{ range: { min: 0 } }],
    }),
    required("currency", "Currency", "Symbol", {
      validations: [{ in: ["USD"] }],
    }),
    field("active", "Active", "Boolean"),
    status(),
  ]),
  model("pantryRecipe", "Recipe", "title", [
    required("title", "Title"),
    slug(),
    required("description", "Summary", "Text"),
    field("category", "Recipe category"),
    field("time", "Preparation / cooking time"),
    field("servings", "Servings", "Integer", {
      validations: [{ range: { min: 1 } }],
    }),
    list("ingredients", "Ingredients and quantities"),
    list("instructions", "Ordered instructions"),
    links("products", "Related products", ["pantryProduct"]),
    asset("image", "Photo"),
    field("imageAlt", "Photo alternative text"),
    field("sortOrder", "Sort order", "Integer"),
    status(),
  ]),
  model("pantryArticle", "Journal article", "title", [
    required("title", "Title"),
    slug(),
    required("description", "Summary", "Text"),
    field("category", "Article category"),
    field("publicationDate", "Publication date", "Date"),
    field("displayDate", "Display date"),
    field("readTime", "Reading time"),
    field("body", "Article body", "RichText"),
    field("sections", "Structured article sections", "Object"),
    link("product", "Related product", ["pantryProduct"]),
    asset("image", "Photo"),
    field("imageAlt", "Photo alternative text"),
    field("sortOrder", "Sort order", "Integer"),
    status(),
  ]),
  model("pantryPolicy", "Policy", "title", [
    required("title", "Title"),
    required("kind", "Policy kind", "Symbol", {
      validations: [{ in: ["shipping", "privacy", "terms", "returns"] }],
    }),
    field("subtitle", "Introduction", "Text"),
    field("body", "Policy body", "RichText"),
    field("sections", "Structured policy sections", "Object"),
    field("effectiveDate", "Effective date", "Date"),
    status(),
  ]),
  model("pantryFaq", "Frequently asked question", "question", [
    required("question", "Question"),
    required("answer", "Answer", "Text"),
    field("sortOrder", "Sort order", "Integer"),
    status(),
  ]),
  model("pantryPage", "Website page", "title", [
    required("title", "Editor title"),
    required("route", "Route", "Symbol", { validations: [{ unique: true }] }),
    field("content", "Page content blocks", "Object"),
    field("body", "Copy for review", "RichText"),
    links("featuredProducts", "Featured products", ["pantryProduct"]),
    links("featuredRecipes", "Featured recipes", ["pantryRecipe"]),
    links("featuredArticles", "Featured articles", ["pantryArticle"]),
    status(),
  ]),
  model("pantrySiteSettings", "Site settings", "businessName", [
    ...["assortment", "snackJars", "coconut", "drinks", "palmOil"].map((role) =>
      asset(`${role}Image`, `${role} image`),
    ),
    required("businessName", "Business name"),
    field("tagline", "Tagline"),
    asset("logo", "Horizontal logo"),
    asset("icon", "Brand icon"),
    field("brandColors", "Brand palette", "Object"),
    field("contactDetails", "Contact details and placeholder status", "Object"),
    links("navigation", "Navigation menus", ["pantryNavigation"]),
    field("mediaLibrary", "Brand media library", "Array", {
      items: { type: "Link", linkType: "Asset" },
    }),
    status(),
  ]),
  model("pantryNavigation", "Navigation menu", "title", [
    required("title", "Title"),
    required("key", "Menu key", "Symbol", { validations: [{ unique: true }] }),
    required("items", "Links (label and href)", "Object"),
  ]),
  model("pantryCopy", "Shared website copy", "title", [
    required("title", "Editor title"),
    required("key", "Component / copy key", "Symbol", {
      validations: [{ unique: true }],
    }),
    field("content", "Structured copy", "Object"),
    field("body", "Copy for review", "RichText"),
    status(),
  ]),
];

export function richText(sections) {
  const node = (type, text) => ({
    nodeType: type,
    data: {},
    content: [{ nodeType: "text", value: text, marks: [], data: {} }],
  });
  return {
    nodeType: "document",
    data: {},
    content: sections.flatMap(({ heading, text }) => [
      ...(heading ? [node("heading-2", heading)] : []),
      node("paragraph", text || ""),
    ]),
  };
}
