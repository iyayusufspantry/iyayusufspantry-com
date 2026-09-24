# Contentful content migration

Imported on 21 September 2026 into [the client Contentful space](https://app.contentful.com/spaces/lfm7lmn9p7cr), environment `master`, default locale `en-US`.

The **11 content types are active**, with **107 published entries and 16 published assets**. The storefront now reads published content exclusively through the Content Delivery API. There is no runtime fallback to local seed content. The original import is archived under `scripts/contentful/seed.json` and `scripts/contentful/fixtures/` for migration and tests only.

## Imported records

| Content type              | Entries | Content                                                                                                                         |
| ------------------------- | ------: | ------------------------------------------------------------------------------------------------------------------------------- |
| Product category          |       5 | Names, slugs, descriptions, illustration keys, display order                                                                    |
| Product                   |      15 | Copy, pack/usage information, options, sample prices, categories, variant/recipe references, identified product photo           |
| Product variant           |      25 | Immutable variant IDs, product references, size/dietary options, exact integer-cent sample prices, currency, active flag        |
| Recipe                    |       6 | Summaries, categories, time, servings, quantities, ordered steps, product references                                            |
| Journal article           |       5 | Titles, dates, reading times, summaries, rich-text bodies, original structured sections, related products and identified photos |
| Policy                    |       3 | Shipping, privacy and terms placeholders, rich text and original structured sections                                            |
| Frequently asked question |       4 | Contact-page questions and answers in display order                                                                             |
| Website page              |      21 | Route-specific copy, review text, homepage featured product/recipe/article references                                           |
| Site settings             |       1 | Business name, tagline, logo/icon, colors, explicitly marked placeholder contacts, media library, navigation                    |
| Navigation menu           |       3 | Main, explore and help menus                                                                                                    |
| Shared website copy       |      19 | Component, layout, error and not-found copy; prototype decisions and screen directory                                           |

The 16 assets are the 10 supplied images under `public/assets` and six PNG/SVG brand assets. Product images are associated only where the existing app identified the product. Other media remains available through Site settings. No new product or recipe imagery was invented.

Products, prices, dietary labels, recipes, policies and other imported copy retain `approvalStatus: sample`. Unsupplied ingredients, allergens, effective dates and business contacts were not filled with invented values. Transactional orders, stock, sessions, customer identities, private project documents and credentials are outside the import.

## Editing the website

Catalog/editorial content has dedicated fields and Contentful references. Edit the matching entry and **Publish** it. Saving a draft does not change the website. Products and their active variants determine selectable options and prices; unpublished products disappear, and unknown slugs return 404. Server cart review uses the same CMS prices. Categories and related products must also be published.

- **Page and shared copy:** edit `content.blocks[].text`. Keep the existing `key` and `source` values. Template placeholders such as `{0}` must remain in translated/edited text. These entries control layout copy, form labels, notices, accessibility labels, metadata and branded account headings. Their rich-text `body` is an import review copy; runtime rendering uses the JSON blocks.
- **Articles and policies:** edit `sections`, which is the canonical structured body used by the current layouts. The duplicate rich-text `body` is retained for import review.
- **Homepage:** use featured product, recipe and article references to choose and order the featured content.
- **Site settings:** edit the business name, colors, logo/icon, contact details and five named image references. Product photo arrays and recipe/article image fields control their own photography. Asset description supplies alt text unless an explicit image-alt field is present.
- **Navigation and FAQs:** edit their dedicated entries, rather than the archived shared-copy duplicates. FAQ order uses `sortOrder`.

`lib/content/server.ts` fetches paginated published entries/assets with server-only credentials. `lib/content/map.ts` resolves references, validates prices, currency, navigation and media hosts, and builds the frontend content snapshot. Missing configuration or essential published branding fails visibly rather than silently displaying seed content. Authentication stays in Clerk. Browser cart selections and the explicitly fictional owner stock/order workspace remain application state; this change does not enable real payments, orders or fulfillment.

## Cache refresh and webhook setup

All Contentful reads share the `contentful` cache tag and a 60-second revalidation interval. After that interval, a request can trigger a background refresh; this is a recovery path, not a guarantee of a live browser update every minute. The authenticated webhook immediately expires the tag and root layout so the next request renders fresh published content. An already-open browser tab needs a reload or a new server navigation.

`POST /api/contentful/revalidate` accepts Entry/Asset publish, unpublish and delete events. It checks the secret in `X-Contentful-Webhook-Secret`, the Contentful topic, the space and environment, and a bounded JSON body. It waits for the Delivery API to reflect the event before expiring the cache; temporary delivery failures return 503 for retry. Invalid requests cannot invalidate the cache.

`CONTENTFUL_REVALIDATION_SECRET` has been generated in the local `.env`. Set the **same value** in the hosting project's server environment alongside the Delivery API configuration. The deployed URL is `https://www.iyayusufspantry.com`, supplied on 24 September 2026. A check that day returned HTTP 200 for `/` and `/shop`, but an unauthenticated `POST /api/contentful/revalidate` returned HTTP 404 instead of the expected 401. The route must be available before registering the webhook; live cloud-to-site delivery remains unverified.

After deploying the route and environment variables:

```bash
npm run contentful:webhook -- --url https://www.iyayusufspantry.com
```

The command checks that the deployed endpoint requires authentication, then creates or updates this app's named webhook with a secret header and environment filter. It preserves unrelated webhooks. It never prints the secret. Contentful cannot reach a workstation's `localhost` address. Event selection and environment filtering follow [Contentful's webhook configuration](https://www.contentful.com/developers/docs/extensibility/webhooks/configure-webhook/).

## Repeatable commands

Credentials are loaded through Next's environment loader. Required for management: `CMA_TOKEN`, `CONTENTFUL_SPACE_ID`, and `CONTENTFUL_ENVIRONMENT` (defaults to `master`). `CONTENTFUL_DELIVERY_TOKEN` is for published reads. Never prefix these credentials with `NEXT_PUBLIC_` or commit environment files.

```bash
pnpm contentful:export
pnpm contentful:plan
pnpm contentful:import
pnpm contentful:verify
pnpm contentful:test
```

- Export validates the archived import graph and writes a review manifest without reading credentials or contacting Contentful. It does not extract the now-connected application source.
- Plan checks the target environment, locale and existing record counts without changing Contentful.
- Import creates missing models, assets and draft entries. Stable IDs prevent duplication; existing entries and assets are preserved. No records are deleted.
- Verify compares every imported field and reference with Contentful and checks each processed asset's byte size. Contentful's omission of empty optional arrays is normalized.
- The five offline tests check prices and product links, sample status, missing references, duplicate IDs/unknown fields, and import boundaries.

`pnpm contentful:import --refresh-source` updates an existing entry only when it still exactly matches the previous successful local import. Editor changes and extra locale values prevent automatic updates. Contentful version headers protect against concurrent changes. Keep `artifacts/contentful/last-import.json` if using this option; losing that baseline means existing entries will be preserved.

The importer also has an explicit `--publish` option, used to make the original imported records available to the storefront. It publishes new or unchanged imported records and preserves records whose content differs. `npm run contentful:connect` adds the named brand-image bindings and remaining UI copy without replacing existing text; it refuses to publish an editor's pending changes. Imported sample content still requires client approval before launch.

Imports use sequential writes, rate-limit/network retries and asset-processing checks. Before each applied run, the script saves a timestamped snapshot of existing records. These backups, source manifests, migration reports and verification results are under Git-ignored `artifacts/contentful/`.

## Validation

- Round-trip verification passed for all **107 entries**, **16 assets**, and **11 activated models**.
- A subsequent applied run created **zero** records, updated **zero** entries, and preserved all 107 existing entries.
- The production build renders published Contentful data. Five offline migration tests and runtime mapping/webhook tests cover content updates, missing entries, unsafe values, authentication, environment filtering, event types and retry behavior.
- Desktop/mobile regression: 102 of 104 checks passed in the complete run; the remaining two passed on focused rerun after the checkout privacy test accounted for Clerk initialization. An authenticated live-event request successfully invalidated the local production cache. No remote cloud-to-site webhook has been tested yet.
- Management access initially returned `OrganizationAccessGrantRequired`; the user authorized the token for the organization. Both Management and Delivery requests then succeeded.

References: [Contentful CMA](https://www.contentful.com/developers/docs/references/content-management-api/), [token organization authorization](https://www.contentful.com/help/faq/personal-access-tokens/).
