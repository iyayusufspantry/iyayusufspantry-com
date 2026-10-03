export const photoDirectory = "public/assets/2 oktober";
export const photos = {
  egusi: [
    "1790909014944blob.jpg",
    "Whole egusi melon seeds piled in a blue bowl.",
  ],
  ogbono: ["1790909713990blob.jpg", "Whole ogbono seeds piled in a blue bowl."],
  catfish: [
    "1790910787633blob.jpg",
    "Large smoked catfish arranged on a white plate.",
  ],
  crayfish: [
    "1790910910217blob.jpg",
    "Smoked large red crayfish piled in a white bowl.",
  ],
};

// Retain established URLs and references while replacing unapproved sample details.
export const products = [
  {
    slug: "ground-egusi",
    name: "Whole Egusi (Melon seeds)",
    description:
      "Bring the comforting taste of home to your kitchen with our whole egusi seeds.",
    unit: "1 oz or 1 lb",
    usage: "",
    ingredients: "",
    allergens: "",
    variants: [
      { size: "1 oz", priceCents: 300 },
      { size: "1 lb", priceCents: 2000 },
    ],
    photos: ["egusi"],
  },
  {
    slug: "ogbono",
    name: "Whole Ogbono Seeds",
    description:
      "Bring a comforting taste of home to your kitchen with our whole ogbono seeds—the dried kernels of the African wild mango.",
    unit: "1 oz or 1 lb",
    usage: "",
    ingredients: "",
    allergens: "",
    variants: [
      { size: "1 oz", priceCents: 300 },
      { size: "1 lb", priceCents: 2000 },
    ],
    photos: ["ogbono"],
  },
  {
    slug: "smoked-catfish",
    name: "Smoked Catfish",
    category: "specialty-foods",
    description:
      "Rich, smoky flavor and a comforting taste of home. Our large smoked catfish adds savory depth to soups, stews, and traditional favorites.",
    unit: "1 lb",
    usage: "Add savory depth to soups, stews, and traditional favorites.",
    ingredients: "",
    allergens: "Contains fish (catfish).",
    variants: [{ size: "1 lb", priceCents: 2500 }],
    photos: ["catfish"],
  },
  {
    slug: "dried-crayfish",
    name: "Smoked Large Red Crayfish",
    description:
      "Bring a rich taste of home to your cooking. Our smoked large red crayfish adds bold, savory flavor and smoky depth to soups, stews, and sauces.",
    unit: "1 oz",
    usage:
      "Add bold, savory flavor and smoky depth to soups, stews, and sauces.",
    ingredients: "",
    allergens: "Contains shellfish (crayfish).",
    variants: [{ size: "1 oz", priceCents: 500 }],
    photos: ["crayfish"],
  },
];

export const story = {
  slug: "rediscovering-the-taste-of-home",
  title: "Rediscovering the Taste of Home",
  author: "Simbiat",
  description:
    "For us, the journey back began with a meal. Through our pantry, we hope to share that sense of rediscovery with you.",
  paragraphs: [
    "Almost three years ago, shortly after my mother, Iya Yusuf, moved to the United States, she tasted my cooking and said, “It doesn’t taste like it does back home.”",
    "I disagreed. I was making the same dishes with what I believed were the same ingredients. To me, the flavors tasted just as I remembered.",
    "Then she said something I’ll never forget: “Give me a couple of weeks to have the ingredients sent from Nigeria. Then you’ll understand.”",
    "She was right.",
    "When those ingredients arrived, and we cooked with them, I tasted something I hadn’t experienced in more than a decade. Familiar flavors brought memories rushing back—and made me realize how much I had forgotten. Over the years, my palate had quietly adapted to what was available. Without noticing, I had begun to remember the taste of home differently.",
    "I wondered how many other Nigerians and Africans living far from home had experienced the same gradual shift. How many of us were missing familiar flavors without even realizing it?",
    "Iya Yusuf’s Pantry grew from that awakening. My mother and I wanted to share the ingredients and foods that reconnect us with our roots, our memories, and one another.",
    "Perhaps you’ve felt this too. Sometimes it happens through food; sometimes through a language, a tradition, or a familiar way of life. We adapt, and pieces of what once felt like home slowly become distant.",
    "For us, the journey back began with a meal. Through our pantry, we hope to share that sense of rediscovery with you.",
  ],
};
