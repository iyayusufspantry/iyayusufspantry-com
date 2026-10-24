# Client email and cover images — received October 24, 2026

Source: Simbiat's email pasted in the development chat and five files in `public/assets/simibiat 24 oct/`. October 24 is the intake date; the original sent date is unverified. The email accepts the 4 PM slot from the earlier correspondence and may precede the recorded meeting. Do not infer a new appointment date or let this undated email override the later recipe discussion in the [meeting transcript](client-meeting-2026-10-24.md).

## Confirmed decisions

- The LLC is co-owned by Simbiat and her mother. She has the tax identification number and IRS documentation. The email supplies no private tax number; the meeting separately reports 50/50 ownership. Do not ask her whether she is the sole owner again.
- Egusi, ogbono and palm oil: **20 units of each active size**, therefore **40 per product**, superseding the earlier 50-total instruction for those three. Egusi and ogbono each have 1 oz and 1 lb variants; palm oil has 32 oz and 1/2 gallon (64 oz). Other approved products retain 50 each.
- The [current stock intake](starting-stock-2026-10-24.json) maps the six revised allocations to published active variant IDs. It contains 21 approved products, 24 active variants and 1,020 units in total. The sample Dried Ugu listing and inactive legacy variants remain excluded. This is preparation only; no database inventory was changed or reset. The [October 22 intake](starting-stock-2026-10-22.json) remains the historical source.
- Simbiat accepts developer purchase of the email plan with her sending the money. Exact cost, billing period and renewal total still need to be confirmed, and the subscription funded before the developer orders it. This permission is not evidence of a purchase, payment, active plan or functioning inbox.
- **4 PM Central Time is accepted.** It is no longer an unanswered 4-versus-5 PM choice. The message contains no date and no event has been created here. Earlier correspondence proposed October 23; do not book a new October 24 appointment or treat the old proposal as future without a date check.

## Image inspection and bindings

| File                    | What it shows                                                  | Use                                                                                                                                             |
| ----------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `1792738027111blob.jpg` | Existing `/stories` full-text listing                          | Reference screenshot for the compact-card revision already implemented locally.                                                                 |
| `1792738148984blob.jpg` | Homepage community-stories banner with a sprout placeholder    | Identifies the first requested cover position.                                                                                                  |
| `1792738233263blob.jpg` | Homepage Merch banner with a sprout placeholder                | Identifies the second requested cover position.                                                                                                 |
| `1792738286909blob.jpg` | Olive-green cap embroidered “PANTRY PEOPLE” with a cart emblem | Merch banner cover. A cover request does not supply a product price, stock, variants or permission to sell the pictured cap as a new SKU.       |
| `1792739465552blob.jpg` | Four-image food/drink collage                                  | Community-stories banner cover, using the additional supplied file in the folder. No new recipe/product identities are inferred from the photo. |

These are two homepage highlight covers. The community cover does not replace the existing author portrait/article photo. Existing approved branding, article imagery, slide text and destinations remain intact.

## Implementation

Added optional **Community stories highlight cover** and **Merch highlight cover** asset fields to the Contentful site settings model and connected them to the existing homepage slides. This keeps the images editable in Contentful and preserves the existing fallback when a cover is absent/unpublished. No required schema field or merchandise product was introduced.

`node scripts/contentful/october-24.mjs` previews the exact schema additions/assets/settings references; `--apply` uploads and publishes them. It checks for pending editor drafts and unexpected existing selections, preserves other fields/locales, saves backups and uses version checks. The source images are unmodified. Asset IDs: community `pantry-asset-6f8eccc28752189555e32bec`; Merch `pantry-asset-9b769a9478a90700e6611a03`.

CMS publication is complete. The initial upload attempt timed out before creating an asset; the retry succeeded. Both optional fields/assets/settings bindings were published after backing up the affected schema/settings. A repeat preview reports `addFields: []`, `upload: false` and `changed: false` for both covers. No existing image selection or editor draft was replaced.

Production build/TypeScript, targeted ESLint, changed-file Prettier and whitespace checks passed. All **36 selected desktop/mobile checks** passed, covering the two supplied banner images and retained destinations, CMS mapping/unpublished-cover fallback, existing photo/reading controls, ingredient searches and story previews/readers. Banner screenshots at 1440 and 390 pixels were visually inspected. The new stock snapshot was validated against the published active variant IDs and its per-product/overall totals. Evidence and CMS backups are in ignored `artifacts/client-feedback-2026-10-24/`.

Application/homepage/story-card changes remain local until deployment; publishing the CMS assets alone does not make the old deployed homepage consume the new fields. No application deployment, inventory mutation, Stripe change, mailbox purchase, DNS change, email send or calendar booking was performed.

## Mailbox guidance and correspondence

Hostinger's [current email-plan guide](https://www.hostinger.com/support/5832752-how-to-check-the-email-service-included-in-your-hosting-plan-at-hostinger/) says to open **Emails** in the account dashboard and inspect the plan name for the domain. A free service or active paid plan should be identified there; domain ownership alone does not prove email is included. Check the existing account before buying another service. The guide was reviewed October 24; no account access, current price or plan entitlement was verified here.

The [new unsent reply](simbiat-october-24-reply.md) acknowledges the co-ownership, correct 40-total allocations, accepted time and image requests, and explains the email-plan check/funding sequence. It supersedes the October 22 draft. The meeting's later decision to build a content library and defer paid recipes still stands.
