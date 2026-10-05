export const photoDirectory = "public/assets/4 october";
export const photos = {
  pepper: [
    "1791074985153blob.jpg",
    "Ground Cameroon pepper piled in a blue bowl.",
  ],
  pepperSoup: [
    "1791075359917blob.jpg",
    "Pepper soup spice mix piled in a blue bowl.",
  ],
  beans: ["1791075855688blob.jpg", "Nigerian beans piled in a blue bowl."],
  dates: [
    "1791076098665blob.jpg",
    "Nigerian dates (dabino) piled in a blue bowl.",
  ],
  datesHand: ["1791076138285blob.jpg", "A handful of Nigerian dates (dabino)."],
  tigerNuts: ["1791076354384blob.jpg", "Tiger nuts piled in a blue bowl."],
  suya: ["1791076596011blob.jpg", "Suya mix (yaji) piled in a white bowl."],
  yam: ["1791076772254blob.jpg", "Yam flour piled in a blue bowl."],
  zobo: [
    "../2 oktober/1790911112946blob.jpg",
    "Bottles of deep-red Zobo drink with white caps.",
  ],
};

// Existing slugs preserve product links and editorial references.
export const products = [
  {
    slug: "ground-pepper",
    name: "Ground Cameroon Pepper",
    category: "spices-ingredients",
    description:
      "Smoky, intensely hot, and wonderfully aromatic, our ground Cameroon pepper is made from sun-dried Scotch bonnet peppers. A little brings bold heat and deep flavor to your favorite soups, stews, and sauces.",
    unit: "1 oz",
    usage:
      "A little brings bold heat and deep flavor to soups, stews, and sauces.",
    ingredients: "Ingredients: sun-dried Scotch bonnet peppers.",
    allergens: "",
    variants: [{ size: "1 oz", priceCents: 300 }],
    photos: ["pepper"],
  },
  {
    slug: "pepper-soup-spice",
    name: "Pepper Soup Mix",
    category: "spices-ingredients",
    description:
      "Pepper soup spice is a warm, aromatic, and pungent West African seasoning blend used to make traditional Nigerian pepper soup.",
    unit: "1 oz",
    usage: "Use to make traditional Nigerian pepper soup.",
    ingredients:
      "Ingredients: Ehuru (African / Calabash Nutmeg), Uda (Negro Pepper / Grains of Selim), Alligator Pepper (Grains of Paradise), Uziza Seeds (False Cubeb / Bush Pepper), Aidan fruit, Cameroon pepper.",
    allergens: "",
    variants: [{ size: "1 oz", priceCents: 300 }],
    photos: ["pepperSoup"],
  },
  {
    slug: "honey-beans",
    name: "Nigerian Beans",
    category: "grains-staples",
    description:
      "Nigerian beans are a staple food in West Africa, most famously prepared as a savory, comforting porridge called Nigerian Beans Porridge (Ewa Oloyin) or stewed beans (Ewa Riro).",
    unit: "1 lb",
    usage:
      "Prepare as Nigerian Beans Porridge (Ewa Oloyin) or stewed beans (Ewa Riro).",
    ingredients: "",
    allergens: "",
    variants: [{ size: "1 lb", priceCents: 1000 }],
    photos: ["beans"],
  },
  {
    slug: "nigerian-dates",
    name: "Nigerian Dates (Dabino)",
    category: "pantry-essentials",
    description:
      "Naturally sweet and full of flavor, our Nigerian dates bring a comforting taste of home to your pantry. Known as dabino in Hausa, these fruits are enjoyed as a simple snack or used to add natural sweetness to drinks and recipes.",
    unit: "1 lb",
    usage:
      "Enjoy as a simple snack or use to add natural sweetness to drinks and recipes.",
    ingredients: "",
    allergens: "",
    variants: [{ size: "1 lb", priceCents: 2000 }],
    photos: ["dates", "datesHand"],
    learnMoreUrl: "https://www.google.com/search?q=Nigerian+dates+dabino",
  },
  {
    slug: "tiger-nuts",
    name: "Tiger Nuts",
    category: "pantry-essentials",
    description:
      "Enjoy the natural sweetness, nutty flavor, and satisfying chew of our tiger nuts. These small edible tubers make a delicious snack and are perfect for blending into a refreshing homemade tiger nut drink—a familiar taste of home in every handful.",
    unit: "1 lb",
    usage:
      "Enjoy as a snack or blend into a refreshing homemade tiger nut drink.",
    ingredients: "",
    allergens: "",
    variants: [{ size: "1 lb", priceCents: 1000 }],
    photos: ["tigerNuts"],
    learnMoreUrl: "https://www.google.com/search?q=tiger+nuts+edible+tubers",
  },
  {
    slug: "suya-spice",
    name: "Suya Mix (Yaji)",
    category: "spices-ingredients",
    description:
      "Bring the bold taste of Nigerian suya to your kitchen. Fiery, nutty, and smoky, our blend combines ground peanuts and chilli peppers with aromatic ginger, garlic, and onion. Perfect for seasoning grilled meats, chicken, and vegetables with a delicious taste of home.",
    unit: "1 oz",
    usage: "Season grilled meats, chicken, and vegetables.",
    ingredients:
      "Ingredients: ground peanuts, chilli peppers, ginger, garlic, and onion.",
    allergens: "Contains peanuts.",
    variants: [{ size: "1 oz", priceCents: 500 }],
    photos: ["suya"],
  },
  {
    slug: "yam-flour",
    name: "Yam Flour",
    category: "grains-staples",
    description:
      "A comforting taste of home, our yam flour is finely ground from dried yam tubers. Prepare it into smooth, hearty amala and enjoy with your favorite soups for a satisfying traditional meal.",
    unit: "1 lb",
    usage:
      "Prepare into smooth, hearty amala and enjoy with your favorite soups.",
    ingredients: "",
    allergens: "",
    variants: [{ size: "1 lb", priceCents: 1000 }],
    photos: ["yam"],
  },
  {
    slug: "white-garri",
    name: "Garri",
    category: "grains-staples",
    description:
      "Garri is a popular, versatile flour made from fermented and roasted cassava tubers, widely used as a dietary staple across West Africa.",
    unit: "1 lb",
    usage: "",
    ingredients: "",
    allergens: "",
    variants: [{ size: "1 lb", priceCents: 1000 }],
    photos: [],
  },
];
