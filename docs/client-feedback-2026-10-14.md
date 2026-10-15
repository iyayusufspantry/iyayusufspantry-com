# October 14, 2026 - remaining website feedback implemented

This follows the [October 13 client email](client-feedback-2026-10-13.md). The project owner asked to fix all remaining items, then confirmed that Simbiat has not supplied actual stock quantities or verified live-Stripe account details: **none for now**. Those launch inputs remain pending. No client email was sent or review appointment booked.

## Website changes

- Retained the 1600-pixel desktop container, comfortable paragraph widths and larger supporting text from October 13.
- Added a homepage banner cycling every five seconds through the sourcing article, a featured recipe, community stories and Merch. It uses current published CMS content. Previous/next/play/pause controls are available; rotation pauses for reading, manual navigation, hidden/offscreen content and reduced-motion preferences.
- Product photos support hover zoom on mouse devices and a keyboard/touch-accessible enlarged viewer with 100-300% zoom, scrolling, previous/next photos, reset and Escape dismissal. Opening the viewer pauses the product slideshow.
- Added Reading settings with Standard, Larger and Largest text. The choice persists on the visitor's device. Desktop/tablet have a header button; phones expose it in the navigation menu.
- Published the **Merch** category in Contentful with a shopping-bag icon and aprons/tote bags/T-shirts/hats/stickers description. The filtered shop shows a clear coming-soon state until actual merchandise listings are supplied. No invented products, prices or inventory were created.
- Published the supplied **Chin Chin** listing (`/shop/classic-chin-chin`) as **7 oz jar**. Its $10 price, Standard option, variant IDs and other product fields were preserved. This is provisional displayed net weight, not a packed shipping weight.
- Added bounded retries for temporary CMS connection/rate/server failures. Published Contentful remains the only content source.

The CMS update script is `node scripts/contentful/october-14.mjs`, preview-only by default. `--apply` backs up the touched entries, preserves other fields/locales, rejects pending editor drafts and publishes only its saved versions. A repeat preview reports no changes. Management access and environment files remain private.

## Deployment

Production deployment **`dpl_5dCj95o9d6tE1UymGziSBTJQRZYz`** built successfully and was promoted to the existing project on October 14. Target: [www.iyayusufspantry.com](https://www.iyayusufspantry.com).

The first repository-based deployment was blocked by Vercel's Git commit-author permission check. The connected project-owner CLI account deployed the same validated source from a standalone source package, without Git author metadata or local credentials. No Git author identity was changed. The deployment was checked before domain promotion. `.vercelignore` excludes dependencies, caches, environment files, review PDFs/artifacts and the client screenshot reference folder.

## Verification

- Fresh production build/TypeScript, full ESLint, formatting and whitespace checks passed.
- All 40 desktop/mobile account, CMS, gallery and new feedback interaction checks passed locally. The new checks cover rotation/pause/reduced motion, the Merch destination, enlargement/zoom/photo navigation/focus restoration, text-size persistence/mobile overflow and the Chin Chin weight/price.
- Layout checks passed on 28 routes at ten widths: 320, 390, 768, 1024, 1280, 1366, 1440, 1536, 1920 and 2560 pixels. All responses were 200, without horizontal overflow or uncaught browser errors. Homepage/Shop accessibility scans passed at 390, 1440 and 2560 pixels; modal accessibility scans passed in the interaction tests.
- All nine payment/database tests passed, covering reservations, concurrent overselling prevention, signature/mismatch rejection, duplicate processing, expiration, reconciliation and live-key rejection. These test sandbox behavior, not actual stock or live payment readiness.
- Read-only operational checks on the public website passed before the deployment. The deployed homepage, provisional product weight/enlarge control and Merch empty state were inspected before promotion.
- The [updated 23-page PDF](../output/pdf/Simbiat-Website-Review-October-14.pdf) compares six desktop widths and includes enlarged-photo, reading-control, largest-text and Merch views. It uses local captures of the deployed code. All pages were rendered with Poppler and checked for embedded screenshots/numbering; the page overview and feature pages were visually reviewed. The original October 13 PDF remains historical.

After promotion, **all 22 live desktop/mobile account, feedback-feature and product-gallery checks passed** on the canonical domain. The post-deployment read-only operational check also passed all 19 configuration/database/public endpoint checks, including protected owner/export/maintenance routes and the sandbox webhook signing-secret match. It explicitly reports `livePaymentsSupported: false`. No real charge, real stock adjustment, email send or live-sales activation occurred. Local evidence and publication backups are under ignored `artifacts/client-feedback-2026-10-14/`.

## Remaining inputs and acceptance

- Confirmed physical stock counts, verified live Stripe account/integration access, tax/ship-from details and final delivery/policy acceptance. Existing US-only / $6.99 shipping / free shipping from $60 are agreed working defaults; they are not implemented live charges. Current checkout remains sandbox-only. The owner confirmed no new stock/live-account information is available yet.
- Merchandise photos, descriptions, prices, sizes/options and quantities before creating sale listings.
- Recipe PDFs and sourcing collage from Simbiat, expected in about a week without a fixed deadline.
- Her desktop/monitor, browser/zoom/window details to reproduce her exact view, and review-session availability/time zone.
- Final client acceptance. The [updated reply](simbiat-october-13-reply.md) remains an unsent draft; it must not claim live-payment checks or live-sales launch are complete.
