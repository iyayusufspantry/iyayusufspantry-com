# Sales-tax permit intake - November 14, 2026

Source: Simbiat's email pasted in the development chat and the local two-page `Sales Tax Permit.pdf`. November 14 is the intake date; the email's sent date is unverified. Both scanned pages were rendered and visually reviewed. The original document remains at the repository root, untracked; review images are under ignored `artifacts/permit-review-2026-11-14/`. Do not publish the document or copy its taxpayer number into public site content or routine correspondence.

## Confirmed document details

- The document is headed **Texas Sales and Use Tax Permit** and names **Iya Yusuf's Pantry and Goods LLC**, trading as **Iya Yusuf's Pantry**. Its Manvel business location matches the previously supplied business address.
- **First business date of location: November 23, 2026.**
- Both listed local sales-tax authorities, **City of Manvel** and **Brazoria County**, show **EFF: November 23, 2026**.
- These dates are in the future relative to this intake. Do not describe the first-business-date field as a separately verified permit activation date, or infer that sales can start earlier or that November 23 is an agreed website launch date.
- The reverse states that receipt of the permit does not establish good standing. The initial document review did not include an active/inactive status lookup; the subsequent checks below now supply that evidence.

Receipt of the permit copy supersedes the November 10 report that the application was awaiting approval. It does not by itself confirm current active status, product tax treatment, Stripe Tax configuration, or launch readiness. The latest other-state registration statement remains Simbiat's November 3 report of none; this document establishes no additional jurisdictions.

## Remaining work

