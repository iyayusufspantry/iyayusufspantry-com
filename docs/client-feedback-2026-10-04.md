# October 4 catalog updates and launch follow-up

Historical update: the [October 5 intake](client-email-context-2026-10-05.md) supersedes the Garri photo placeholder and pending ingredient-link deployment statements below. The [complete email audit](client-email-audit-2026-10-05.md) confirms the full US$500 fee was received September 21; the original installment schedule no longer implies a balance due.

The October 4 email supplies eight pantry products, three reference screenshots, seven product photographs and an additional yam-flour photograph in `public/assets/4 october/`. Originals are preserved. The previously optional Zobo photograph in `public/assets/2 oktober/1790911112946blob.jpg` supplies the drinks recipe card identified in the first screenshot and is also added to the Zobo product gallery.

| Product                 | Size / price | Page                      | Photograph                                       |
| ----------------------- | ------------ | ------------------------- | ------------------------------------------------ |
| Ground Cameroon Pepper  | 1 oz / $3    | `/shop/ground-pepper`     | `1791074985153blob.jpg`                          |
| Pepper Soup Mix         | 1 oz / $3    | `/shop/pepper-soup-spice` | `1791075359917blob.jpg`                          |
| Nigerian Beans          | 1 lb / $10   | `/shop/honey-beans`       | `1791075855688blob.jpg`                          |
| Nigerian Dates (Dabino) | 1 lb / $20   | `/shop/nigerian-dates`    | `1791076098665blob.jpg`, `1791076138285blob.jpg` |
| Tiger Nuts              | 1 lb / $10   | `/shop/tiger-nuts`        | `1791076354384blob.jpg`                          |
| Suya Mix (Yaji)         | 1 oz / $5    | `/shop/suya-spice`        | `1791076596011blob.jpg`                          |
| Yam Flour               | 1 lb / $10   | `/shop/yam-flour`         | `1791076772254blob.jpg`                          |
| Garri                   | 1 lb / $10   | `/shop/white-garri`       | Awaiting the promised photograph                 |

Existing product URLs and recipe references are retained. The new dates and tiger nuts listings are separate from Tiger Nut Drink. New confirmed variants replace old sample sizes; superseded variants become inactive. The supplied pepper-soup ingredients are retained with punctuation cleaned up. Suya includes the supplied peanut ingredients and a peanut notice. Sample dietary assertions and unconfirmed preparation instructions are cleared.

Plantain Chips and its sample recipe are unpublished, with their records retained for recovery. Its variants become inactive, and homepage featured links are removed. The local scope flow now points to Zobo instead of the removed product. Garri retains a photo-pending placeholder. Other recipe pages and wording remain available while Simbiat prepares future material.

## Product information links

Dates and tiger nuts have editable `learnMoreUrl` fields. In the absence of specific article URLs, these point to Google ingredient searches. Product pages display a descriptive “Learn more” link, opening in a new tab. The mapper permits HTTPS and omits malformed, insecure or credential-bearing URLs. This display code requires an application deployment; content publication alone does not add the visible links to the deployed application.

Portrait recipe photos use the supplied asset dimensions to preserve the top of the image in wide cards. This keeps the Zobo bottle caps visible. Other photo placements retain their existing rendering.

## Customer stories

The existing `/stories` page shows editorial community stories followed by approved visitor stories. Each visitor story has its title, the customer's chosen display name and full story text, preserving paragraph breaks. Cards form two columns on desktop and one on mobile. The customer's email remains private. New submissions remain pending until Simbiat publishes them through `/owner`; she can unpublish or decline them later. The public query selects only the four public fields from published records, ordered newest first, limited to 50 stories. No real submission or publication of a customer story is performed for this update.

## Launch timing

Recipes can be added after launch. The catalog revisions do not establish readiness for real sales. Current code in `lib/payments/config.ts` rejects live Stripe keys; the public store remains a preview/test-payment experience. A firm sales-launch date depends on production checkout and webhook acceptance, actual inventory, shipping/tax configuration, production authentication, approved policies/business details, real email delivery verification, final client review, and the remaining prelaunch copy/indexing changes. The full $500 build fee was already acknowledged September 21. Do not promise a launch next week solely from the catalog work.

## Repeatable workflow

`node scripts/contentful/october-4.mjs` prepares a read-only plan. `--apply` backs up the current content/schema and saves drafts. `--apply --publish-staged` checks every saved version before publishing and unpublishing the requested records. The schema addition preserves existing fields, and entry updates preserve other locales and unrelated content. Artifacts are under ignored `artifacts/client-feedback-2026-10-04/`.

`node scripts/contentful/october-4-verify.mjs <origin>` checks eight descriptions, sizes, prices, ingredients/allergens, supplied galleries, Garri's placeholder, information links, cart persistence and the $71 server subtotal, removed plantain routes/variants, Zobo recipe/gallery placements, stories and horizontal overflow at 1440px and 390px. Use `--content-only` when checking a deployed version that predates the information-link UI. It does not place orders, send emails or submit stories.

## Completed verification and publication

Published nine photographs and 30 content entries, and unpublished Plantain Chips and its sample recipe after inspecting the local draft pages. The subsequent read-only plan reports zero uploads, entry changes, schema changes or unpublishing actions.

Desktop and mobile browser checks passed against both the staged local site and the live published catalog. All supplied images decoded, dates displayed both gallery pictures, all eight products showed the requested size and price, Garri showed its placeholder, the cart persisted eight items at $71, server review returned 7,100 cents, removed plantain variants were rejected with HTTP 409, and the removed product/recipe routes returned HTTP 404. Zobo appeared on the homepage drinks recipe card, recipe detail and product gallery. No horizontal overflow or uncaught browser errors occurred.

Full lint, TypeScript checking and the production build passed. All 18 existing/extended content-mapping and webhook tests passed. Four focused desktop/mobile checks passed for the secure information links and gallery rotation with the additional Zobo photograph. Screenshots and read-only checkout captures are saved in `browser-local/` and `browser-live/` beneath the intake artifact directory.

The live checkout capture still explicitly describes sandbox payments, sample inventory and zero test shipping/tax. Google-link rendering, portrait recipe framing and the local scope-flow link are implemented and verified locally; these application changes have not been deployed. No orders, emails or customer stories were sent, and production sales were not enabled.
