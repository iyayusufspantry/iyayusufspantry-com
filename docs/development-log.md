# Simbiat development log

## 26 September 2026 — Contentful references for client editing

- Replaced JSON editing with linked Website text, Content section, Navigation link, and Brand or contact value entries. Migrated 52 parent entries and published 764 children; the space now has 15 models, 871 entries, and 16 assets.
- Preserved original JSON/rich-text fields for rollback and hid them from the normal editor. The website prefers linked content, preserves section/menu ordering, and never restores archived JSON when a migrated reference list is cleared or unpublished.
- Added a repeatable migration with snapshots, editor-change/version guards, deterministic IDs, bounded concurrency, and pre/post render comparisons. A rerun creates no entries or parent changes. The complete published Delivery API snapshot matches the original website content.
- Added four reference migration/mapper tests and the [client editing guide](contentful-editing.md). Existing product, recipe, FAQ and media editing remains available. Stock and orders stay in the protected dashboard.
- Validation: production build, lint, formatting, all four reference tests and all 104 existing desktop/mobile checks passed against the migrated Contentful data. No product prices, stock, order records, or displayed wording were changed by this migration.

## 24 September 2026 — Local Stripe sandbox checkout

- Implemented server-created Stripe Checkout sessions, signed raw-body webhooks, persistent PostgreSQL test orders and inventory, idempotent requests/events, stock reservations and expiry/failure handling. Live keys/events are rejected; test shipping and tax are explicitly zero.
- Added a local launcher that starts Next.js and Stripe CLI forwarding, obtains the local signing secret without displaying it, and preserves the Dashboard secret in `.env`. Local overrides are stored in Git-ignored `.env.local`. A port argument supports running alongside other projects.
- Added sandbox checkout and verified order confirmation screens, database setup, recovery, transaction tests and browser tests. The public owner preview and email remain unconnected to saved orders.
- Validation: production build, type checking, lint and formatting passed; eight payment/database tests and six desktop/mobile checkout checks passed. Ten relevant existing prototype/commerce checks passed, including one focused rerun after two simultaneous Playwright runs collided on their original output directory; payment tests now have a separate output directory.
- Real Stripe sandbox validation: created a Checkout Session and verified request retries reuse it; expired the session and received a signed `checkout.session.expired` callback with HTTP 200, releasing its reservation. Then submitted a hosted test-card purchase and received `checkout.session.completed` with HTTP 200; the order became paid, sample stock decreased, and the website showed confirmation. No live charge was made. Evidence: `artifacts/payments/confirmed-test-payment.png`.
- Local checkout was tested on port 3002 because another project used port 3000. Nothing has been deployed. See [Stripe setup and boundaries](stripe-payments.md).

## 21 September 2026 — Account modal visual refinement

- Reworked the native Clerk sign-in/sign-up modal into a centered desktop layout with Contentful pantry photography and the site tagline alongside the form. The image uses Next image optimization; no new local content source was added.
- Improved form typography, logo alignment, input/button sizing and footer spacing. The background is softly blurred, and screens below 700px use a compact single-column form. Clerk still manages the modal, OAuth, verification, focus and dismissal.
- Added the missing accessible name to Clerk's portal dialog using the existing Contentful account label. Profile dialogs retain their existing layout.
- Validation: production build, lint, formatting and all six authentication checks passed. Visual checks at 1440px, 390px and 320px confirmed no horizontal overflow; modal-scoped axe checks reported no violations. Previews: `artifacts/auth-desktop.png`, `artifacts/auth-mobile.png`, `artifacts/auth-small.png`.

## 21 September 2026 — Contentful storefront and revalidation

- Switched the storefront to published Contentful entries/assets with server-only paginated fetching and explicit mapping. Local seed data is now restricted to migration/test fixtures; runtime content does not fall back to it.
- Connected catalog variants/pricing, categories, editorial content, page/shared copy, metadata, menus, FAQs, policy sections, contact details, homepage selections, logo/icon, brand colors and image references. Preserved Clerk accounts and the existing sample checkout boundary.
- Published remaining imported drafts, added five editable brand-image links and 31 additional UI/template copy blocks. Round-trip verification passed for all 107 entries, 16 assets and 11 active models.
- Added a secret-authenticated Contentful webhook with topic/environment checks, bounded input and Delivery API readiness checking. Successful events expire the shared Next.js cache tag and root layout; a 60-second timed refresh provides recovery. Generated the local secret without exposing it.
- Added repeatable webhook registration tooling. Remote registration and live cloud delivery remain pending the public deployed URL and matching hosting environment variables.
- Validation: production build, ESLint, formatting, five offline migration tests and Contentful round-trip verification passed. The 104-check desktop/mobile suite passed 102 checks; its two checkout privacy checks then passed on focused rerun after allowing only Clerk's known initialization endpoints while still checking every request for entered checkout data. The run covers all pages, accessibility, cart persistence, CMS mapping and webhook validation. An authenticated request with an actual published Contentful event returned `200 { revalidated: true }` against the production server locally.

