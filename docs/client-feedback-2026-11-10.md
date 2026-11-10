# Client follow-up — intake November 10, 2026

Source: Simbiat's email pasted in the development chat, with the earlier correspondence quoted below it. November 10 is the intake date; the latest email's sent date is unverified.

## Confirmed details

- **12 per T-shirt design and 12 caps**, confirmed by the user in chat. This supersedes the November 4 instruction of 50 per product: 36 total units across three products.
- Both T-shirt designs cost **US$25 each**. Sizes remain Medium, Large, Extra-large and XX-large. The quantity split across sizes remains pending; no equal split is inferred.
- Caps cost **US$35 each** and come in **one adjustable size**.
- Simbiat reports submitting her Texas sales-tax permit application and awaiting approval. This supersedes the earlier application status; it does not establish an active permit. No other-state registration or food/drink tax classification was supplied.

## Implementation

The [current stock intake](starting-stock-merch-2026-11-10.json) supersedes the [November 4 record](starting-stock-merch-2026-11-04.json), which remains historical. Product draft totals become 12 each, with existing CMS display prices of $25/$35 and the cap's confirmed size. Shirt sizes and all approved photos are preserved. Product drafts remain unpublished; no shirt-size allocation or sale variant is created and no operational stock is reset.

Published merch previews gain an optional confirmed display-price field and the cap's size label. The storefront maps and displays these prices without creating purchase actions. Existing local sale controls remain dependent on actual published products and active variants. Public checkout's test-mode gate and Stripe tax settings are unchanged.

`scripts/contentful/merch-details-2026-11-10.mjs` previews by default and applies with `--apply`. It checks the known previous quantities, existing prices, size labels, clean published previews and absence of sale variants; saves ignored backups; uses CMS versions; and verifies each changed entry. Its scope is three unpublished product drafts and three published display previews, plus one optional preview-model field.

The [new unsent reply](simbiat-november-10-reply.md) acknowledges the confirmed prices, quantities, cap fit and pending permit, and asks only for the remaining shirt-size breakdown. No email was sent. The November 3 reply is historical correspondence and should not be reused as the current draft.

## Verification

Applied and verified all six CMS entry updates and the optional preview price field. A second preview reports no changes. All three product entries remain unpublished with quantity 12 and display prices $25/$25/$35; the three display previews are published with the confirmed prices and cap size. Ignored backups, plan and verification are under `artifacts/merch-details-2026-11-10/`.

Production build and TypeScript passed, as did focused ESLint, formatting and whitespace checks. All four focused Playwright checks passed across desktop/mobile: published preview price mapping, rejection of invalid display prices, isolation from sale products/variants, $25/$35 display, adjustable cap size, existing shirt sizes, complete photos, cap galleries/enlargement, search, accessibility and mobile width. Desktop and mobile screenshots were visually inspected.

Storefront price-display source changes remain local and have **not been deployed**. CMS preview details are published, so the existing public renderer can show the cap's size; rendering the new price field requires the source deployment. No operational stock, live-checkout gate, Stripe tax settings or other products were changed. No email was sent.
