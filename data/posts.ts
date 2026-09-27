// Articles are managed in Contentful; sample content remains marked separately.
export type Post = {
  slug: string;
  title: string;
  category: string;
  description: string;
  date: string;
  readTime: string;
  author?: string;
  approved?: boolean;
  product: string;
  sections: { heading: string; text: string }[];
};
