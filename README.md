# Simbiat · Project Scope Prototype

A clickable, neutral e-commerce prototype for a prospective-client scope conversation. This is **not a production store or an approved final design**. No real orders, payments, authentication, emails, database, CMS, or analytics are connected.

## Run locally

Use Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **[/scope](http://localhost:3000/scope)** — proposed scope, customer flow, assumptions, security approach, materials, exclusions, and 15 open decisions.
- **[/prototype](http://localhost:3000/prototype)** — presentation directory linking to every proposed screen.
- **[/shop](http://localhost:3000/shop)** — 15 sample products across five categories.

No environment variables, secrets, or service accounts are needed. The interface uses local CSS/SVG placeholders and system fonts, so no external photography or font requests are required.

## Present the customer flow

1. Open a product, such as `/shop/classic-chin-chin`.
2. Select a size and dietary option, adjust quantity, and add it to the bag.
3. Open `/cart`, change quantities, or remove items.
4. Continue to guest checkout. Use sample contact/shipping details only.
5. **Place order** shows “Prototype only — no payment was processed.” It does not create an order or navigate automatically.
6. Use **Preview the order confirmation screen** to continue the demonstration.
7. Return to `/scope` to review decisions before final pricing.

The cart, checkout, and screen directory have a **Load sample cart** button. An empty cart is the default. “Buy now” adds the selected configuration and opens the checkout preview.

Mock cart selections survive refreshes within the browser tab through `sessionStorage`. Customer contact, addresses, messages, newsletter addresses, and payment information are never stored or transmitted by the application. There are no card fields. The scope materials checklist is temporary review state, not a submission.

## Screens

| Route                             | Purpose                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `/`                               | Business introduction, categories, featured products, sourcing, recipes, journal, newsletter |
| `/shop`                           | Local category filtering, search, sorting, and product grid                                  |
| `/shop/[slug]`                    | Gallery placeholders, variants, quantity, purchase actions, details, related content         |
| `/cart`                           | Editable selections and estimated summary                                                    |
| `/checkout`                       | Guest contact/shipping layout, delivery placeholder, payment provider explanation            |
| `/order-confirmation`             | Explicitly labeled sample order and next steps                                               |
| `/recipes`                        | Searchable/filterable recipe collection                                                      |
| `/recipes/[slug]`                 | Ingredients, instructions, related products and recipes                                      |
| `/blog`                           | Separate journal index, featured story, search, and categories                               |
| `/blog/[slug]`                    | Editorial article, product CTA, and related stories                                          |
| `/about`                          | Client-approved facts and clearly marked draft story copy                                    |
| `/contact`                        | Mock contact form, business channel placeholders, FAQ                                        |
| `/search`                         | Local search across products, recipes, and articles                                          |
| `/scope`                          | Full project scope presentation and accessible questions modal                               |
| `/prototype`                      | Screen directory and presentation shortcut                                                   |
| `/shipping`, `/privacy`, `/terms` | Policy layout placeholders; not approved legal documents                                     |

All 15 products, six recipes, and five articles have working detail pages. Unknown slugs return 404. Every page carries the global prototype indicator.

## Screenshots and checks

### PDF attachments

- **[Proposed written scope](artifacts/pdf/Simbiat-Proposed-Website-Scope.pdf)** — seven portrait A4 pages with Zulzidan branding and the meeting clarifications. Covers deliverables, exclusions, security, maintenance, budget, payment, timing, and open decisions. This is a draft for review; pricing and commercial terms remain unagreed.

Edit [the written scope source](docs/simbiat-proposed-scope.html) and regenerate it with `npm run export:scope`. The exporter checks page overflow and saves the PDF, a portable HTML companion, and layout proofs in `artifacts/pdf/`.

- **[Visual prototype overview](artifacts/pdf/Simbiat-Visual-Prototype.pdf)** — 23 landscape A4 pages (approximately 2.6 MB). Recommended alongside the written scope: cover, clickable screen index, opening views of all 18 proposed screens, payment detail, and six mobile previews.
- **[Complete screen reference](artifacts/pdf/Simbiat-Prototype-Complete-Reference.pdf)** — 68 landscape A4 pages (approximately 2.3 MB). Includes every desktop screenshot from top to bottom, split into readable continuations with a small overlap.

Both documents carry prototype notices and page numbers. The overview contains excerpts; the complete reference contains the full desktop layouts. These PDFs are visual attachments, not interactive storefronts or approved scope agreements.

Regenerate PDFs from the existing reviewed screenshots:

```bash
npm run export:pdf
```

After changing the interface, refresh screenshots first:

```bash
npm run screenshots
npm run export:pdf
```

The exporter runs locally with Playwright Chromium and requires no running website when existing screenshots are available. PDFs are saved to `artifacts/pdf/`; generated files are ignored by Git. Page totals can change as screenshot lengths change.

### Screenshot gallery and validation

Full-page screenshots are available in `artifacts/screenshots/desktop` (1440 px) and `artifacts/screenshots/mobile` (390 px). Open `artifacts/screenshots/index.html` for an offline gallery after generating screenshots.

```bash
npx playwright install chromium
npm run screenshots
```

This builds the application, starts a local test server on port 3100, checks the presentation screens, and generates the screenshots and gallery. Generated artifacts are ignored by Git.

```bash
npm run lint
npm run type-check
npm run format:check
npm run build
npm test
```

Browser tests run against a production build; run `npm run build` after code changes before `npm test`. Checks cover desktop/mobile layouts, horizontal overflow, browser console/runtime errors, automated accessibility checks, mock forms, variants, cart math and persistence, checkout, search/filtering, navigation, and modal keyboard behavior. Automated accessibility checks do not replace a complete human accessibility audit.

## Edit the prototype

| Location                   | Edit here                                                                      |
| -------------------------- | ------------------------------------------------------------------------------ |
| `data/products.ts`         | Sample names, prices, sizes, dietary labels, descriptions, related recipes     |
| `data/categories.ts`       | Five editable example categories                                               |
| `data/recipes.ts`          | Sample cooking content and product relationships                               |
| `data/posts.ts`            | Sample articles, dates, categories, product CTAs                               |
| `data/scope.ts`            | Proposed capabilities, open questions, materials, exclusions, screen directory |
| `components/`              | Shared cards, navigation, forms, scope, cart, and checkout UI                  |
| `components/ui/button.tsx` | Locally owned shadcn/ui button with Radix Slot and CVA                         |
| `lib/cart-store.ts`        | Browser-only sample cart state and validation                                  |
| `styles/prototype.css`     | Neutral visual system and responsive layouts                                   |
| `app/`                     | App Router screens and metadata                                                |

The project uses Next.js App Router, TypeScript, Tailwind CSS v4, the manually installed shadcn/ui component pattern, Radix Dialog/Slot, Lucide icons, and Sonner notices. Components are locally owned and editable; see the [shadcn manual installation guide](https://ui.shadcn.com/docs/installation/manual).

## Assumptions for review

- Guest checkout is the default. Customer accounts remain an open decision.
- Products, categories, pricing, stock, dietary labels, variants, and editorial content are illustrative. Recipe quantities and preparation instructions require review before publication.
- Medium and large sample variants use 1.5× and 2× the base price to demonstrate variant pricing. These are not approved commercial rules.
- Shipping and tax are **not** calculated. Estimated totals show the sample merchandise subtotal and explicitly exclude them.
- Logo, palette, photography, policies, contact details, prices, and final wording come from the client.
- Production payment, hosting, CMS, authentication, and analytics choices remain unconfirmed. No final architecture, timeline, or price is implied.
- Search indexing is disabled through page metadata because this is a prototype.
