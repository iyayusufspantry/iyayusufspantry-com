# October 2: community story, pantry products, and homepage links

**October 3 recheck:** logo navigation, the community-page story, and enabled shopper submissions now pass live desktop/mobile checks. See [the current request checklist](client-request-recheck-2026-10-03.md); the earlier deployment notes and proof results below record the original audit status.

## Supplied content

Simbiat supplied **Rediscovering the Taste of Home**, four product descriptions and prices, four corresponding photographs, a footer screenshot, and one optional photograph of bottled red drinks. Originals remain in `public/assets/2 oktober/`.

| Product                   | Photo                   | Sizes and prices  | Existing URL                 |
| ------------------------- | ----------------------- | ----------------- | ---------------------------- |
| Whole Egusi (Melon seeds) | `1790909014944blob.jpg` | 1 oz $3; 1 lb $20 | `/shop/ground-egusi`         |
| Whole Ogbono Seeds        | `1790909713990blob.jpg` | 1 oz $3; 1 lb $20 | `/shop/ogbono`               |
| Smoked Catfish            | `1790910787633blob.jpg` | 1 lb $25          | `/shop/smoked-catfish` (new) |
| Smoked Large Red Crayfish | `1790910910217blob.jpg` | 1 oz $5           | `/shop/dried-crayfish`       |

The three existing sample listings become the supplied products; their URLs and references remain intact. Old sample variants become inactive. The prices are explicit per-size records, including the supplied pound discount. No stock quantities or payment configuration are changed. Unconfirmed sample dietary labels and preparation copy are removed. Fish and shellfish notices identify the supplied products; complete ingredient and packaging information remains outstanding.

The optional image, `1790911112946blob.jpg`, is retained for later use without assigning an unconfirmed drink identity. `1790908098519blob.jpg` is a screenshot of the footer, not a product image. Three further spice products and the drink recipe material are still awaited.

## Story and navigation

The complete nine-paragraph story is a Contentful journal article attributed to Simbiat, categorized as **Community stories**, with editable linked paragraph entries. It appears at `/blog/rediscovering-the-taste-of-home` and in full on `/stories`. Editorial community stories remain visible when visitor submissions are disabled. Existing visitor submissions and owner moderation are unchanged.

Both logo links now target `/#top`, with a matching document anchor. This explicitly returns to the homepage top from the homepage itself or another route, including repeated clicks. Clicking the header logo also closes the mobile menu.

## CMS workflow and verification

`node scripts/contentful/october-2.mjs` writes a read-only plan. `--apply` backs up CMS data and stages drafts. `--apply --publish-staged` publishes only the recorded versions, rejecting intervening edits. The migration preserves unrelated fields and other locales. Backups, staging data, and browser screenshots are under ignored `artifacts/client-feedback-2026-10-02/`.

`node scripts/contentful/october-2-verify.mjs <origin>` checks desktop and mobile logo navigation, repeated clicks, mobile-menu closure, the full story on both routes, all supplied product descriptions and photos, six size prices, the $76 combined cart, persistence, and server cart review. It does not place orders.

Published four assets and 24 content entries after verifying the staged content locally. A subsequent read-only plan reported zero remaining changes. All four public product pages and the journal story returned HTTP 200 with the correct titles on the live website.

Full ESLint, TypeScript, production build, changed-file formatting, and whitespace checks passed. The browser checks passed at 1440px and 390px against both the staged preview and the production build using published Contentful content, with no uncaught browser errors or horizontal overflow. The server cart review returned the expected 7,600-cent subtotal. Screenshots are in the ignored browser artifact directory.

The application changes have **not been deployed**: the logo behavior and `/stories` editorial display require deployment. The Contentful product updates and journal story are already live. Visitor submission settings and hosting configuration remain unchanged.

## Second email: egusi recipe photograph

The screenshot `public/assets/2 oct - second/1790911862424blob.jpg` identifies the homepage's **A comforting bowl of egusi** recipe card. Use the close-up bowl photograph, `1790911898722blob.jpg`, as its temporary recipe image. The second photograph, `1790911916139blob.jpg`, shows the bowl alongside a wrapped accompaniment and is retained as an alternate. The other six files repeat the first email's references and product photographs.

