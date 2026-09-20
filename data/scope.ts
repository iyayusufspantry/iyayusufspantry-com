export const openDecisions = [
  [
    "Shipping regions",
    "Which US states or other regions should the store serve?",
  ],
  [
    "Shipping calculation method",
    "Flat rate, order value, weight, or another calculation?",
  ],
  [
    "Sales tax requirements",
    "What tax requirements and calculation approach need to be supported?",
  ],
  [
    "Inventory tracking requirements",
    "How should stock levels, low-stock alerts, and sold-out items work?",
  ],
  [
    "Guest checkout vs customer accounts",
    "Is guest checkout sufficient initially, or are customer accounts needed?",
  ],
  [
    "Coupons / discount codes",
    "Are promotions required at launch, and what rules should they follow?",
  ],
  [
    "Newsletter / email marketing",
    "Is a mailing list required, and which service should connect to it?",
  ],
  [
    "Order management requirements",
    "Who will manage orders, and which fulfillment and notification steps are needed?",
  ],
  [
    "Paid vs free recipes",
    "Should all recipe content be freely available? Paid access is not assumed.",
  ],
  [
    "WhatsApp integration",
    "Is a simple contact link enough, or is a deeper integration needed?",
  ],
  [
    "Final payment provider",
    "Which established payment provider will be approved?",
  ],
  [
    "Hosting",
    "Which hosting setup, ongoing costs, and support responsibilities are appropriate?",
  ],
  [
    "Required legal / policy pages",
    "Which shipping, returns, privacy, and terms pages will the client supply?",
  ],
  [
    "Initial content entry",
    "How many recipes and blog posts should be entered at launch?",
  ],
  [
    "Historical Shopify data",
    "Does any historical customer or order data need to be migrated from Shopify?",
  ],
];
export const scopeFeatures = [
  [
    "Responsive storefront",
    "A consistent, welcoming experience across desktop, tablet, and mobile.",
  ],
  [
    "Home page",
    "Introduce the business, collections, products, recipes, and stories.",
  ],
  [
    "Product catalog",
    "An initial collection of approximately 15 products, with room to grow.",
  ],
  [
    "Product categories",
    "Approximately five editable groups that make products easy to explore.",
  ],
  [
    "Product detail pages",
    "Photography, descriptions, pricing, usage, and supporting information.",
  ],
  [
    "Product variants",
    "Size and dietary options where applicable and approved.",
  ],
  [
    "Shopping cart",
    "Add, review, adjust quantities, and remove selected items.",
  ],
  [
    "Checkout experience",
    "A clear guest flow for contact, delivery, and payment.",
  ],
  [
    "Third-party payment integration",
    "Proposed established provider; selection and setup to be confirmed.",
  ],
  [
    "Order confirmation",
    "A clear post-purchase summary and expected next steps.",
  ],
  [
    "Recipes",
    "A recipe collection with ingredients, instructions, and relevant products.",
  ],
  [
    "Blog",
    "A separate home for education, sourcing stories, and business updates.",
  ],
  [
    "Contact form",
    "A straightforward customer inquiry form; delivery integration to be confirmed.",
  ],
  ["Search", "Help customers discover products, recipes, and articles."],
  [
    "Content management capability",
    "Routine product and content editing; the CMS is not yet selected.",
  ],
  [
    "Basic technical SEO foundations",
    "Page metadata, readable URLs, and appropriate indexability at launch.",
  ],
  [
    "Analytics foundations",
    "An agreed approach to basic measurement and privacy choices.",
  ],
  [
    "Responsive / mobile optimization",
    "Readable content and usable forms and navigation on small screens.",
  ],
  [
    "Deployment / setup",
    "Launch setup and configuration on an approved hosting provider.",
  ],
  [
    "Security best practices",
    "Appropriate access controls and trusted providers for sensitive operations.",
  ],
];
export const clientMaterials = [
  "Logo",
  "SVG logo if available",
  "Brand colors / brand guidelines",
  "Product photography",
  "Product names",
  "Product descriptions",
  "Prices",
  "Product variants",
  "Shipping information",
  "Business contact information",
  "Policies",
  "Initial recipe / blog content if available",
];
export const exclusions = [
  "Subscriptions",
  "Recurring payments",
  "Marketplace / multiple vendors",
  "Loyalty program",
  "Advanced customer accounts",
  "Wholesale portal",
  "Complex warehouse management",
  "Multi-currency",
  "Multi-language",
  "Native mobile app",
  "Advanced ERP integration",
  "Custom payment processing",
  "Shipping carrier API integrations",
  "Complex automated marketing",
];
export const prototypeScreens = [
  {
    name: "Owner dashboard preview",
    href: "/prototype/owner",
    purpose:
      "Review sample orders, fulfill paid orders, and adjust sample stock.",
    group: "Business tools",
  },
  {
    name: "Homepage",
    href: "/",
    purpose: "Meet the business and discover the collection.",
    group: "Storefront",
  },
  {
    name: "Shop",
    href: "/shop",
    purpose: "Browse, filter, and sort 15 sample products.",
    group: "Storefront",
  },
  {
    name: "Product detail",
    href: "/shop/plantain-chips",
    purpose: "Explore details, select a size, and add to cart.",
    group: "Storefront",
  },
  {
    name: "Shopping cart",
    href: "/cart",
    purpose: "Review items, change quantities, and see the summary.",
    group: "Shopping flow",
  },
  {
    name: "Guest checkout",
    href: "/checkout",
    purpose: "Preview delivery and the payment provider placeholder.",
    group: "Shopping flow",
  },
  {
    name: "Order confirmation",
    href: "/order-confirmation",
    purpose: "Preview a sample success screen and next steps.",
    group: "Shopping flow",
  },
  {
    name: "Recipes",
    href: "/recipes",
    purpose: "Search and explore cooking inspiration.",
    group: "Content",
  },
  {
    name: "Recipe detail",
    href: "/recipes/egusi-greens",
    purpose: "Read ingredients and instructions, then shop related products.",
    group: "Content",
  },
  {
    name: "Journal / Blog",
    href: "/blog",
    purpose: "Browse educational, cultural, and business stories.",
    group: "Content",
  },
  {
    name: "Article",
    href: "/blog/a-pantry-that-feels-like-home",
    purpose: "Read a story and discover relevant products.",
    group: "Content",
  },
  {
    name: "About",
    href: "/about",
    purpose: "Explore the proposed business story and sourcing narrative.",
    group: "Business",
  },
  {
    name: "Contact",
    href: "/contact",
    purpose: "Preview inquiries, contact channels, and FAQs.",
    group: "Business",
  },
  {
    name: "Site search",
    href: "/search",
    purpose: "Search across products, recipes, and articles.",
    group: "Storefront",
  },
  {
    name: "Project scope",
    href: "/scope",
    purpose: "Review proposed features, assumptions, and open decisions.",
    group: "Project review",
  },
  {
    name: "Shipping",
    href: "/shipping",
    purpose: "Review placeholder delivery information and policy requirements.",
    group: "Policies",
  },
  {
    name: "Privacy",
    href: "/privacy",
    purpose:
      "Show the proposed privacy page location and content requirements.",
    group: "Policies",
  },
  {
    name: "Terms",
    href: "/terms",
    purpose: "Show the proposed terms page location and content requirements.",
    group: "Policies",
  },
];
