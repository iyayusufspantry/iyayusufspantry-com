// Mock articles and dates for visual scope review, not published business claims.
export type Post = {
  slug: string;
  title: string;
  category: string;
  description: string;
  date: string;
  readTime: string;
  product: string;
  sections: { heading: string; text: string }[];
};
