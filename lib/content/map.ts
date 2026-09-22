import type { SiteContent, BrandPhoto, Category } from "./types";

export type CmsResource = {
  sys: { id: string; contentType?: { sys: { id: string } } };
  fields: Record<string, unknown>;
};
type Fields = CmsResource["fields"];
const object = (value: unknown): Fields =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Fields)
    : {};
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const text = (value: unknown): string =>
  typeof value === "string" ? value : "";
const strings = (value: unknown): string[] =>
  list(value).filter((v): v is string => typeof v === "string");
const linkId = (value: unknown) => text(object(object(value).sys).id);
const pairs = (value: unknown): [string, string][] =>
  list(value).filter(
    (v): v is [string, string] =>
      Array.isArray(v) &&
      v.length === 2 &&
      v.every((x) => typeof x === "string"),
  );
const safeHref = (value: unknown) => {
  const href = text(value);
  if (!href.startsWith("/") || href.startsWith("//") || href.includes("\\"))
    throw new Error("Invalid Contentful navigation destination");
  return href;
};

export function mapContent(
  entries: CmsResource[],
  assets: CmsResource[],
): SiteContent {
  const byId = new Map(entries.map((e) => [e.sys.id, e.fields]));
  const rows = (type: string) =>
    entries
      .filter((e) => e.sys.contentType?.sys.id === type)
      .sort(
        (a, b) =>
          Number(a.fields.sortOrder ?? 0) - Number(b.fields.sortOrder ?? 0) ||
          a.sys.id.localeCompare(b.sys.id),
      );
  const linked = (value: unknown) => byId.get(linkId(value));
  const slugs = (value: unknown) =>
    list(value)
      .map((v) => text(linked(v)?.slug))
      .filter(Boolean);
  const photos = new Map<string, BrandPhoto>();
  for (const asset of assets) {
    const file = object(asset.fields.file);
    const raw = text(file.url);
    if (!raw) continue;
    const url = new URL(raw.startsWith("//") ? `https:${raw}` : raw);
    if (
      url.protocol !== "https:" ||
      ![
        "images.ctfassets.net",
        "assets.ctfassets.net",
        "downloads.ctfassets.net",
      ].includes(url.hostname)
    )
      throw new Error("Unexpected Contentful asset URL");
    photos.set(asset.sys.id, {
      src: url.href,
      alt: text(asset.fields.description) || text(asset.fields.title),
    });
  }
  const photo = (value: unknown) => photos.get(linkId(value));
  const requiredPhoto = (value: unknown) => {
    const result = photo(value);
    if (!result) throw new Error("Publish the linked Contentful brand assets");
    return result;
  };
  const settings = rows("pantrySiteSettings")[0]?.fields;
  if (!settings)
    throw new Error(
      "Publish the Contentful site settings before serving the site",
    );
  const categories = rows("pantryCategory").map(({ fields: f }) => ({
    slug: text(f.slug),
    name: text(f.name),
    description: text(f.description),
    icon: text(f.icon) as Category["icon"],
  }));
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const productRows = rows("pantryProduct").filter(({ fields: f }) =>
    categorySlugs.has(text(linked(f.category)?.slug)),
  );
  const productIds = new Set(productRows.map((e) => e.sys.id));
  const variants = rows("pantryVariant")
    .filter(({ fields: f }) => productIds.has(linkId(f.product)))
    .map(({ fields: f }) => {
      if (
        !Number.isSafeInteger(f.priceCents) ||
        Number(f.priceCents) < 0 ||
        f.currency !== "USD" ||
        !text(f.variantId)
      )
        throw new Error(
          "Invalid published Contentful variant price or currency",
        );
      return {
        id: text(f.variantId),
        productSlug: text(linked(f.product)?.slug),
        size: text(f.size),
        dietary: text(f.dietary),
        priceCents: Number(f.priceCents),
        currency: text(f.currency),
        active: f.active === true,
      };
    });
  const products = productRows.map(({ fields: f }) => {
    const slug = text(f.slug);
    const active = variants.filter((v) => v.productSlug === slug && v.active);
    return {
      slug,
      name: text(f.name),
      category: text(linked(f.category)?.slug),
      description: text(f.description),
      unit: text(f.unit),
      usage: text(f.usage),
      ingredients: text(f.ingredients),
      allergens: text(f.allergens),
      sizes: [
        ...new Set([...strings(f.sizes), ...active.map((v) => v.size)]),
      ].filter((size) => active.some((v) => v.size === size)),
      dietary: [
        ...new Set([...strings(f.dietary), ...active.map((v) => v.dietary)]),
      ].filter((dietary) => active.some((v) => v.dietary === dietary)),
      price: active.length
        ? Math.min(...active.map((v) => v.priceCents)) / 100
        : Number(f.samplePrice),
      recipe: slugs(f.recipes)[0],
    };
  });
  const productSlugs = new Set(products.map((p) => p.slug));
  const productPhotos: SiteContent["productPhotos"] = {};
  const productGalleries: SiteContent["productGalleries"] = {};
  for (const { fields: f } of productRows) {
    const gallery = list(f.photos)
      .map(photo)
      .filter((p): p is BrandPhoto => Boolean(p));
    productGalleries[text(f.slug)] = gallery;
    const image = gallery[0];
    if (image) productPhotos[text(f.name)] = image;
  }
  const recipes = rows("pantryRecipe").map(({ fields: f }) => ({
    slug: text(f.slug),
    title: text(f.title),
    description: text(f.description),
    category: text(f.category),
    time: text(f.time),
    servings: Number(f.servings),
    ingredients: strings(f.ingredients),
    instructions: strings(f.instructions),
    products: slugs(f.products).filter((s) => productSlugs.has(s)),
  }));
  const recipePhotos: SiteContent["recipePhotos"] = {};
  for (const { fields: f } of rows("pantryRecipe")) {
    const image = photo(f.image);
    if (image)
      recipePhotos[text(f.slug)] = {
        ...image,
        alt: text(f.imageAlt) || image.alt,
      };
  }
  const journalPhotos: SiteContent["journalPhotos"] = {};
  const posts = rows("pantryArticle").map(({ fields: f }) => {
    const image = photo(f.image);
    if (image)
      journalPhotos[text(f.slug)] = {
        ...image,
        alt: text(f.imageAlt) || image.alt,
      };
    return {
      slug: text(f.slug),
      title: text(f.title),
      description: text(f.description),
      category: text(f.category),
      date: text(f.displayDate),
      readTime: text(f.readTime),
      product: text(linked(f.product)?.slug),
      sections: list(f.sections).map((s) => ({
        heading: text(object(s).heading),
        text: text(object(s).text),
      })),
    };
  });
  const copy: SiteContent["copy"] = {};
  for (const { fields: f } of [...rows("pantryPage"), ...rows("pantryCopy")]) {
    const content = object(f.content);
    const source = text(content.source);
    if (source)
      copy[source] = Object.fromEntries(
        list(content.blocks).map((b) => [
          text(object(b).key),
          text(object(b).text),
        ]),
      );
  }
  const scope = object(
    rows("pantryCopy").find((e) => e.fields.key === "data/scope.ts")?.fields
      .content,
  );
  const home = rows("pantryPage").find((e) => e.fields.route === "/")?.fields;
  return {
    products,
    variants,
    categories,
    recipes,
    posts,
    productPhotos,
    journalPhotos,
    recipePhotos,
    productGalleries,
    copy,
    brandPhotos: {
      assortment: requiredPhoto(settings.assortmentImage),
      snackJars: requiredPhoto(settings.snackJarsImage),
      coconut: requiredPhoto(settings.coconutImage),
      drinks: requiredPhoto(settings.drinksImage),
      palmOil: requiredPhoto(settings.palmOilImage),
    },
    settings: {
      businessName: text(settings.businessName),
      tagline: text(settings.tagline),
      logo: requiredPhoto(settings.logo),
      icon: requiredPhoto(settings.icon),
      brandColors: object(settings.brandColors) as Record<string, string>,
      contactDetails: object(settings.contactDetails) as Record<
        string,
        string | boolean
      >,
    },
    navigation: Object.fromEntries(
      rows("pantryNavigation").map(({ fields: f }) => [
        text(f.key),
        list(f.items).map((i) => [
          text(object(i).label),
          safeHref(object(i).href),
        ]),
      ]),
    ),
    policies: Object.fromEntries(
      rows("pantryPolicy").map(({ fields: f }) => [
        text(f.kind),
        {
          title: text(f.title),
          subtitle: text(f.subtitle),
          sections: pairs(f.sections),
        },
      ]),
    ),
    faqs: rows("pantryFaq").map(({ fields: f }) => [
      text(f.question),
      text(f.answer),
    ]),
    featured: {
      products: slugs(home?.featuredProducts),
      recipes: slugs(home?.featuredRecipes),
      posts: slugs(home?.featuredArticles),
    },
    openDecisions: pairs(scope.openDecisions),
    scopeFeatures: pairs(scope.scopeFeatures),
    clientMaterials: strings(scope.clientMaterials),
    exclusions: strings(scope.exclusions),
    prototypeScreens: list(scope.prototypeScreens).map((s) => ({
      name: text(object(s).name),
      href: safeHref(object(s).href),
      purpose: text(object(s).purpose),
      group: text(object(s).group),
    })),
  };
}
