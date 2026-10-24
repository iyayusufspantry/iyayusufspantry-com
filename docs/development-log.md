# Simbiat development log

## 24 October 2026 — Email allocation and homepage covers

- Saved the [supplied email and image mappings](client-feedback-2026-10-24.md) and [new unsent reply](simbiat-october-24-reply.md). Co-ownership/IRS readiness and 4 PM Central acceptance are now answered; the original email/appointment dates are unverified, so no new booking is inferred. Mailbox purchase is permitted with client funding after concrete terms are agreed; no price or purchase was invented.
- Created the [current stock intake](starting-stock-2026-10-24.json): egusi/ogbono/palm oil each have **20 per active size, 40 per product**. Other approved products retain 50 each. Validated all active variant IDs and totals: 21 products, 24 variants, 1,020 units. The older snapshot remains historical; no inventory was changed or reset.
- Inspected all five files in `public/assets/simibiat 24 oct/`. The first three are reference screenshots. The supplied food collage covers the community homepage highlight; the Pantry People cap covers Merch. No priced cap SKU, article-photo replacement or rebrand was created.
- Added two optional editable asset fields to Contentful site settings and wired the existing homepage slides to them. The guarded preview/apply script preserves other fields/locales, rejects pending editor changes, backs up affected records and uses version checks. The first upload timed out before creating an asset; the retry published both assets/schema/settings bindings. Repeat preview reports no fields, uploads or reference changes remaining.
- Production build/TypeScript, targeted ESLint, formatting and whitespace checks passed. All 36 selected desktop/mobile CMS/client-feedback/meeting-revision checks passed; 1440/390-pixel banner screenshots were visually inspected. Evidence is in ignored `artifacts/client-feedback-2026-10-24/`.
- CMS cover publication is complete, while application deployment remains outstanding for homepage wiring and the earlier story cards/ingredient links. No application deployment, stock mutation, Stripe action, mailbox/DNS change, email send, purchase or appointment booking was performed.

## 24 October 2026 — Meeting revisions

- Saved the [timestamped meeting decisions and action register](client-meeting-2026-10-24.md). The meeting date is not established; October 24 is the transcript intake date. Recorded reported 50/50 ownership, unfinished Stripe/mailbox work, the separate merchandise email and brother's submission follow-ups, and interest in a future social-media proposal. Private verification codes are omitted.
- Added inline Google searches and small search icons for selected product ingredients while preserving CMS ingredient/allergen text and existing product-level links. Common staples remain plain text.
- Replaced full community-story bodies with short cards, a keyboard-accessible reader dialog, title/author search and six-card pagination. Both approved CMS community articles and published submissions use the same view. Existing moderation and private-email boundaries remain.
- Followed the **later** recipe decision: build a preparation-video/photo library first and defer a paid recipe product. No paid recipe SKU, download access or print price was invented; approved branding is preserved.
- Production build/TypeScript, targeted ESLint, formatting and whitespace checks passed. All 14 selected desktop/mobile browser tests passed, including the existing client-review flows. An eight-story fixture passed desktop/mobile pagination, author search, reset, long-text scrolling, escaped text and restored focus. Screenshots were visually inspected; the final story checks and fixture were repeated after correcting inherited article margins in the dialog. Evidence is in ignored `artifacts/meeting-2026-10-24/`.
- Changes remain local. No deployment, CMS publication, database mutation, email send, Stripe/account submission, mailbox/DNS change, subscription purchase or social-media action was performed. Separate email/submission follow-ups remain unverified.

## 23 October 2026 — Collage and contact publication

- Revised the unsent reply after the owner supplied Stripe's unfinished Tax details screenshot and clarified custom-email funding. It asks whether the LLC has one or multiple owners, arranges private IRS tax-name/ID entry directly in Stripe during review, and explains that an agreed paid mailbox plan must be purchased by the client or funded before the developer orders it. No tax details were collected, account form edited, subscription purchased or email sent.

