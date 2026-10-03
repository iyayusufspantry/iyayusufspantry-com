# Simbiat email requests — rechecked October 3, 2026

The supplied website changes are present on the live website. This recheck covers the September 28–October 2 emails pasted into the conversation, including the second egusi-soup-photo email. Earlier intake notes saying the logo fix and community features still require deployment are historical; fresh browser checks now find those features live.

The [22-page visual review PDF](../artifacts/pdf/Iya-Yusufs-Pantry-Request-Review-October-3.pdf) includes the checklist, live desktop/mobile screenshots, complete story wording, all 12 products and selected prices, logo scroll measurements, the egusi recipe image, remaining follow-ups, and the full check matrix. Fresh supplementary screenshots verify all product prices again. All report pages passed layout checks; the actual PDF was verified for page count, numbering, selectable text, and embedded images. Regenerate with `node scripts/export-client-request-proof.mjs`; use `--reuse-screenshots` to rebuild from the preserved evidence.

## Website requests

| Request                                                                        | Current result                                                                                                                                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Replace the homepage banner with the latest snack assortment photo             | Live; supplied photo loads on desktop and mobile.                                                                                                                                          |
| Replace the three pantry images with the supplied photos with warm backgrounds | Live; Donkwa, coconut candy, and tiger nut drink photos load.                                                                                                                              |
| Update the center journal card photo                                           | Live; **A pantry that feels like home** uses the latest assortment photo.                                                                                                                  |
| Make Chin Chin and African Red Palm Oil photos visible                         | Live; both homepage cards and all product gallery photos load.                                                                                                                             |
| Add the snack-container size-reference picture                                 | Live in all five snack galleries: Chin Chin, Kuli Kuli, Donkwa, Coconut Candy Crunch, and roasted groundnut.                                                                               |
| Publish the original About Us story                                            | Live at `/about`; all four supplied paragraphs are present.                                                                                                                                |
| Publish **Rediscovering the Taste of Home**                                    | Live at `/blog/rediscovering-the-taste-of-home` and `/stories`; all nine paragraphs are present, with Simbiat credited on the community page.                                              |
| Make the Iya Yusuf’s Pantry logo return to the top of the landing page         | Works for header/footer, repeated clicks, navigation from the shop, and mobile-menu closure.                                                                                               |
| Provide a shopper story form and review before publication                     | Form is live and enabled, with required consent and an invitation below the requested article. Review implementation and persistence tests pass; owner API rejects unauthenticated access. |
| Use the supplied egusi soup bowl as a placeholder recipe image                 | Live on the homepage recipe card, recipe listing, and egusi recipe detail page.                                                                                                            |

## Supplied products

All 12 supplied products have their requested descriptions, photos, sizes, and prices on the live website. Every supplied gallery image and the shared snack reference decoded successfully at both browser widths.

| Product                          | Supplied size and price verified     | Page                                     |
| -------------------------------- | ------------------------------------ | ---------------------------------------- |
| Zobo Drink                       | 16 oz bottle, $7                     | `/shop/zobo-drink`                       |
| Tiger Nut Drink                  | 16 oz bottle, $7                     | `/shop/tiger-nut-drink`                  |
| Lightly Salted Roasted Groundnut | 16 oz jar, $10                       | `/shop/lightly-salted-roasted-groundnut` |
| Kuli Kuli                        | 16 oz jar, $10                       | `/shop/kulikuli`                         |
| Donkwa / Adakwa / Tanfiri        | 16 oz jar, $10                       | `/shop/donkwa`                           |
| Coconut Candy Crunch             | 16 oz jar, $10                       | `/shop/coconut-candy-crunch`             |
| African Red Palm Oil             | 32 oz, $10; half gallon / 64 oz, $20 | `/shop/palm-oil`                         |
| Chin Chin                        | $10; no net weight supplied          | `/shop/classic-chin-chin`                |
| Whole Egusi (Melon seeds)        | 1 oz, $3; 1 lb, $20                  | `/shop/ground-egusi`                     |
| Whole Ogbono Seeds               | 1 oz, $3; 1 lb, $20                  | `/shop/ogbono`                           |
| Smoked Catfish                   | 1 lb, $25                            | `/shop/smoked-catfish`                   |
| Smoked Large Red Crayfish        | 1 oz, $5                             | `/shop/dried-crayfish`                   |

The existing egusi and crayfish URLs are retained even though their displayed names were updated. Chin Chin’s email supplies a $10 price without a net weight; the website uses “jar.”

## Remaining follow-ups

- **Three future spice products:** awaiting names, descriptions, prices, and photos from Simbiat. Her email says she will send them later.
- **Drink recipes and step photos:** awaiting Simbiat’s material. Paid recipe sales and digital delivery are not implemented. Her current request is for recommendations, rather than an instruction to activate sales.
- **Reply with the paid-recipe recommendation:** a proposal is already prepared in [the October 2 intake notes](client-feedback-2026-10-02.md#recommendation-for-paid-drink-recipes). It proposes starting with illustrated downloadable recipe PDFs and a separate digital checkout. This repository does not establish that the recommendation was sent to Simbiat; no message was sent during this audit.
- **Optional pictures:** the extra bottled-drink photo and alternate soup photo are preserved in `public/assets/2 oktober/` and `public/assets/2 oct - second/`. Their use was optional, so retaining them is not an unfinished placement request.

## Evidence and limits

Run [the repeatable browser audit](../scripts/audit-client-requests.mjs) with the local production server on port 3106:

```powershell
npm run start -- --hostname localhost --port 3106
# In a separate terminal:
node scripts/audit-client-requests.mjs
npm run operations:test
```

The final browser report and screenshots are saved in [the audit artifact directory](../artifacts/client-request-recheck-2026-10-03/audit.json). All **54 live checks passed**. Across live and local environments, **106 checks passed, zero failed, and two local checks were skipped**. Checks cover the live website and the existing local production build at 1440px and 390px. The local configuration has story submissions disabled; that local-only activation check is recorded as skipped. Live submissions are enabled and are checked separately.

The live form’s consent requirement, failed-request recovery, retained retry ID, and review confirmation are tested with browser-intercepted requests. No test story reaches the live server. All 11 operations integration tests passed, including pending submission, consent, deduplication, private-email filtering, publication/unpublication, and stale-review rejection. Those tests use a temporary database schema and remove it afterward.

An authenticated Simbiat owner session and a real live submission were not exercised. The checks verify live availability, client behavior, authorization protection, and the database workflow separately. They do not certify live checkout, physical stock, or paid-recipe delivery. This audit did not deploy, publish content, place orders, or send emails.
