// Client-supplied reference photos. Product identities are mapped only where
// the supplied packaging identifies the item; assortment photos are editorial.
export const brandPhotos = {
  assortment: {
    src: "/assets/IMG_2998.jpeg",
    alt: "An assortment of snacks in clear pantry jars",
  },
  snackJars: {
    src: "/assets/IMG_6415.jpeg",
    alt: "Golden snacks packed in clear jars from the client's collection",
  },
  coconut: {
    src: "/assets/IMG_3005.jpeg",
    alt: "A clear jar filled with toasted coconut strips",
  },
  drinks: {
    src: "/assets/IMG_5211.jpeg",
    alt: "A collection of pale bottled drinks supplied as a product reference",
  },
  palmOil: {
    src: "/assets/IMG_3083.jpeg",
    alt: "Iya Yusuf's Pantry red palm oil in labeled containers",
  },
};

export type BrandPhoto = { src: string; alt: string };
export const productPhotos: Record<string, BrandPhoto> = {
  "Red Palm Oil": brandPhotos.palmOil,
};

export const journalPhotos: Record<string, BrandPhoto> = {
  "a-pantry-that-feels-like-home": brandPhotos.assortment,
  "more-than-a-snack": brandPhotos.snackJars,
};