- Contentful access was restored after the owner's retry instruction. Published the supplied collage on the sourcing article, the confirmed support phone and three contact text entries. Backups and version/draft guards preserved unrelated fields/locales; a repeat preview reports no upload or entry changes. Removed early `process.exit` calls from the publication script after a completed preview exposed a Windows Node shutdown assertion.
- Production build/TypeScript, targeted ESLint, formatting and whitespace checks passed. All 12 final local and public browser checks at 1440/390 pixels passed: correct image/phone on Contact, sourcing article, Blog and Home; full 2:1 collage; correct call link; no phone placeholder, horizontal overflow or uncaught page errors; existing portrait and landscape journal hero sizing preserved. Final mobile screenshots were visually inspected.
- The owner restored the existing project-owner Vercel login. Final production deployment **`dpl_BZVccHdrXRnLbWM8SuYEQGNUvXZx`** built successfully, passed staged checks, and was promoted to `www.iyayusufspantry.com`. The source package excludes environment credentials and Git metadata; critical application/dependency/payment configuration files matched local source. No new project was created.
- The original image-sizing rule was narrowed to wide article images (ratio at least 2:1), allowing the full supplied collage while retaining existing journal photograph layouts. The final deployment supersedes `dpl_9VW2Wt1Ct8WPy3N4yXoNeLTSjBx1`.
- Updated the unsent reply and current context to reflect publication. No email was sent, Stripe accessed, mailbox/DNS changed, stock mutated, service purchased or appointment booked. Evidence is in ignored `artifacts/client-feedback-2026-10-22/`.

## 22 October 2026 — Business details and starting stock intake

- Saved the [client update](client-feedback-2026-10-22.md) and [new unsent reply](simbiat-october-22-reply.md): confirmed LLC, business address/phone, responsible person, positive feedback, requested support inbox, first collage and longer recipe timeline. Updated the README and client-context entry points; earlier work and historical records are preserved.
- Read the current published catalog and prepared [50 per approved product](starting-stock-2026-10-22.json), excluding the sample listing. Egusi, ogbono and palm oil need allocation across their two sizes; no variant received an invented count and no inventory was reset.
- The owner supplied and we inspected `public/1792604044512blob.jpg` (1774 × 887). Prepared a guarded preview/apply script for the sourcing-article image, phone and contact wording, with backups, version checks and preservation of unrelated fields/locales/drafts. Article hero images now preserve their source aspect ratio; confirmed phone numbers render as call links without placeholder captions.
- Contentful management still returned HTTP 401 after the owner reported updating `CMA_TOKEN`; verified the environment loader reads `.env` with no inherited or `.env.local` override. Delivery API reads succeeded. Existing domain MX routing was inspected without changes; it does not establish an active support inbox.
- Revised the reply to acknowledge the received image and explain that email hosting and any additional setup/subscription costs are separate from website development. The existing Hostinger email plan needs checking; no custom mail server or VPS is required for a hosted mailbox. Scope is site changes and reply draft only, with Stripe deferred.
- Validation: stock intake matches all 21 approved catalog entries and their published variant references, excludes the sample product and flags three size allocations. Production build, TypeScript, targeted ESLint, changed-file Prettier and whitespace checks passed. Static previews rendered from the actual components with proposed CMS values passed at 1440 and 390 pixels: full 2:1 collage, no horizontal overflow, correct `tel:+17134984010` link and no phone placeholder caption. Mobile images were visually inspected. Preview evidence is in ignored `artifacts/client-feedback-2026-10-22/`; it is not a published-site check.
- Application/content changes remain local pending working management access and publication/deployment. No CMS publication, deployment, stock mutation, email send, mailbox/DNS change, Stripe submission, purchase or appointment booking was performed.

## 16 October 2026 — Client follow-up and corrected jar size

- The owner confirmed the pictured KTC monitor is Simbiat's and approved **2560 × 1440** as the working resolution assumption. Updated the current notes/reply to use it without requesting resolution confirmation again. Existing browser checks cover that size; scaling, Chrome zoom and window state remain unknown.

- Saved the [supplied email/image context and action register](client-feedback-2026-10-16.md). Recorded the KTC monitor/Chrome, weekend material plans and October 23/24/25 availability, with “CST” still needing clarification. Explained the intentional `/#top` wordmark link and separated Stripe owner verification from unfinished developer live-sales work in the [unsent reply](simbiat-october-16-reply.md).
- Published only Chin Chin's displayed jar label as **16 oz jar**, preserving the $10 price, variants and other CMS fields/locales. The new preview/apply script backs up the entry and rejects editor drafts; repeat preview reports no changes. Updated the existing browser assertion. No application deployment, email send, calendar booking, stock change or live payment occurred.
- Both existing public product checks passed after cache propagation. Additional desktop/mobile checks confirmed normal and repeated `/#top` navigation, expected container dimensions, no overflow and no uncaught browser errors. Changed-file lint/format/whitespace checks passed; evidence is under ignored `artifacts/client-feedback-2026-10-16/`.

