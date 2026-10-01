// Client-supplied September 30 photos. The two website screenshots are context only.
export const photoDirectory = "public/assets/30 september";
export const photos = {
  assortment: [
    "1790739359352blob.jpg",
    "White-lidded jars of Nigerian snacks on a warm stone counter.",
  ],
  drinks: [
    "1790739534082blob.jpg",
    "Bottles of creamy tiger nut drink on a warm stone counter.",
  ],
  coconut: [
    "1790739747856blob.jpg",
    "A white-lidded jar of golden Coconut Candy Crunch on a warm stone counter.",
  ],
  snackJars: [
    "1790739852779blob.jpg",
    "Jars of rounded golden Donkwa bites on a warm stone counter.",
  ],
  palmOil64: [
    "1790741820964blob.jpg",
    "African red palm oil in a half-gallon (64 oz) jug.",
  ],
  palmOil64Reference: [
    "1790740578355blob.jpg",
    "Illustrative palm oil jug size comparison: a 9-inch jug beside a 5-foot-6-inch silhouette.",
  ],
  palmOil32: ["1790740786930blob.jpg", "African red palm oil in a 32 oz jug."],
  palmOil32Reference: [
    "1790740801905blob.jpg",
    "Illustrative 32 oz palm oil jug size comparison: an 8-inch jug beside a 5-foot-6-inch silhouette.",
  ],
  chinChin: [
    "1790740942390blob.jpg",
    "A white-lidded jar filled with sweet golden Chin Chin.",
  ],
  chinChinServing: [
    "1790740954705blob.jpg",
    "Golden Chin Chin in a bowl beside an open snack jar.",
  ],
  snackReference: [
    "1790741198470blob.jpg",
    "Snack container size reference: a woman holding an empty jar marked 4 inches tall and 3 inches wide.",
  ],
};

export const products = [
  {
    slug: "palm-oil",
    name: "African Red Palm Oil",
    description:
      "Bring rich flavor and vibrant color to your kitchen with our African red palm oil. A delicious addition to traditional soups, stews, and sauces, it brings a familiar taste of home to your favorite recipes.",
    unit: "32 oz or 1/2 gallon (64 oz) jug",
    usage: "Add to traditional soups, stews, and sauces.",
    ingredients: "",
    allergens: "",
    variants: [
      { size: "32 oz", priceCents: 1000 },
      { size: "1/2 gallon (64 oz)", priceCents: 2000 },
    ],
    photos: [
      "palmOil32",
      "palmOil64",
      "palmOil32Reference",
      "palmOil64Reference",
    ],
  },
  {
    slug: "classic-chin-chin",
    name: "Chin Chin",
    description:
      "Sweet, golden, and delightfully crunchy. Made with flour, sugar, butter or margarine, milk, and ground nutmeg, our chin chin is a comforting favorite to share or savor by the handful.",
    unit: "jar",
    usage: "Share or savor by the handful.",
    ingredients:
      "Ingredients: flour, sugar, butter or margarine, milk, and ground nutmeg.",
    allergens: "Contains milk.",
    variants: [{ size: "Standard", priceCents: 1000 }],
    photos: ["chinChin", "chinChinServing", "snackReference"],
  },
];

// These existing products use the same jar. Preserve their current product photos.
export const sharedSnackReferenceSlugs = [
  "kulikuli",
  "donkwa",
  "coconut-candy-crunch",
  "lightly-salted-roasted-groundnut",
];
