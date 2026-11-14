# Product tax integration - November 14, 2026

Status: **implemented, deployed and verified; five food reviews and final launch acceptance remain outstanding**. Commit `a7d0221` was pushed through the project GitHub account, and Vercel reports successful deployment [J8Gx75DMkeJQ4qwUGE3EHddcCVEk](https://vercel.com/iyayusufspantry/iyayusufspantry-com/J8Gx75DMkeJQ4qwUGE3EHddcCVEk). Public checkout remains in test mode. The user's request to complete the setup authorizes the technical implementation; it does not supply missing product facts, active permit status, a real payer or final fulfillment/policy acceptance.

## Checkout behavior

Live checkout now sends a verified Stripe tax code per product in inline `price_data.product_data.tax_code`, rather than using the single account preset. The server owns this mapping in `lib/payments/product-tax.ts`; cart input cannot set a code, tax rate, amount or exemption. Existing exclusive USD prices, Stripe automatic tax, shipping at $6.99/free at $60 and full-total webhook checks are preserved. Sandbox checkout remains unchanged.

Mapped 19 products covering **28 of the 33 variants with prepared live stock**, using the existing supplied catalog descriptions: general-use shirts/hats, cooking oil, seasonings, packaged cooking staples/seafood, vegetables/tubers, naturally sweet dates, coconut candy and sweetened bottled hibiscus infusion. Exact code/category pairs were independently checked against the Stripe Tax Codes API. The [Stripe product-code documentation](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior) defines the inline field and default behavior. The [Texas grocery guidance](https://comptroller.texas.gov/taxes/publications/96-280.php) explains the distinctions relevant to the pending items.

Five products remain explicitly pending: **Chin Chin, Donkwa, Kuli Kuli, Lightly Salted Roasted Groundnut, and Tiger Nut Drink**. Their preparation/category, serving declaration/presentation or milk-substitute status needs confirmation. The user was asked whether the snack jars are single-serving or supplied with utensils and whether Tiger Nut Drink is sold as a milk substitute. No answer has been inferred from elapsed time. These products and any new/unmapped product reject live checkout with a useful shop-contact message; the complete mixed-cart reservation rolls back, leaving stock and order state untouched. No classification is guessed for those items.

The raw published CMS has 34 active variants, including the legacy **sample Dried Ugu** variant. The approved live-stock intake has 33; Dried Ugu has no prepared live stock and remains excluded. This corrects the earlier intake wording that said Dried Ugu had no published sale variant. No stock or CMS entry was created, reset or unpublished.

## Stripe verification

The live Texas state-sales-tax registration remains `scheduled` for **November 23, 2026 at 12:00 AM CST (America/Chicago)**, UTC `2026-11-23T06:00:00Z`. The repeated registration preview reports no change required. This schedule does not change the Texas permit's official status or automatically launch the website.

`scripts/payments/tax-check.mts` previews by default. It verifies the expected live account, tax settings, scheduled Texas registration, exact code/category names and coverage of published products against existing live stock. Its `--apply` path creates **uncharged Stripe Tax Calculation estimates only**. It never creates a payment, tax transaction, customer checkout session or stock reservation. [Stripe permits a calculation date up to 31 days in the future](https://docs.stripe.com/api/tax/calculations/create); future rates remain estimates and need rechecking at launch.

All six real Stripe calculation checks passed using the existing Texas head-office address as the Texas test destination/origin, plus Stripe's documented California example address. This is a tax-test scenario, not independent confirmation of the dispatch location.

| Scenario | Merchandise | Shipping | Tax | Result |
| --- | ---: | ---: | ---: | --- |
| Before registration starts, cap | $35.00 | $6.99 | $0.00 | No collection before the scheduled date |
| Future Texas, cooking oil | $25.00 | $6.99 | $0.00 | Grocery and its shipping exempt |
| Future Texas, cap | $35.00 | $6.99 | $3.46 | Apparel and shipping taxed |
| Future Texas, oil + cap | $45.00 | $6.99 | $3.34 | Oil exempt, cap taxed, shipping apportioned |
| Future Texas, cap + shirt | $60.00 | $0.00 | $4.95 | Free shipping at exactly $60 |
| Future California, no registration | $35.00 | $6.99 | $0.00 | No unsupported collection jurisdiction added |

Evidence is under ignored `artifacts/tax-integration-2026-11-14/`. Six calculation records are retained as estimates, not sales or filings. No live charge or tax transaction occurred.

## Validation and remaining launch steps

All **16 payment/database tests** passed in isolated temporary schemas, including two new mixed-cart tests: distinct per-product codes and rejection of new/unreviewed items without any stock/order write. Existing reservation, idempotency, signature, reconciliation, totals, expiration and duplicate-event checks continue to pass. All **10 desktop/mobile checkout tests** passed (six sandbox, four live-mode UI checks with mocked session/status responses), along with all **four email-rendering tests**, including the full-total live receipt. Production build and TypeScript pass; focused ESLint, formatting and whitespace checks pass. The first build caught nullable Stripe address fields in the verification script; normalized the required address fields and rebuilt successfully.

The live expiration smoke tool now chooses the reviewed cooking-oil variant and saves each run in a separate evidence directory. This avoids the newly guarded Chin Chin category and preserves older smoke evidence.

Created and immediately expired **one unpaid live Checkout Session** using the mapped cooking-oil variant. Independent Stripe read-back verified the actual generated product carries `txcd_40020002`, the session is expired/unpaid and has no PaymentIntent, and the genuine expiration event has zero pending webhook deliveries. The database order is cancelled and the variant's exact original stock is restored (20 on hand, zero reserved). The public status endpoint independently returned cancelled. No card or customer details were submitted and no charge occurred. Evidence: ignored `artifacts/live-payment-smoke/1794652964363/`.

The initial smoke run's public status probe encountered a network connection timeout after expiration. Recovered and verified that same saved session without creating another order; added transient-probe retry handling to the tool, while retaining its final delivery assertion. The runtime integration was unaffected.

Public browser checks passed at 1440px and 390px: checkout and cap pages returned HTTP 200, checkout retained its test-mode heading and no live-payment button, and there was no horizontal overflow. Anonymous owner API returned 401; the unsigned live webhook returned 400. Evidence: ignored `artifacts/tax-integration-2026-11-14/public/verified.json`.

Still required before customer purchases: resolve the five product reviews; verify the Texas permit is active at the intended start; confirm actual dispatch/policy details and owner acceptance from the outstanding intake; enable the existing live gates when ready; and complete paid live-order/receipt acceptance with an authorized payer. No automatic launch or future background task was scheduled. No client email was sent.
