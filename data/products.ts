// MOCK DATA ONLY. Names, pricing, dietary labels, availability, and sizes need client approval.
export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  sizes?: string[];
  dietary?: string[];
  unit: string;
  usage: string;
  recipe?: string;
};
export const products: Product[] = [
  {
    slug: "plantain-chips",
    name: "Plantain Chips",
    category: "snacks",
    price: 6.5,
    unit: "150 g",
    sizes: ["Small", "Medium", "Large"],
    dietary: ["Vegan"],
    description:
      "A crisp, savory snack for the moments in between. Enjoy a familiar pantry favorite on its own or alongside your favorite dip.",
    usage:
      "Enjoy straight from the pack or serve as a crunchy side. Final ingredients and allergen information to be supplied.",
    recipe: "plantain-snack-bowl",
  },
  {
    slug: "classic-chin-chin",
    name: "Classic Chin Chin",
    category: "snacks",
    price: 8,
    unit: "200 g",
    sizes: ["Small", "Medium", "Large"],
    dietary: ["Vegetarian", "Vegan"],
    description:
      "Little golden bites with a satisfying crunch. A sample of the much-loved snack that makes a lovely companion to tea and conversation.",
    usage:
      "Serve as a snack with tea or share at a gathering. Sample dietary options require recipe confirmation.",
  },
  {
    slug: "white-garri",
    name: "White Garri",
    category: "grains-staples",
    price: 12,
    unit: "1 kg",
    sizes: ["Small", "Medium", "Large"],
    dietary: ["Vegan"],
    description:
      "A versatile cassava staple with a place in many Nigerian kitchens. A starting point for familiar meals and new discoveries.",
    usage:
      "Prepare according to the final package instructions. This sample product illustrates a staple with multiple size options.",
    recipe: "everyday-eba",
  },
  {
    slug: "ground-egusi",
    name: "Ground Egusi",
    category: "pantry-essentials",
    price: 14,
    unit: "300 g",
    dietary: ["Vegan"],
    description:
      "Ground melon seeds for adding texture and depth to your cooking. A thoughtful addition to a well-stocked African pantry.",
    usage:
      "Use in soups and stews. Final preparation guidance, ingredients, and storage details need approval.",
    recipe: "egusi-greens",
  },
  {
    slug: "suya-spice",
    name: "Suya Spice Blend",
    category: "spices-ingredients",
    price: 7.5,
    unit: "100 g",
    description:
      "A sample spice blend for bold, warming flavor. Designed to show how ingredients and allergen details will appear on the finished store.",
    usage:
      "Use as a seasoning to taste. This example may contain peanuts; final allergen labeling is required.",
  },
  {
    slug: "dried-crayfish",
    name: "Dried Crayfish",
    category: "specialty-foods",
    price: 16,
    unit: "150 g",
    sizes: ["Small", "Medium"],
    description:
      "An ingredient traditionally used to bring savory depth to soups and stews. Sourcing and packaging details are placeholders.",
    usage:
      "Add to cooked soups or stews according to your recipe. Contains shellfish in this sample concept.",
  },
  {
    slug: "honey-beans",
    name: "Honey Beans",
    category: "grains-staples",
    price: 13,
    unit: "1 kg",
    dietary: ["Vegan"],
    description:
      "An everyday staple for comforting bowls, bean dishes, and shared family meals.",
    usage:
      "Sort, rinse, and cook thoroughly according to final package directions.",
    recipe: "honey-bean-bowl",
  },
  {
    slug: "palm-oil",
    name: "Red Palm Oil",
    category: "pantry-essentials",
    price: 11,
    unit: "500 ml",
    dietary: ["Vegan"],
    description:
      "A pantry ingredient used in a range of traditional dishes. Final origin and processing information will be confirmed.",
    usage: "Use in cooked dishes according to your recipe.",
  },
  {
    slug: "ground-pepper",
    name: "Ground Dry Pepper",
    category: "spices-ingredients",
    price: 6,
    unit: "100 g",
    dietary: ["Vegan"],
    description:
      "A little heat for soups, stews, and everyday cooking. A sample pantry staple with a simple product configuration.",
    usage: "Add gradually to taste and keep away from eyes when handling.",
  },
  {
    slug: "kulikuli",
    name: "Kuli Kuli",
    category: "snacks",
    price: 7,
    unit: "150 g",
    dietary: ["Vegan"],
    description:
      "A crunchy groundnut snack to discover and share. Product ingredients and dietary suitability are illustrative.",
    usage:
      "Enjoy as a snack or crumble over a bowl. Contains peanuts in this sample concept.",
  },
  {
    slug: "yam-flour",
    name: "Yam Flour",
    category: "grains-staples",
    price: 15,
    unit: "1 kg",
    dietary: ["Vegan"],
    description:
      "A flour for preparing a comforting accompaniment to your favorite soups.",
    usage: "Prepare with water using the final package directions.",
  },
  {
    slug: "ogbono",
    name: "Ground Ogbono",
    category: "pantry-essentials",
    price: 13.5,
    unit: "200 g",
    dietary: ["Vegan"],
    description:
      "A sample ingredient for the pantry, often used to give soups their characteristic texture.",
    usage: "Use in a cooked soup following a trusted recipe.",
  },
  {
    slug: "pepper-soup-spice",
    name: "Pepper Soup Spice",
    category: "spices-ingredients",
    price: 8.5,
    unit: "100 g",
    description: "A fragrant sample blend for a warming bowl of pepper soup.",
    usage: "Simmer in soup to taste. Final blend composition to be confirmed.",
    recipe: "vegetable-pepper-soup",
  },
  {
    slug: "dried-hibiscus",
    name: "Dried Hibiscus",
    category: "specialty-foods",
    price: 9,
    unit: "100 g",
    dietary: ["Vegan"],
    description:
      "Dried hibiscus petals for a refreshing drink served warm or over ice.",
    usage: "Rinse and steep according to final package instructions.",
    recipe: "hibiscus-cooler",
  },
  {
    slug: "dried-ugu",
    name: "Dried Ugu Leaves",
    category: "specialty-foods",
    price: 10,
    unit: "80 g",
    dietary: ["Vegan"],
    description:
      "A leafy ingredient for soups and other home-cooked dishes. Exact origin and availability are unconfirmed.",
    usage: "Prepare and cook according to final package instructions.",
    recipe: "egusi-greens",
  },
];
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
export function productPrice(product: Product, size?: string) {
  return product.price * (size === "Large" ? 2 : size === "Medium" ? 1.5 : 1);
}
