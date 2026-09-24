# Simbiat · Storefront and Production Foundations

A storefront prototype with Clerk accounts and Contentful-managed website content. This is **not a production store or an approved final design**. An optional Stripe sandbox checkout now persists test orders and stock in PostgreSQL and handles signed payment events. Live payments, owner authorization, email and analytics remain unconnected.

Deployed on Vercel at [www.iyayusufspantry.com](https://www.iyayusufspantry.com). Homepage and shop returned HTTP 200 on 24 September 2026; the Contentful revalidation endpoint returned HTTP 404, so webhook setup remains pending.

## Development record

- [Client context](docs/client-context.md): confirmed branding, supplied logo, latest client decisions, and pending domain/account setup.
- [Development log](docs/development-log.md): changes, validation results, evidence, and pending client dependencies.
- [Foundation architecture](docs/production-foundations.md): implementation boundaries, API, inventory/order rules, integration checklist, and repeatable validation.
- [Content model](docs/content-model.md) and [product intake CSV](docs/product-intake.csv): preparation for client content and CMS setup.
- [Contentful integration](docs/contentful-migration.md): 11 active content types, 107 published entries, 16 assets, editing instructions and secured cache revalidation. Registering the remote webhook requires the revalidation route and matching secret to be available on the deployed site.
- [Before screenshots](artifacts/milestones/01-foundations/before/index.html) and [current screenshot gallery](artifacts/screenshots/index.html).
- [Foundation progress PDF](artifacts/pdf/Simbiat-Foundation-Progress.pdf): summary and desktop/mobile review images. Regenerate with `npm run export:foundations` after screenshots.
- Archive each reviewed milestone with `npm run archive:milestone -- 01-foundations after` (use a new stage name for later captures). Archives live under `artifacts/milestones/` and are Git-ignored.

## Run locally

For working local test payments, follow [Stripe sandbox setup](docs/stripe-payments.md): `npm run payments:setup`, then `npm run payments:dev`. The checkout uses Stripe-hosted test payments while this feature is enabled. The prototype walkthrough below applies when `STRIPE_CHECKOUT_ENABLED=false`.

Use Node.js 20.9 or newer. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the intended Clerk application to `.env` or `.env.local` before starting or building. Both files are Git-ignored; never commit the secret key. CLI login is optional when keys are configured directly.

Also configure `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ENVIRONMENT=master`, `CONTENTFUL_DELIVERY_TOKEN`, and `CONTENTFUL_REVALIDATION_SECRET`. Contentful must contain the published site entries and assets before the app can build or render. `CMA_TOKEN` is needed only for management scripts. Contentful credentials are server-only; there is no local-content fallback.

```bash
corepack pnpm install --frozen-lockfile
npm run dev
```

Dependency installs use the pnpm version pinned in `package.json`, matching Vercel. Use `corepack pnpm add` when adding packages and commit the updated `pnpm-lock.yaml` with `package.json`. Running scripts with `npm run` is still supported.

Open [http://localhost:3000](http://localhost:3000).

- **[/scope](http://localhost:3000/scope)** — proposed scope, customer flow, assumptions, security approach, materials, exclusions, and 15 open decisions.
- **[/prototype](http://localhost:3000/prototype)** — presentation directory linking to every proposed screen.
- **[/shop](http://localhost:3000/shop)** — 15 sample products across five categories.
- **[/prototype/owner](http://localhost:3000/prototype/owner)** — fictional order and stock workspace. Changes reset on refresh and do not update the storefront.

Clerk provides account sign-in, sign-up, and profile/sign-out controls in the desktop header and mobile menu, plus `/sign-in` and `/sign-up` pages. Its UI uses the storefront's shadcn theme and requires access to Clerk's services. Create a first test account using **Sign up**; successful authentication shows a profile button. Storefront browsing and guest checkout remain public, and `/prototype/owner` still contains public sample data. Production owner authorization is a separate integration step.

The interface loads the Iya Yusuf's Pantry logo and supplied photography from Contentful, with code-drawn illustrations for products without photography and system fonts.

The storefront theme uses cream, mint, navy, and the confirmed `#06ad8f` green, with a darker green for accessible text and buttons. Edit Contentful Site settings for brand colors and images; structural styling remains in `styles/brand.css`. Supplied assortment photos are editorial references; only clearly labeled red palm oil is mapped to a specific sample product. Current catalogue details and packaging still require client approval.

## Present the customer flow

1. Open a product, such as `/shop/classic-chin-chin`.
2. Select a size and dietary option, adjust quantity, and add it to the bag.
3. Open `/cart`, change quantities, or remove items.
4. Continue to guest checkout. Use **Check sample availability** to recalculate prices and check sample stock on the server. Only product selections are sent. Use sample contact/shipping details only.
5. **Place order** shows “Prototype only — no payment was processed.” It does not create an order or navigate automatically.
6. Use **Preview the order confirmation screen** to continue the demonstration.
7. Open `/prototype/owner` to review sample order fulfillment and stock editing. `/scope` remains the historical scope presentation; the development log records current progress.

The cart, checkout, and screen directory have a **Load sample cart** button. An empty cart is the default. “Buy now” adds the selected configuration and opens the checkout preview.

Mock cart selections survive refreshes within the browser tab through `sessionStorage`. Checkout contact/address fields, contact messages, newsletter addresses, and payment information are never stored or transmitted by the prototype forms. Account information entered into Clerk's authentication UI is handled by Clerk. There are no card fields. The scope materials checklist is temporary review state, not a submission.

The shared cart uses Zustand with a store per `CartProvider` instance. Components select only the state/actions they need; the header selects the item count. Persistence restores after hydration and preserves existing `simbiat-scope-cart-v1` selections. Invalid entries and extra fields are discarded, duplicate variants are merged, and storage failures leave the in-memory cart usable. Local controls continue to use React state.

The sample review API reads explicit variant prices and fixed sample stock. It creates no orders or reservations, and shipping, tax, and final totals remain uncalculated. The owner preview uses separate component-memory fixtures. The reusable order rules require a transactional persistence adapter and verified payment integration before production use.

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

- **[Website development proposal](artifacts/pdf/Simbiat-Website-Proposal.pdf)** — current two-page proposal with the updated US$500 build fee, two US$250 payments via Wise, launch scope, timing, and support. Work begins on receipt of the deposit; separate running costs will be confirmed before purchasing services. Use the [payment email](docs/simbiat-proposal-email.md) to share the updated proposal and bank details. Edit [the proposal source](docs/simbiat-website-proposal.html) and regenerate with `node scripts/export-proposal-pdf.mjs`. The earlier estimates below are historical references, not the current offer.

- **[Initial website estimate](artifacts/pdf/Simbiat-Initial-Website-Estimate.pdf)** — three A4 pages covering the proposed build range, scope assumptions, payment milestones, support, and running costs. Pricing and platform choices are provisional. See the [email draft](docs/simbiat-estimate-email.md) and [internal calculation notes](docs/simbiat-estimate-working-notes.md). Edit [the estimate source](docs/simbiat-initial-estimate.html) and regenerate with `node scripts/export-estimate-pdf.mjs`.

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

| Location                       | Edit here                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `data/products.ts`             | Sample names, prices, sizes, dietary labels, descriptions, related recipes     |
| `data/categories.ts`           | Five editable example categories                                               |
| `data/recipes.ts`              | Sample cooking content and product relationships                               |
| `data/posts.ts`                | Sample articles, dates, categories, product CTAs                               |
| `data/scope.ts`                | Proposed capabilities, open questions, materials, exclusions, screen directory |
| `components/`                  | Shared cards, navigation, forms, scope, cart, and checkout UI                  |
| `components/ui/button.tsx`     | Locally owned shadcn/ui button with Radix Slot and CVA                         |
| `lib/cart-store.ts`            | Zustand cart factory, selectors, validation, and session persistence           |
| `data/product-variants.json`   | Explicit sample variant IDs and prices in cents                                |
| `lib/commerce/`                | Catalogue validation, order/stock transitions, and isolated sample fixtures    |
| `app/api/cart/review/`         | Server-side sample cart review; no payments or reservations                    |
| `components/owner-preview.tsx` | Interactive sample owner workspace                                             |
| `styles/prototype.css`         | Shared component layouts using brand color variables                           |
| `styles/brand.css`             | Brand palette, typography, component styling, and responsive refinements       |
| `data/brand-assets.ts`         | Client photography references and explicit product/editorial image mappings    |
| `app/`                         | App Router screens and metadata                                                |

The project uses Next.js App Router, TypeScript, Tailwind CSS v4, the manually installed shadcn/ui component pattern, Radix Dialog/Slot, Lucide icons, and Sonner notices. Components are locally owned and editable; see the [shadcn manual installation guide](https://ui.shadcn.com/docs/installation/manual).

## Assumptions for review

- Guest checkout is the default. Customer accounts remain an open decision.
- Products, categories, pricing, stock, dietary labels, variants, and editorial content are illustrative. Recipe quantities and preparation instructions require review before publication.
- Sample variant prices are now explicit integer-cent records, initially copied from the prototype's example prices. They are not approved commercial prices; no runtime size multiplier sets a variant's price.
- Shipping and tax are **not** calculated. Estimated totals show the sample merchandise subtotal and explicitly exclude them.
- Logo, palette, photography, policies, contact details, prices, and final wording come from the client.
- Production payment, hosting, CMS, authentication, and analytics choices remain unconfirmed. No final architecture, timeline, or price is implied.
- Search indexing is disabled through page metadata because this is a prototype.
