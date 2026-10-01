# September 30: refreshed photos, palm oil, and Chin Chin

Published in Contentful and verified at [Iya Yusuf’s Pantry](https://www.iyayusufspantry.com). This was a content update using the existing storefront; no application deployment was needed.

## Changes

- Replaced the homepage banner with `1790739359352blob.jpg`.
- Replaced the three homepage pantry photos with the supplied Donkwa, coconut, and tiger nut drink images with warm backgrounds. The shared Donkwa image also updates the story section and other uses of that brand image. The two screenshots in the intake remain reference material only.
- Updated `/shop/palm-oil` to **African Red Palm Oil**, using the supplied description, 32 oz at **$10**, and 1/2 gallon (64 oz) at **$20**. Its gallery contains both jug photos and both illustrative size comparisons. The extra file `1790741820964blob.jpg` in the supplied folder is the 64 oz jug photograph.
- Updated `/shop/classic-chin-chin` to **Chin Chin**, with the supplied description, ingredients, **$10** price, and two product photos. Kept the existing URL. The unit is “jar”; this intake did not specify a net weight.
- Added the supplied 4-inch by 3-inch container reference to Chin Chin, Kuli Kuli, Donkwa, Coconut Candy Crunch, and Lightly Salted Roasted Groundnut. Existing photos for the latter four remain in place.
- Replaced the old sample variants for palm oil and Chin Chin with three approved variants. The old variants are inactive, preserving their identifiers. Removed unconfirmed sample dietary choices from these two products.
- Replaced the homepage gallery’s outdated “packaging being confirmed” note with a simple description of the displayed jars and bottles.

Original files remain in `public/assets/30 september/`. All 11 published images were supplied by the client; no images were generated or altered in this update. No stock quantities, shipping rules, or payment settings were changed.

## Publication and verification

`scripts/contentful/september-30-content.mjs` records the copy and image mapping. `scripts/contentful/september-30.mjs` defaults to a read-only plan, refuses to overwrite pending editorial changes, saves backups before staging, and checks exact saved versions before publishing assets and entries.

```powershell
node scripts/contentful/september-30.mjs
node scripts/contentful/september-30.mjs --apply
node scripts/contentful/september-30.mjs --apply --publish-staged
node scripts/contentful/september-30-verify.mjs https://www.iyayusufspantry.com
```

Published 11 assets and 18 entries. Authenticated live cache refresh returned HTTP 200. A subsequent read-only plan found zero remaining changes.

Desktop (1440px) and mobile (390px) verification passed for both the staged preview and public website: homepage image mapping, product descriptions, all palm oil and Chin Chin gallery images, the shared snack reference, size selection, prices, snack search, image decoding, and horizontal layout. Adding one 32 oz jug, one 64 oz jug, and one Chin Chin jar produced three cart lines totaling **$40**, retained after reload. No browser exceptions occurred. Server-side catalog mapping and quote calculation also returned the expected three active variants and $40 subtotal. No orders were submitted.

The updated reduced-motion gallery regression passed in Chromium. ESLint, formatting checks, and `git diff --check` passed for changed files. The full historical prototype suite was not run; it contains assumptions about the original sample catalog.

Backups, saved versions, preview snapshots, desktop/mobile screenshots, and verification reports are in the ignored `artifacts/client-feedback-2026-09-30/` directory. The preview uses a process-local fetch adapter; when running Next.js development workers, load it through `NODE_OPTIONS=--require .../preview-fetch.cjs`. A previously built production server can retain prerendered catalog pages and should not be used to inspect changed drafts.
