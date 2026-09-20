# Iya Yusuf's Pantry logo assets

Clean vector reconstruction of the client-supplied `public/assets/1789861951268blob.jpg`, prepared 20 September 2026. The cart silhouette and rounded uppercase lettering are manually redrawn; this is not the original designer's vector master or an exact font match.

- `iya-yusufs-pantry-logo.svg`: stacked logo, 640 × 300 viewBox.
- `iya-yusufs-pantry-horizontal.svg`: website header/footer layout, 464 × 104 viewBox.
- `iya-yusufs-pantry-icon.svg`: cart symbol, 224 × 200 viewBox.
- Matching `.png` files: transparent exports at three times the SVG dimensions.

All SVGs use vector paths and circles, with no embedded bitmap, external resources, or font dependencies. Backgrounds and the gap between the cart panels are transparent. Colors are flat for consistent reproduction: client-confirmed green `#06ad8f`, supporting lime `#85c83e`, navy `#29325f`, and dark wheel centers `#111735`. Supporting colors approximate the reference; they are not separately client-confirmed. The original JPEG uses lime lettering and gradients; this reconstruction applies the confirmed green to the lettering and rear cart panel.

Prefer white or pale neutral backgrounds, preserve the aspect ratio, and leave clear space around the artwork. The cart symbol is intended for compact placements; use the full name in accessible labels where it identifies the business. These assets are ready for client visual review.

The horizontal SVG appears in the site header and footer. The cart symbol also supplies `app/icon.svg` and `app/favicon.ico` for browser tabs.

Regenerate all assets, including the browser icons, with `node scripts/export-brand-assets.mjs` from the repository root. Geometry and colors are maintained in that script.
