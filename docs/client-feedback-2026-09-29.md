# September 29: family story and six products

**Deployed and published** at [Iya Yusuf’s Pantry](https://www.iyayusufspantry.com). This intake replaces the pending story noted in the September 27 feedback. The follow-up email supplied Donkwa / Adakwa / Tanfiri and Coconut Candy Crunch, bringing the confirmed range to six products.

Application commit `93504ea` deployed successfully to production through Vercel. Both Contentful batches were published at their exact saved versions: 15 photos and 31 entries. Authenticated cache revalidation returned HTTP 200.

## Content prepared

- The About page contains all four supplied story paragraphs, including Iya Shob, Abule Ado, Lagos, and the four-generation family history. Its supporting value statements now reflect that history. The homepage uses excerpts from the supplied story and no longer labels that story as a draft.
- Added Zobo Drink and Tiger Nut Drink to Drinks, each with one 16 oz bottle option at $7.
- Added Lightly Salted Roasted Groundnut to Snacks, with a 16 oz jar at $10.
- Updated the existing Kuli Kuli entry at `/shop/kulikuli`, with the supplied description and a 16 oz jar at $10. Its old sample variant is staged as inactive; a new standard variant avoids retaining the unconfirmed Vegan label or changing an immutable variant ID.
- Uploaded all 11 supplied photos, with descriptive alternative text and packaging photos first in each gallery. Originals remain in `public/assets/29-sep-2026/`.
- Added Donkwa / Adakwa / Tanfiri at `/shop/donkwa` and Coconut Candy Crunch at `/shop/coconut-candy-crunch`, each with one 16 oz jar option at $10. Descriptions retain the supplied wording; Donkwa includes the peanut allergen statement. All three Donkwa names appear in the title for search.
- Uploaded four more photos from `public/assets/new/`, two per new snack, with packaging images first. The four `-1` files are byte-identical duplicates and were not uploaded again. Originals are preserved.
- Product approval now controls sample-price and sample-description notices. Other sample products retain their notices. Single-size products do not show redundant size controls or the internal Standard dietary label.

The source copy and photo mapping are in `scripts/contentful/september-29-content.mjs`. No stock quantities, shelf life, shipping rules, or dietary certifications were supplied or invented. Checkout remains in its existing preview/test mode.

## Publication record

The live [About page](https://www.iyayusufspantry.com/about) and [shop](https://www.iyayusufspantry.com/shop) contain the approved content. The original batch artifacts are in the ignored `artifacts/client-feedback-2026-09-29/` directory. The follow-up batch and combined six-product preview snapshot are in `artifacts/client-feedback-2026-09-29-snacks/`; production deployment and verification evidence are in its `live/` subdirectory.

The preview uses a process-local fetch adapter against the saved snapshot. Application code continues to load published Contentful content only.

The display changes were deployed first, followed by these publication commands:

```powershell
node scripts/contentful/september-29.mjs --apply --publish-staged
node scripts/contentful/september-29.mjs --additional-snacks --apply --publish-staged
```

Each command checks its saved versions before publishing, rejects later editorial changes or incomplete batches, and publishes assets and dependencies before updated copy. The original batch contains 11 assets and 27 entries; the follow-up contains four assets and four entries (two products and two variants). All 38 resources in the original batch retained their saved versions when the follow-up was staged. The script defaults to a read-only plan; `--apply` saves drafts and refuses to overwrite an existing staged batch. Use `--additional-snacks` to select the follow-up intake without modifying the earlier story or product drafts. Do not restore the archived seed over editorial content.

## Verification

- Production desktop (1440px) and mobile (390px) checks passed after publication: homepage, complete About story, Drinks filter, all six product pages, gallery selection and image decoding, Donkwa search aliases, and cart persistence. One of each product totals $54. No horizontal overflow or browser errors were detected. Results and screenshots are saved in `artifacts/client-feedback-2026-09-29-snacks/live/`.
- Production build and TypeScript passed against published content.
- ESLint and Prettier passed for the changed files.
- Eight Contentful tests and four reference-mapping tests passed, including approved versus sample products, confirmed variant prices, and galleries.
- Preview checks at 1440px and 390px passed for the About page, homepage story, Drinks category, all four product pages, and cart. All gallery images decoded, gallery selection worked, and pages had no horizontal overflow or browser errors.
- Adding one of each product produced a $34 subtotal and survived a reload. An unrelated sample product retained its sample-price notice.
- Follow-up verification passed at both widths for all six product pages and the original story. Both new galleries decoded and switched correctly; Donkwa, Adakwa, and Tanfiri searches each returned the same single product. One of each of the six products totaled $54 and survived a cart reload, with no horizontal overflow or browser errors. Changed intake scripts passed ESLint and Prettier; this follow-up needed no additional application display changes.

These checks cover content, display, and cart behavior; they do not establish physical inventory or live checkout readiness.
