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
export const posts: Post[] = [
  {
    slug: "a-pantry-that-feels-like-home",
    title: "A pantry that feels like home",
    category: "Ingredient guides",
    description:
      "Getting to know the staples that bring familiarity, flavor, and possibility to your kitchen.",
    date: "September 8, 2026",
    readTime: "4 min read",
    product: "white-garri",
    sections: [
      {
        heading: "Start with what you love",
        text: "A well-stocked pantry does not need to be complicated. Start with a few ingredients you know, then make room for something new. A staple, a seasoning, and a favorite snack can be the beginning of a kitchen that feels a little more like home.",
      },
      {
        heading: "Make space for everyday ingredients",
        text: "Garri, beans, and ground egusi are examples of ingredients that can form the foundation of many meals. Each has its own texture and preparation method. The finished store will bring clear product information and practical recipes together so customers can explore at their own pace.",
      },
      {
        heading: "Let curiosity lead",
        text: "If an ingredient is new to you, begin with one simple recipe. Learn how it behaves, how you like it seasoned, and what you enjoy serving alongside it. Familiarity grows one meal at a time.",
      },
    ],
  },
  {
    slug: "closer-to-the-source",
    title: "Good food starts closer to the source",
    category: "Sourcing stories",
    description:
      "Why the relationships behind our food deserve a place in the conversation.",
    date: "September 4, 2026",
    readTime: "3 min read",
    product: "dried-crayfish",
    sections: [
      {
        heading: "The people behind the ingredients",
        text: "Simbiat has shared that her business works with local farmers and fishermen and imports some items directly from Nigeria. These relationships are an important part of the story she wants the website to tell.",
      },
      {
        heading: "Room for the full story",
        text: "This section is reserved for client-approved sourcing stories. Supplier names, locations, photographs, and product-specific sourcing details will be added only after they have been confirmed.",
      },
    ],
  },
  {
    slug: "more-than-a-snack",
    title: "More than a snack: little tastes of home",
    category: "Culture & food",
    description:
      "The small bites that make gatherings, tea breaks, and everyday moments feel special.",
    date: "August 28, 2026",
    readTime: "3 min read",
    product: "classic-chin-chin",
    sections: [
      {
        heading: "The joy of sharing",
        text: "Sometimes a small bowl on the table is all it takes to start a conversation. Snacks can be a connection to familiar places, a shared memory, or simply a welcome pause in a busy day.",
      },
      {
        heading: "Something familiar, something new",
        text: "Our sample snack collection is a way to explore how the store could introduce customers to familiar favorites and new discoveries. The final selection and stories will come from Simbiat.",
      },
    ],
  },
  {
    slug: "meet-egusi",
    title: "Meet egusi: a little ingredient guide",
    category: "African food education",
    description:
      "An approachable introduction to a pantry ingredient with plenty of possibility.",
    date: "August 22, 2026",
    readTime: "4 min read",
    product: "ground-egusi",
    sections: [
      {
        heading: "An ingredient worth exploring",
        text: "Egusi refers to melon seeds used in a variety of dishes. Ground seeds give soups a distinctive texture and body. Preparation varies between kitchens, regions, and personal preferences.",
      },
      {
        heading: "Try it in your kitchen",
        text: "The sample egusi recipe offers one introductory preparation. Final educational content, recipe details, and product information will be reviewed with the client before publication.",
      },
    ],
  },
  {
    slug: "a-new-chapter",
    title: "A new chapter for Simbiat",
    category: "Business updates",
    description:
      "Making room for a more thoughtful online shopping experience.",
    date: "August 15, 2026",
    readTime: "2 min read",
    product: "plantain-chips",
    sections: [
      {
        heading: "A space to discover",
        text: "This visual prototype explores a new home for Simbiat’s products, recipes, and stories. The aim is to make the experience clear, welcoming, and easy to navigate.",
      },
      {
        heading: "Still taking shape",
        text: "This is sample announcement copy, not a launch announcement. Dates, availability, and final features will be confirmed after project scope approval.",
      },
    ],
  },
];