## 14 October 2026 — Remaining client website requests

- Implemented rotating CMS-backed homepage highlights, manual/pause/reduced-motion behavior, product hover zoom and 100–300% photo viewer, and persistent Standard/Larger/Largest reading settings. Phones expose reading settings in the menu.
- Published the Merch category with an empty/coming-soon shop state, and changed only the supplied Chin Chin unit to provisional **7 oz jar**, preserving its $10 price and variants. The preview/apply script backs up touched entries and preserves editor drafts. Added bounded Contentful connection/rate/server retries.
- Deployed using the connected project-owner account after a Git author-permission block; standalone validated source contains no Git metadata or local credentials. Deployment `dpl_5dCj95o9d6tE1UymGziSBTJQRZYz` built successfully, was checked, and was promoted to the existing domain. No Git author identity or payment mode was changed.
- Build/TypeScript, full lint/formatting/whitespace, all 40 local account/gallery/CMS/feedback browser checks, 28 routes at ten viewport widths, relevant accessibility checks and all nine payment/database tests passed. Updated and rendered the [23-page website review PDF](../output/pdf/Simbiat-Website-Review-October-14.pdf). See [implementation/evidence](client-feedback-2026-10-14.md) for post-deployment results.
- Updated the source feedback status, client-context entry point and unsent reply. The owner confirms no actual stock or verified live-Stripe information is available yet; live-sales acceptance, client materials, desktop details and review availability remain pending. No email was sent or appointment booked.

## 13 October 2026 — Desktop spacing, readable storefront text and client context

- Follow-up recheck: fresh build/TypeScript, full lint and repository formatting passed; 28 routes at ten viewport widths passed layout/response checks with no overflow or browser errors. Six homepage/Shop accessibility scans and all 30 account/gallery/CMS checks passed. Created and rendered the [19-page desktop comparison PDF](../output/pdf/Simbiat-Desktop-Size-Review.pdf), covering six widths with overview, hero, categories and product-card views. Evidence is under ignored `artifacts/desktop-review-2026-10-13/`; website changes remain local.

- Expanded the shared responsive container from 1200 to 1600 pixels, removed the obsolete large-screen cap, and retained phone gutters. Increased small storefront captions, metadata, links and footer text to 14 pixels and common body/card text to 16 pixels. Category cards grow with their content, and product metadata/headings/prices can wrap. Paragraph lengths remain constrained.
- Saved [the supplied client feedback and action register](client-feedback-2026-10-13.md), updated the client-context/README entry points, and prepared an [unsent reply](simbiat-october-13-reply.md) asking for the desktop/monitor, screen size/resolution, browser/zoom and window state, plus review-session availability. Recorded the banner, photo enlargement, merch category, provisional 7-ounce Chin Chin weight and recipe/collage estimate as outstanding work.
- Validation: production build/TypeScript, targeted lint, formatting and whitespace checks passed. Eight viewport sizes (320–2560 pixels) across ten routes passed response/container/readability/overflow checks without uncaught browser errors. Three homepage accessibility scans and four existing Shop/gallery checks passed. Desktop/mobile screenshots were visually reviewed; evidence is under ignored `artifacts/client-feedback-2026-10-13/`.
- Changes remain local. No deployment, email send, Contentful write, live payment or appointment booking was performed.

## 26 September 2026 — Contentful editor navigation

- Replaced the empty Content Type sidebar folder with a shared **Edit website** folder containing 11 views for products, categories, variants, pages, recipes, articles, policies, FAQs, menus, settings and shared text. Added four helper views under **Linked items (advanced)**; retained existing All/Status views and unrelated workspace settings.
- Updated 725 published editor labels, including page names and linked text labels. All 871 entries remain present. Compared every entry with the backup: only editor titles changed; customer-facing wording, routes, keys, prices and references are unchanged.
- Added the repeatable `contentful:workspace` command with preview mode, backups, draft preservation and version checks. A subsequent preview reports no remaining changes. Updated the client editing guide with sidebar navigation and examples.
- Public browser smoke checks passed for About, Contact and the mobile Shop page (HTTP 200, no browser errors). Workspace configuration was verified through the management API; its appearance in the client's authenticated Contentful session still needs a refresh and visual review.

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