`scripts/contentful/october-2-recipe-photo.mjs` previews the change by default; `--apply` backs up the current recipe, uploads the close-up, and publishes only its `image` and `imageAlt` fields. Existing recipe copy, ingredients, timing, and sample status remain unchanged. The shared CMS image supplies the homepage card, recipe listing, recipe detail page, and related recipe cards. Backups are in ignored `artifacts/client-feedback-2026-10-02/recipe-photo/`.

The photograph is published and verified live at 1440px and 390px on `/`, `/recipes`, `/recipes/egusi-greens`, and `/shop/ground-egusi`. Images decoded successfully with no horizontal overflow. The authenticated content refresh returned HTTP 200; desktop and mobile homepage recipe screenshots are saved beside the backup. This CMS update needs no application deployment. A repeat plan confirmed the photo is already current, and script lint/format checks passed.

The shared Contentful management helper now accepts HTTP 204 responses without trying to parse an empty JSON body, as required by the asset-processing endpoint.

## Recommendation for paid drink recipes

Start with one illustrated PDF collection of three to five drinks. Include exact measurements, yield, equipment, numbered steps with photographs, substitutions, troubleshooting, and preparation/storage guidance reviewed by Simbiat. Offer a sample page so buyers can see the level of detail. A possible initial experiment is $5 for one detailed recipe or $12–15 for a small collection; these are proposed test prices, not approved prices or market benchmarks.

For an initial launch, link the recipe sales page to Payhip checkout. Payhip supports PDFs, immediate downloads after purchase, and an emailed download link ([digital product documentation](https://help.payhip.com/article/59-adding-a-digital-product)). Its free plan currently charges 5% per sale plus the payment processor's fees ([pricing](https://payhip.com/pricing), checked October 2, 2026).

The current website's public recipe pages do not protect paid material, and its checkout does not deliver digital purchases. Keep paid PDFs out of `public/` and public CMS assets. A future integrated implementation would need private file storage, verified payment fulfillment, download authorization, and recovery for lost links. Recipe sales, prices, and a new provider have not been activated by this update.

## Full recheck and proof PDF

A fresh read-only audit checked both emails against the live website and a newly built local production server at 1440px and 390px. Of 49 recorded checks, 43 passed. The six live failures are the same two deployment gaps across both viewports: two logo-navigation scenarios and the story's community-page placement. All 24 local browser checks passed. Published product descriptions, six exact prices, photographs, all nine journal paragraphs, the soup photo placements, and the $76 cart/server subtotal passed live and locally. The fresh production build, TypeScript compilation and full lint run passed.

The 14-page [October 2 proof PDF](../artifacts/pdf/Iya-Yusufs-Pantry-October-2-Proof.pdf) contains an itemized status table, readable story transcript, fresh live/local screenshots, individual product and size evidence, recipe-photo proof, cart totals, retained-photo inventory, pending client materials, recipe-sale recommendations, and the full check matrix. All pages were checked for overflow, and the actual PDF was verified to have 14 numbered landscape pages with selectable text and embedded images.

Run `scripts/audit-october-2.mjs` with the local production server on port 3106 to collect evidence. `scripts/export-october-2-proof.mjs` creates the PDF and a self-contained HTML companion. The exporter rejects changed audit outcomes until its narrative is reviewed. Raw outcomes, screenshots, input-file SHA-256 hashes and build/lint logs are in ignored `artifacts/client-feedback-2026-10-02/proof/`. This recheck did not publish, deploy, place orders, send messages or submit stories.

### PDF spacing revision

The [revised proof PDF](../artifacts/pdf/Iya-Yusufs-Pantry-October-2-Proof-Revised.pdf) removes oversized blank screenshot frames, aligns column starts, standardizes image and callout insets, and ends the desktop story crop between paragraphs. The cart image uses a narrower column at its natural aspect ratio. Report styling is maintained in `docs/october-2-proof.css`. The exporter now checks all content blocks against the page margins and footer. All 14 pages passed; extracted text matches the original PDF exactly. The original PDF and source screenshots are preserved. This revision changes PDF presentation only.