1. Confirm whether November 23 is the intended business/sales start date. If the date is unexpected, resolve it with the Comptroller before using it to schedule collection or launch.
2. Verify current permit/location status through the [Texas Comptroller's taxpayer search](https://comptroller.texas.gov/taxes/sales/taxpayer-search.php), which reports active/inactive status. Preserve the distinction between that lookup and the dates printed on this copy.
3. Finish the outstanding product-by-product tax review and configure the confirmed collection details in Stripe. The [Comptroller's grocery guidance](https://comptroller.texas.gov/taxes/publications/96-280.php) distinguishes food and drink treatment by product and sale circumstances; the permit itself supplies no product classification instructions. Avoid a blanket rate or blanket food exemption.
4. Complete the existing checkout, shipping/policy and final acceptance checks before enabling customer purchases. Use the November 11 merch publication and stock record; the shirt-size allocation question is resolved.

The [new unsent reply](simbiat-november-14-reply.md) acknowledges receipt and asks about the printed business date. It supersedes the November 10 draft for current follow-up. No email was sent, and no Stripe setting, stock, CMS content, checkout flag or deployment was changed by this intake. Public checkout remains in its previously recorded test mode; no fresh live-site or Stripe audit was performed.

## Subsequent checks requested by the user

After the user asked what remains and whether it can be done now, completed read-only checks on November 14:

- The official [Comptroller taxpayer search](https://comptroller.texas.gov/taxes/sales/taxpayer-search.php), using the same taxpayer/location endpoints as its search form, returned HTTP 200 and `success: true` for both records. The matching LLC is **INACTIVE**; location **00001** is also **INACTIVE**, with `PERMIT_START_DT: 11/23/2026` and no end date. This supersedes the earlier unverified-status statements. It does not establish the reason for inactivity or guarantee automatic activation on November 23.
- The expected live Stripe account still has charges and payouts enabled, with active card payments. Its dedicated live webhook is enabled for all four required checkout events.
- Stripe Tax settings are active with a Texas/US head office, but there are **zero tax registrations**. The default product tax code is still `txcd_99999999`. Website checkout supplies product names with no per-product tax code, so the preset is used. [Stripe documents this fallback](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior).
- Read-only live inventory verification found **33 variants, 1,128 units on hand, zero reserved**. This includes November 11 merchandise; no stock was changed.
- The deployed checkout returned HTTP 200 and retains sandbox wording. The first network probe failed; a subsequent complete read-only audit succeeded.
- Retrieved the current Stripe Tax Codes catalog and prepared a [product-category review and activation plan](sales-tax-setup-review-2026-11-14.md). Candidate identifiers/names were verified against the API; they are not approved or applied classifications.

Evidence is saved under ignored `artifacts/permit-review-2026-11-14/`: `current-audit.json`, `comptroller-taxpayer.json` and `comptroller-locations.json`. The first tax-code catalog fetch used an incorrect SDK pagination call; corrected the local ignored audit script and reran successfully. No application source, production configuration, Stripe registration, checkout session, payment or email was changed or created.

## Texas registration scheduled at the user's request

After the distinction between Stripe payment activation and tax collection was explained, the user instructed **"do it"** in response to preparing Stripe Tax with the permit's future date. This authorizes the November 23 schedule; it does not establish Simbiat's final website launch acceptance.

Created live Stripe Tax registration **`taxreg_1UbeF2HKfhrlO2yzVLRv7wNr`** for **US / TX / state_sales_tax** with:

- Status: **scheduled**; `livemode: true`.
- Start: **November 23, 2026 at 12:00 AM CST**, in the business's `America/Chicago` time zone.
- API timestamp: **1795413600**, equivalent to **2026-11-23T06:00:00Z**. The operator's Asia/Makassar time zone was not used for the Texas business date.
- No expiration. No other-state registration was created or changed.

`scripts/payments/texas-tax-registration.mts` previews by default. Its `--apply` path verifies the exact live account, enabled payments/payouts/card capability, active Stripe Tax and Texas head-office settings; checks all existing registrations; saves a before snapshot and plan; then uses an idempotency key to create only the missing Texas registration. It refuses conflicting existing dates or multiple current Texas registrations. It independently retrieves the created record and verifies every field, then lists all registrations to confirm exactly one new record and preservation of previous records.

The preview showed one required change; apply succeeded. A subsequent preview reports **`changeNeeded: false`**. Targeted ESLint, TypeScript, formatting and whitespace checks passed. The public checkout was independently checked after the change: **HTTP 200, sandbox wording preserved**. Evidence is under ignored `artifacts/texas-tax-registration-2026-11-14/`, including the before snapshot, plan, created record, independent verification and public-checkout result.

No permit upload, state registration application, filing service, product classification, stock update, checkout session, payment, environment-variable change or deployment occurred. This adds the confirmed jurisdiction and future date to Stripe Tax; it does not activate the Texas permit or open the website for real sales. The business remains INACTIVE in the most recent official lookup. Product-category review, tax-code integration, active-permit recheck and final checkout/launch acceptance remain outstanding. The unsent client reply now acknowledges the completed scheduling; no email was sent.

## Subsequent tax integration

The user then requested completion. [Product-specific tax integration](tax-integration-2026-11-14.md) is now deployed in commit `a7d0221`, Vercel deployment `J8Gx75DMkeJQ4qwUGE3EHddcCVEk`. The mapping covers 19 products / 28 of the 33 variants with prepared live stock; five food products require serving/category or milk-substitute confirmation and explicitly reject live checkout until resolved. Unknown/new products also reject live checkout without stock/order writes. Exact code/category pairs were checked against Stripe's API.

Six real Stripe estimates passed for pre-start, future exempt/taxable/mixed carts, shipping at/below $60 and an unregistered state. Sixteen isolated payment/database tests, ten desktop/mobile checkout UI tests, four email-rendering tests, build/TypeScript, focused lint and formatting passed. One unpaid live session verified the actual Stripe product tax code, signed expiration processing, cancelled public/database status and exact original stock restoration; no payment was made. The live probe encountered a network timeout; the same saved session was independently recovered/verified and the probe tool now retries transient errors.

Raw CMS includes the legacy Dried Ugu sample variant, which has no approved live stock. Earlier wording that it had no published variant is corrected; no stock or CMS catalog content was changed. The original PDF, taxpayer number, unrelated correspondence/social work and private environment files were excluded from the source commit. Project authentication was scoped to the push process; the global active GitHub account was preserved.

Checkout remains in test mode. Final food decisions, active-permit recheck and paid-order/fulfillment/policy acceptance remain outstanding; no automatic launch was scheduled and no email was sent.
