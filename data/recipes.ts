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