## 21 September 2026 — Contentful models and draft data import

- Connected to the user-supplied Contentful space and `master` environment using the environment loader. The user authorized the CMA token after Contentful initially rejected it with `OrganizationAccessGrantRequired`.
- Created and activated 11 content types, imported 107 draft entries, and uploaded/processed 16 assets. Includes 15 products, five categories, 25 variants, six recipes, five articles, three policies, four FAQs, 21 page records, settings, three navigation menus, and 19 shared-copy records.
- Preserved existing sample copy, exact variant prices/IDs and references. Added rich-text article/policy review bodies and kept structured source content. Did not import transactional stock/orders, user credentials or private project files.
- Added repeatable export/plan/import/verify scripts with deterministic IDs, existing-record preservation, source-refresh guards, version checks, retry handling, processing checks and local snapshots. All data remains draft; the storefront has not been switched from local imports to Contentful.
- Validation: every imported entry field/reference matches the source manifest; all asset byte sizes and processing states match. Re-running import created/updated zero records and preserved all 107 entries. Five offline migration tests, ESLint and formatting passed. Both CMA and Delivery token checks succeeded; the Delivery API correctly reports zero published entries.
- See [migration documentation](contentful-migration.md) and `artifacts/contentful/verification-report.json` for details and evidence.

## 21 September 2026 — Branded Clerk components

