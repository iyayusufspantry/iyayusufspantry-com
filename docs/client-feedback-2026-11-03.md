# Client follow-up — intake November 3, 2026

Source: Simbiat’s email pasted in the development chat and five original JPEGs supplied in `new/`. November 3 is the intake date; the pasted email has no independently verified sent date. No email was sent.

## Confirmed requests and launch position

- Add the existing Google search icon/link to **Nigerian dates** in the Tiger Nut Drink ingredient list.
- Show the supplied merch photos. T-shirt sizes are **Medium, Large, Extra-large, XX-large**. Two designs and three views of one cap are supplied; these are three items, not five different products.
- Simbiat thanks Zul for the mailbox. This does not verify incoming/reply tests or handover; the previously recorded first-year courtesy remains unchanged.
- Simbiat explicitly states that the business has **no active Texas sales-tax permit and no registrations in other states**. This resolves the earlier unknown registration position; do not ask whether she already has those permits again. She asks whether registration is required. The IRS EIN and LLC paperwork do not establish state sales-tax registration.
- No merch prices, stock counts, cap size/fit specification, or permission to invent them was supplied. Publish photographic previews; purchasable variants await those facts. Existing food inventory and checkout gates are preserved.

## Implementation and photo mapping

`IngredientLinks` now matches the full phrase Nigerian dates and uses the same accessible Google-search link and search icon as the other ingredients. Text, allergens and the existing CMS product correction are preserved.

The existing Merch destination remains `/shop?category=merch`. It shows three searchable CMS previews with full-image galleries, enlargement, confirmed shirt sizes and coming-soon wording. Prices and stock are absent, and there are no purchase actions for these previews. Name sorting remains available; price sorting is hidden when the category has no sale products. Ordinary product browsing remains intact.

| Source | Item / view |
| --- | --- |
| `new/1793650610442blob.jpg` | Cream “I Rock with Iya Yusuf’s Pantry” T-shirt |
| `new/1793650687904blob.jpg` | Orange “My Roots Have Flavor” T-shirt |
| `new/1793650782280blob.jpg` | Olive-green Pantry People cap, front |
| `new/1793650791867blob.jpg` | Cap side with Iya Yusuf’s Pantry embroidery |
| `new/1793650801094blob.jpg` | Cap opposite side with Since March 2024 embroidery |

All five originals were visually inspected and uploaded without image edits. Contentful now has a `pantryMerchPreview` model with ordinary name, slug, description, confirmed sizes, photo references and sort-order fields. Three entries and five assets are published. These entries do not create commerce products, variants, prices or stock. Unpublishing a preview removes it; unpublished photos are not restored from local fixtures. If an item becomes purchasable later, create its confirmed product/variants and retire its preview to avoid duplicate listings.

`scripts/contentful/november-3.mjs` previews by default and applies only with `--apply`. It checks existing drafts and exact values, uses version checks, saves ignored backups, and preserves all pre-existing entries/assets/models. The first run published the shirts and stopped before publishing the cap because Contentful omits an empty optional array. Corrected the expected cap representation, verified that exact newly created version-1 draft, and resumed publication. A subsequent preview reports no changes. No prior editor draft was overwritten.

## Sales-tax response — checked November 3, 2026

- The [Texas Comptroller permit FAQ](https://comptroller.texas.gov/taxes/sales/faq/permit.php) describes permit requirements for businesses engaged in Texas, the application route, no permit fee (with a possible security bond), and ongoing filing obligations including periods with no taxable sales. Based on the known Texas business location and planned taxable merch sales, a Texas permit is generally required before those sales. The remote-seller $500,000 safe harbor is not a blanket exemption for a business physically based in Texas.
- The [Texas grocery publication](https://comptroller.texas.gov/taxes/publications/96-280.php) distinguishes exempt groceries from taxable clothing and certain edible items. No blanket food exemption or per-SKU tax determination has been invented.
- [Streamlined Sales Tax’s remote-seller guidance](https://www.streamlinedsalestax.org/for-businesses/remote-seller-faqs/remote-seller-state-guidance) explains physical presence and state-specific economic nexus. Nationwide shipping alone does not require automatic registration in every state. No individual-state threshold table was adopted as an up-to-date determination of this business’s obligations.
- The [unsent reply](simbiat-november-3-reply.md) asks for merch commercial details and directs Simbiat to the Comptroller or a qualified sales-tax adviser for registration/product treatment. Configure Stripe only from confirmed active registrations and classification instructions. Public checkout remains in test mode; no tax registration or live-sales activation was performed.

## Validation and publication

Production build and TypeScript passed. Eight selected desktop/mobile checks passed for the new preview mapping and isolation from sale products, all three merch items, shirt sizes, cap views/enlargement, loaded photos, query/no-results behavior, accessibility, mobile width, the homepage Merch destination, and Nigerian dates/search/allergen text. The first run encountered a cached two-item CMS response while cap publication propagated; the next complete run passed. Visual review found preview CSS nested in the mobile media query; moved it to the shared layer and rebuilt before the successful full run.

**The changes are deployed and verified at [the public Merch page](https://www.iyayusufspantry.com/shop?category=merch).** At the user’s direction, switched GitHub CLI authentication to the existing `iyayusufspantry` account, verified repository admin access, configured this repository’s commit identity to that account’s verified GitHub login/ID and noreply address, and pushed `master` to the existing `main` remote. No global Git identity or commit history was rewritten. Vercel reports successful deployment `HPXboK7qPAERB7hCRdahcHQvs7JM` for application commit `d4c52e5`. The push also includes the previously uncommitted live-checkout preparation already deployed October 31, preserving its test-mode launch gates, and the existing local prototype-badge removal commit. The 29 payment, operation and email tests passed again before pushing.

All **six public desktop/mobile browser checks** passed after deployment: merch photos, shirt sizes, cap galleries/enlargement, searching, accessibility, the homepage Merch destination, and the Nigerian dates link with unchanged ingredient/allergen text. Public merch, Tiger Nut Drink and checkout return 200; checkout retains test-mode wording, and anonymous `/api/owner` returns 401. Public screenshots and sanitized probes are saved under ignored `artifacts/client-feedback-2026-11-03/`.

The direct Vercel CLI attempt initially returned Not authorized for `muhzulzidan`; the unused device-login wait was cancelled after the user chose GitHub deployment. Git’s DNS lookup for github.com failed twice while Windows DNS resolved the host; the successful push used the observed address through a single-command `http.curloptResolve`, preserving HTTPS certificate checks and leaving persistent DNS/Git network settings unchanged. No alternate project, production environment-variable change, live-sales activation, paid transaction, or email send occurred.
