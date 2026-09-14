// Illustrative editorial content; recipes and quantities require client review before publication.
export type Recipe = {
  slug: string;
  title: string;
  description: string;
  category: string;
  time: string;
  servings: number;
  products: string[];
  ingredients: string[];
  instructions: string[];
};
export const recipes: Recipe[] = [
  {
    slug: "egusi-greens",
    title: "A comforting bowl of egusi",
    description:
      "A simple introduction to a familiar favorite, with leafy greens and a rich, hearty texture.",
    category: "Main dishes",
    time: "45 min",
    servings: 4,
    products: ["ground-egusi", "palm-oil", "dried-ugu"],
    ingredients: [
      "1 cup ground egusi",
      "2 tablespoons palm oil",
      "1 onion, chopped",
      "3 cups vegetable stock",
      "2 cups prepared leafy greens",
      "Salt and pepper to taste",
    ],
    instructions: [
      "Warm the oil in a pot and gently soften the chopped onion.",
      "Mix the ground egusi with a little stock to form a paste, then add to the pot.",
      "Add the remaining stock gradually and simmer, stirring, until the egusi is cooked and the soup thickens.",
      "Add the prepared greens and cook until tender. Adjust seasoning and serve with your favorite staple.",
    ],
  },
  {
    slug: "plantain-snack-bowl",
    title: "The everyday plantain snack bowl",
    description:
      "A little crunch, a fresh dip, and a new way to enjoy an old favorite.",
    category: "Snacks & sides",
    time: "10 min",
    servings: 2,
    products: ["plantain-chips"],
    ingredients: [
      "1 pack plantain chips",
      "1 ripe avocado",
      "Juice of half a lime",
      "1 small tomato, diced",
      "Salt to taste",
    ],
    instructions: [
      "Mash the avocado with lime juice and a pinch of salt.",
      "Fold in the diced tomato.",
      "Arrange the plantain chips in a bowl and serve the dip alongside.",
    ],
  },
  {
    slug: "hibiscus-cooler",
    title: "A refreshing hibiscus cooler",
    description:
      "A bright, gently spiced drink to make ahead and share around the table.",
    category: "Drinks",
    time: "25 min + cooling",
    servings: 4,
    products: ["dried-hibiscus"],
    ingredients: [
      "Half a cup dried hibiscus",
      "4 cups water",
      "A small piece of ginger, sliced",
      "Sweetener to taste",
      "Ice, to serve",
    ],
    instructions: [
      "Rinse the hibiscus petals thoroughly.",
      "Bring the water to a boil, add hibiscus and ginger, then simmer for 15 minutes.",
      "Strain, sweeten to taste, and allow to cool. Refrigerate before serving over ice.",
    ],
  },
  {
    slug: "everyday-eba",
    title: "Eba, a simple kitchen staple",
    description:
      "An introduction to preparing garri as an accompaniment to soup.",
    category: "Snacks & sides",
    time: "15 min",
    servings: 2,
    products: ["white-garri"],
    ingredients: ["1 cup white garri", "Hot water, as needed"],
    instructions: [
      "Bring water to a boil and pour a little into a heatproof bowl.",
      "Gradually add garri, stirring carefully with a wooden spoon.",
      "Adjust the water and garri until a smooth, firm consistency forms. Serve warm with soup.",
    ],
  },
  {
    slug: "honey-bean-bowl",
    title: "Slow-cooked honey beans",
    description:
      "A comforting, everyday bowl made with a handful of pantry ingredients.",
    category: "Main dishes",
    time: "75 min",
    servings: 4,
    products: ["honey-beans", "palm-oil"],
    ingredients: [
      "2 cups honey beans",
      "1 onion, chopped",
      "2 tablespoons palm oil",
      "Water and seasoning, as needed",
    ],
    instructions: [
      "Sort and rinse the beans, then add to a pot with plenty of water.",
      "Bring to a boil and cook until thoroughly tender, adding water as needed.",
      "Add onion, oil, and seasoning. Continue cooking until creamy and serve warm.",
    ],
  },
  {
    slug: "vegetable-pepper-soup",
    title: "Warming vegetable pepper soup",
    description: "A fragrant vegetable bowl for a quiet evening at home.",
    category: "Main dishes",
    time: "35 min",
    servings: 3,
    products: ["pepper-soup-spice"],
    ingredients: [
      "3 cups mixed vegetables, chopped",
      "4 cups vegetable stock",
      "Pepper soup spice, to taste",
      "1 onion, sliced",
    ],
    instructions: [
      "Bring the stock and onion to a gentle simmer.",
      "Add the firmer vegetables and a little pepper soup spice.",
      "Add the remaining vegetables and cook until tender. Taste, season, and serve warm.",
    ],
  },
];