- Used Clerk Core 3's supported `appearance.elements` API to customize its prebuilt components. The older `@clerk/elements` package is deprecated and was not installed; [Clerk's Elements notice](https://clerk.com/docs/guides/customizing-clerk/elements/overview) recommends the newer hooks for fully custom authentication flows.
- Added a shared appearance configuration in `lib/clerk-appearance.ts` for the brand logo, cream/mint palette, serif headings, white inputs, rounded buttons, and profile/popover styling. Customized the initial sign-in and sign-up copy using Clerk localization overrides. Verification and account-security flows remain handled by Clerk.
- Redesigned `/sign-in` and `/sign-up` with a reusable responsive introduction, storefront photography on larger screens, and a link back to the shop. Mobile keeps the introduction and account form in a single column.
- Retained the Clerk attribution and development notice; removed the decorative development grid and darkened the warning color after accessibility checks identified insufficient footer contrast.
- Validation: production build/TypeScript and lint passed; all six desktop/mobile authentication checks passed; formatting passed. Browser checks showed no horizontal overflow at 390, 768, and 1440 px. Final signup accessibility scans reported no WCAG 2 A/AA violations on desktop and mobile. Review images are in `artifacts/support/clerk-branded/`.
- Signed-in profile styling is configured through the same provider but still needs review with the user's first authenticated account. This change does not add saved addresses, order history, or administrative authorization.

## 21 September 2026 — Clerk account authentication

- Completed the SDK integration using the user-supplied `.env` after the user chose environment configuration instead of CLI OAuth. Environment files were not opened or printed and remain Git-ignored.
- Installed `@clerk/nextjs` 7.9.4 and `@clerk/ui` 1.33.1; synchronized npm and pnpm lockfiles. Explicitly disabled optional native WebSocket build scripts and the core-js postinstall in pnpm's build policy; frozen installation passes.
- Added `ClerkProvider` inside the root body, the shadcn theme with the storefront's CSS variables, and `proxy.ts` with `/__clerk/:path*` exactly once after the API/TRPC matcher. Added `/sign-in` and `/sign-up` pages and modal sign-in/sign-up controls in the desktop header and mobile menu. Signed-in users receive Clerk's account/profile button with sign-out controls.
- Browsing, guest checkout, and the fictional owner preview remain public. Real owner authorization and persistent customer/order data are not part of this integration. Updated README and privacy preview to distinguish prototype form data from account data handled by Clerk.
- Changed the Playwright server and base URL to `localhost`: Next.js normalized the loopback IP to localhost in Clerk's rewrite, causing the previous `127.0.0.1` test server configuration to loop.
- Validation: production build (including TypeScript), standalone type check, lint, formatting, and Git whitespace checks passed. The full 90-test run passed 88 checks; the two contact/newsletter tests incorrectly counted Clerk development-browser initialization as form submission. Updated those assertions to allow only the observed Clerk bootstrap endpoints and check all request payloads for sample form data. All **10 targeted desktop/mobile auth, privacy, and contact/newsletter checks then passed**.
- Browser checks confirmed real Clerk sign-in/sign-up dialogs and standalone forms, keyboard dismissal, and no horizontal overflow at 390, 768, 1024, and 1440 px. Visually reviewed desktop and mobile captures in `artifacts/support/clerk/`. The existing development server on port 3000 serves the integrated app.
- `clerk doctor` ran, but its environment parser reported a missing publishable key despite the successful Next.js build and live Clerk forms. CLI account/application-link checks were skipped without OAuth. No account was created during automation; the user should complete their first signup to verify the signed-in profile and sign-out flow.
- References: [Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart), [Clerk themes](https://clerk.com/docs/nextjs/guides/customizing-clerk/appearance-prop/themes), and the installed Next.js proxy/layout guides.

## 21 September 2026 — Sticky storefront header

- Made the shared header stick to the top while scrolling, with its existing cream background and responsive logo/navigation. The prototype notice scrolls away above it.
- Added anchor and checkout-summary offsets to keep content clear of the header. The mobile menu scrolls within short viewports.
- Validation: formatting passed; browser checks passed at 1440, 390, and 667 px, including mobile menu navigation, horizontal overflow, page errors, recipe anchor positioning, and checkout summary clearance. Captures are in `artifacts/support/sticky-header/`.

## 20 September 2026 — Zustand cart migration

- Installed Zustand 5.0.15 and updated both npm and pnpm lockfiles. Replaced the custom module-level cart snapshot and listener set with a Zustand store factory and persistence middleware.
- Each `CartProvider` owns a stable store instance. Zustand selectors subscribe the header to the item count and add-to-cart controls to a stable action; cart, summary, checkout, and confirmation views select the values they use. Toasts remain in the UI hooks and local controls retain React state.
- Preserved the `simbiat-scope-cart-v1` session key and raw-array format, with delayed restoration after hydration. Validation discards unknown variants and extra fields, merges duplicate selections, and caps quantities at 99. Only item selections persist; blocked storage, malformed JSON, and quota errors leave an operational in-memory cart.
- Added regression coverage for store isolation, deferred restoration, legacy data, quantity validation, persistence field filtering, and browser behavior with invalid/disabled/full storage.
- Validation: production build/TypeScript, ESLint, formatting, frozen pnpm install, and **84 desktop/mobile tests passed** (42.7 seconds). Existing navigation, cart calculations, refresh persistence, checkout privacy, accessibility, and screenshot checks passed. Full output: [validation log](../artifacts/zustand-validation.log).

## 20 September 2026 — Complete storefront brand theme

- Applied Iya Yusuf's Pantry branding across the homepage, catalogue, product galleries, cart, checkout, confirmation, recipes, journal, about/contact, policies, scope, and owner preview. Shared colors now use cream, mint, lime, and logo navy, with `#06ad8f` accents and darker `#087862` for readable buttons and text. Added serif headings, softer cards, rounded controls, and a navy footer.
- Inspected all client reference images and added explicit [photo mappings](../data/brand-assets.ts). The homepage now features the supplied assortment and an editorial photo gallery; the story/journal use relevant pantry photos. Only clearly labeled red palm oil is mapped to a sample product. Unconfirmed product and recipe photography retains styled, clearly identified placeholders.
- Added the shared [brand stylesheet](../styles/brand.css), converted previous neutral CSS colors to shared variables, and aligned Tailwind utilities with the palette. Existing catalogue prices, stock, and checkout behavior remain illustrative.
- Corrected footer contrast, photo-gallery minimum widths, and tablet layout after browser review. Screenshot checks now decode all images before capture; added coverage for the photographed product and 320/768 px gallery behavior.
- Made the test/screenshot commands call the installed `@playwright/test` CLI directly after the existing Windows shim selected a different Playwright installation. Excluded generated artifacts and Playwright reports from ESLint so repeated checks lint project source only.
- Validation: production build and TypeScript, ESLint, formatting, and the full **74-test desktop/mobile suite** passed. Screen checks include automated WCAG A/AA checks, image loading, page errors, and overflow. Additional checks at 320, 390, 768, and 1440 px cover the homepage, shop, photographed product, and checkout.
- Review the refreshed [screenshot gallery](../artifacts/screenshots/index.html): 48 full-page captures (24 desktop and 24 mobile). The original foundation milestone archive and earlier proposal PDFs remain historical records. Local development preview is available at `http://localhost:3000`.

## 20 September 2026 — Site logo application

- Confirmed the horizontal logo is used in the shared header and footer. Added the matching cart symbol as the SVG browser icon and replaced the starter favicon; both regenerate with the brand assets script.
- Updated default/page-template titles, the metadata description, and footer copyright to Iya Yusuf's Pantry.
- Validation: targeted ESLint and TypeScript checks passed. Desktop/mobile browser checks confirmed both logos load, SVG/ICO endpoints return successfully, and no horizontal overflow. Confirmed the homepage and shop page titles use the business name; refreshed the branding homepage/footer captures.

## 20 September 2026 — Reconstructed logo assets

- Rebuilt the supplied Iya Yusuf's Pantry logo as portable SVG geometry: cart, rounded path lettering, and transparent background. The lettering is a manual approximation, not the original font; flat lime/navy supporting colors preserve the reference while the lettering and rear cart panel use the confirmed `#06ad8f` green.
- Added stacked, horizontal, and cart-only SVGs plus transparent PNGs at 3× resolution in [public/brand](../public/brand/README.md). The original JPEG is preserved. Regenerate with `node scripts/export-brand-assets.mjs`.
- Applied the horizontal SVG to the storefront header and footer with accessible home-link labels and responsive sizing.
- Validation: targeted ESLint and TypeScript checks passed. Browser checks at 320, 390, 768, and 1440 px confirmed both logos load and no horizontal overflow; mobile navigation opens/closes and no browser page errors were reported. Checked vector geometry stays inside each viewBox and contains no bitmap, live text, or script elements.
- Visually reviewed the [side-by-side logo sheet](../artifacts/branding/index.html), [desktop homepage](../artifacts/branding/home-1440.png), and [mobile homepage](../artifacts/branding/home-390.png). Assets are ready for client visual review; the previous milestone screenshot archive remains historical.

## 20 September 2026 — Client branding and setup context

- Captured the latest email decisions in [client context](client-context.md), including the confirmed brand color `#06ad8f` and supplied [Iya Yusuf's Pantry logo](../public/assets/1789861951268blob.jpg).
- Inspected the logo: shopping-cart graphic, green lettering, and a visible gray grid background in the JPEG. Font choice is delegated to the developer.
- The email confirms receipt of the US$250 deposit on 19 September. Domain expiry is the client's suspicion; the full domain and registration status still need verification.
- Recorded the requested business Google account name, desired domain-based email, Stripe setup guidance, and outstanding product information. Logo and color supersede the pending-branding status recorded at the start of the foundation milestone below.
- Documentation update only; storefront branding and external account setup remain future work.

## pnpm startup fix

- Reported failure: `pnpm install` and `pnpm dev` stopped with `ERR_PNPM_IGNORED_BUILDS` for `unrs-resolver@1.12.2`.
- Cause: `pnpm-workspace.yaml` contained the undecided value `unrs-resolver: set this to true or false`. pnpm 11 checks dependencies before running scripts, so the unresolved install decision also blocked development startup.
- Inspected the dependency chain (`eslint-config-next` → TypeScript import resolver → `unrs-resolver`) and its native-binding preparation script. Set only `allowBuilds.unrs-resolver` to `true`; retained the lockfile versions and other package policies. Reference: [pnpm 11 build settings](https://github.com/pnpm/pnpm.io/blob/main/blog/releases/11.0.md).
- Validation: `pnpm install --frozen-lockfile` passed and ran the dependency's postinstall successfully; `pnpm lint` passed; `pnpm dev --hostname 127.0.0.1 --port 3101` reached Ready. Desktop/mobile homepage smoke checks both returned HTTP 200 with no browser page errors.
- Captured [desktop](../artifacts/support/pnpm-startup/desktop.png) and [mobile](../artifacts/support/pnpm-startup/mobile.png) startup screenshots separately from the foundation milestone archive.
- The earlier package-manager migration and ESLint deprecation warnings were not the startup blocker. No dependency upgrade was needed for this fix.

## 20 September 2026 — Foundation milestone 01

The client has paid the initial installment (reported by the project owner). Brand assets, domain choice, product content, business Google account, and Stripe access are pending. This milestone builds and tests locally without subscribing to services.

### Starting point

- Read the current proposal and the local Next.js 16.3.5 server/client, route-handler, data-security, and environment-variable guides.
- Existing prototype: 15 products, recipes and blog, browser cart, mock checkout, and scope pages. No production database, authentication, CMS, payment, or email connection.
- Baseline production build and 36 desktop/mobile screenshot and accessibility checks passed.
- Preserved baseline at `artifacts/milestones/01-foundations/before/` (including the offline gallery).
- Existing edits to `docs/simbiat-proposal-email.md` and untracked pnpm files are outside this milestone and are preserved.

### Implementation

- Explicit variant IDs and prices in integer USD cents replace runtime size multipliers. Values are still samples, not client-approved prices.
- Server cart review recalculates sample prices and checks sample stock. It accepts variant IDs and quantities only; customer fields, browser prices, malformed inputs, and excessive requests are rejected.
- Reusable pure order transitions cover reservations, payment matching/retries, cancellation, stock adjustment, and fulfillment. They are not a database or verified payment integration.
- Owner preview at `/prototype/owner` supports order filters, fulfillment of paid sample orders, cancelling unpaid reservations, stock editing, availability filters, and resetting the workspace. Data exists only in component memory.
- Checkout can check sample availability without submitting contact/address fields. Payment and final totals remain disabled/unavailable.
- Cart restoration validates entries, combines duplicate variants, and removes unexpected fields from restored selections.
- Screenshot review revealed the offscreen skip link appearing in a scrolled mobile capture. Added clipping while unfocused, retained keyboard visibility, and verified Enter moves focus to main content.
- Added a three-page progress PDF exporter and an archive command that preserves screenshots, the HTML test report, documentation, and file hashes. Two existing PDF exporter scripts received formatting-only fixes to satisfy the repository-wide formatting check.

### Validation and evidence

| Check                        | Result                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`               | Passed                                                                                                                      |
| `npm run type-check`         | Passed; final production build also completed TypeScript validation                                                         |
| `npm run format:check`       | Passed                                                                                                                      |
| `npm run build`              | Passed; 46 static generation entries plus dynamic shop/review routes                                                        |
| `npm test`                   | **70 passed** across desktop and mobile (final run: 48.6 seconds)                                                           |
| Browser accessibility/layout | All screen checks passed; no reported WCAG A/AA violations, horizontal overflow, or page/console errors in the screen suite |
| Progress PDF                 | Three pages; image decode and page/footer overflow checks passed; proof images visually reviewed                            |
| Intake CSV                   | Header and sample row both have 18 columns                                                                                  |

The final screenshot set contains **46 PNGs**: 23 desktop and 23 mobile captures. This includes the original screens, the new owner page, owner opening/edited states, and full/detail checkout review states. Manually reviewed owner desktop/mobile, the checkout summary, and all three report proofs. The repeatable capture command is `npm run screenshots`; `npm test` also produces the complete capture set.

Evidence:

- [Before gallery](../artifacts/milestones/01-foundations/before/index.html) — 36 baseline screenshots, captured before implementation.
- [Current gallery](../artifacts/screenshots/index.html) — 46 final screenshots.
- [Progress PDF](../artifacts/pdf/Simbiat-Foundation-Progress.pdf) — milestone summary and review images.
- [Final milestone gallery](../artifacts/milestones/01-foundations/after/screenshots/index.html), [test report](../artifacts/milestones/01-foundations/after/test-report/index.html), and [manifest](../artifacts/milestones/01-foundations/after/manifest.json) — preserved review evidence with SHA-256 hashes.

The automated rules tests cover invalid/duplicate quantities, browser-price rejection, unavailable variants, reservation rollback and sequential overselling, payment amount/currency matching and duplicate handling, cancellation release, late-payment rejection, stock adjustment limits, owner interactions, request privacy, API failure/retry, cart restoration, and keyboard skip navigation. Concurrent database behavior and real provider integrations remain untested because those adapters are not implemented yet.

### Next dependencies

Connect approved content, transactional storage, owner authentication, Stripe, and email in later integration work. Confirm shipping destination/rate rules, tax settings, initial stock, and service costs before enabling purchases. See [foundation architecture](production-foundations.md) and [content model](content-model.md).
