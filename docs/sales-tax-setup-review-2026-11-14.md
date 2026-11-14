# Tax setup preparation - November 14, 2026

Status: **Texas registration scheduled; product-tax integration deployed, with five food reviews outstanding**. At the user's "do it" instruction, created and independently verified `taxreg_1UbeF2HKfhrlO2yzVLRv7wNr`, status `scheduled`, for US / TX / state_sales_tax. It starts **November 23, 2026 at 12:00 AM CST (America/Chicago)**, `2026-11-23T06:00:00Z` / Unix `1795413600`. The subsequent completion request added product-specific codes and validation while preserving test-mode checkout. See the [registration verification](client-feedback-2026-11-14.md#texas-registration-scheduled-at-the-users-request) and [current integration record](tax-integration-2026-11-14.md).

Subsequent completion request: [product-tax integration is now deployed](tax-integration-2026-11-14.md). The server mapping covers 19 products / 28 prepared live variants; five food products remain explicitly pending and are blocked from live checkout. Six real Stripe tax estimates, 16 database/payment tests, 10 checkout UI tests and four email tests passed. One unpaid live session verified the actual product tax code, signed expiration event and full stock restoration. The candidate table below preserves the initial review; the integration record and server mapping now define the implemented categories. Checkout remains in test mode.

## Registration and checkout work

The official Texas lookup currently reports the business and location as INACTIVE, with location start date November 23, 2026. Confirm the intended date with Simbiat and recheck the official record before sales activation. Do not infer that the date alone guarantees active status.

The **US / TX / state_sales_tax** registration is now scheduled using the permit's date at the user's instruction. [Stripe supports a future `active_from` timestamp](https://docs.stripe.com/api/tax/registrations/create); `active_from=now` was not used. No other state was added. This Stripe configuration does not submit a state application, change Texas permit status, enroll in filing services, or agree a website launch date. If the intended date changes, update the schedule to match confirmed instructions.

Checkout now passes the reviewed per-product `tax_code` values in `line_items[].price_data.product_data`, with a blocking error for pending/new products. It no longer falls back to the single account preset in new live orders. [Stripe documents the exact field and preset fallback](https://docs.stripe.com/tax/products-prices-tax-codes-tax-behavior). Existing exclusive-USD behavior, automatic tax, shipping calculation, signed-webhook checks and the test-mode gate are preserved. Taxable, exempt and mixed-cart estimates including shipping passed; see the integration record for scope and remaining food reviews.

After active registration/status, approved classifications and checkout checks are complete, use the existing documented live-mode gates and redeploy. Final paid-order/receipt acceptance requires an authorized payer; the previous unpaid expiration check is not that acceptance. Confirm dispatch/policy details and final owner acceptance against existing correspondence.

## Product-category candidates

These are technical candidates for business/adviser review, not final legal tax determinations. Exact code identifiers and category names below were retrieved from Stripe's live Tax Codes API on November 14. The [Comptroller grocery guidance](https://comptroller.texas.gov/taxes/publications/96-280.php) distinguishes ordinary groceries, candy, individual-serving snacks, sweetened drinks and milk substitutes. Existing catalog ingredients and package sizes have already been read; do not request them again wholesale.

| Products | Verified Stripe category candidate | Review needed |
| --- | --- | --- |
| Both T-shirt designs | `txcd_30011000` - Clothing & Footwear | Confirm general-use apparel category. |
| Pantry People Cap | `txcd_30060006` - Hats | Confirm general-use hat category. |
| African Red Palm Oil, both sizes | `txcd_40020002` - Edible Oils | Confirm sold as cooking oil. |
| Ground Cameroon Pepper, Suya Mix, Pepper Soup Mix | `txcd_40020007` - Seasonings | Confirm cooking-seasoning use; existing ingredients are available. |
| Garri, Yam Flour | `txcd_40040000` - Food for Non-Immediate Consumption | Review tuber-based staples; do not infer the grain-specific Flour code applies to cassava/yam. |
| Nigerian Beans, Tiger Nuts | `txcd_40040019` - Vegetables, or `txcd_40040000` - Food for Non-Immediate Consumption | Review the appropriate category; tiger nuts are tubers, not automatically tree nuts. |
| Whole Egusi, Whole Ogbono, both sizes | `txcd_40040016` - Nuts and Seeds, or `txcd_40040000` - Food for Non-Immediate Consumption | Confirm unroasted/unsalted preparation and cooking use, especially the 1 oz variants. |
| Dried Hibiscus Flower | `txcd_40040000` - Food for Non-Immediate Consumption | Review dried culinary/herbal infusion ingredient category. Do not infer bottled-drink treatment. |
| Nigerian Dates | `txcd_40400005` - Dried Fruit - Unsweetened | Confirm dried with no added sweetener/coating. |
| Smoked Catfish, Smoked Large Red Crayfish | `txcd_40040000` - Food for Non-Immediate Consumption | Confirm sold as packaged cooking ingredients; do not assume the muscle-meat category covers seafood. |
| Lightly Salted Roasted Groundnut, 16 oz jar | `txcd_40040017` - Nuts and Seeds, Processed; compare `txcd_40070005` - Snack Foods | Check nutrition serving declaration and whether there are individually wrapped portions; jar size is already known. |
| Coconut Candy Crunch | `txcd_40100001` - Candy | Review the supplied coconut/sugar preparation. |
| Chin Chin, 16 oz jar | `txcd_40070005` - Snack Foods; compare `txcd_40100002` - Candy (Contains Flour) | Needs actual product-category review: snack code excludes cookies/crackers and candy-with-flour is not inferred merely from sugar/flour ingredients. |
| Donkwa and Kuli Kuli, 16 oz jars | `txcd_40070005` - Snack Foods; compare `txcd_40100001` - Candy and `txcd_40100002` - Candy (Contains Flour) as applicable | Review preparation, sweetening and actual category. Ingredients and jar sizes are already supplied. |
| Zobo Drink, 16 oz bottle | `txcd_41040003` - Bottled Tea - Non-Carbonated - Sweetened | Confirm hibiscus-infusion classification rather than a different sweetened-drink category; honey is already confirmed. |
| Tiger Nut Drink, 16 oz bottle | `txcd_41060003` - Milk Substitutes | Confirm it qualifies as a milk substitute; creamy appearance alone does not establish this. Otherwise review the exact beverage category. Honey/dates ingredients are already supplied. |

Dried Ugu is the legacy sample product and is outside the 33-variant launch stock. A fresh raw CMS audit found one published active sample variant; it has no prepared live stock and no reviewed live tax code, so it cannot complete live checkout. This corrects the initial statement that it had no published variant. If approved for sale, it needs its own stock and tax review.

The user authorized using the permit's November 23 date for the Stripe schedule; Simbiat has not separately confirmed a website launch date. Review of the ambiguous prepared-snack/drink categories and relevant serving/presentation details remains outstanding. Technical mapping and final checkout verification remain developer work. No email has been sent.
