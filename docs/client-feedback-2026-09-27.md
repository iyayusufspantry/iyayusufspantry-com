# Simbiat's September 27 feedback

Published and verified on the live website. The poem and Yusuf Sanni's supplied portrait are available at https://www.iyayusufspantry.com/blog/kookoo-roo-koo and featured on the homepage and blog index. The motto and Drinks category are also live.

- Added Drinks as the sixth category, with a glass icon and a balanced category grid. No drink products or prices were invented.
- Made “Experience authentic Nigerian foods.” the main motto. Kept “A taste of home. A world of good food.” as supporting homepage and footer copy.
- Added “Kookoo roo koo,” with Yusuf Sanni's exact supplied poem, author credit, and portrait. Featured it on the homepage and blog index. Approved articles no longer display sample article notices.
- Preserved the logo, colors, existing product inventory, and About story pending Simbiat's text.

## Deployment blocker

**Resolved:** Later production deployments succeeded. Before publishing, the live JavaScript and mapped content were checked for the article author, approval status, article image, and Drinks icon support. The exact staged Contentful versions were then published, and authenticated cache revalidation returned HTTP 200. The original blocker below is retained as history.

Vercel blocked deployment `dpl_8QoJRu3UK4Z7kT22cHNvJWWgmQfK`: “The deployment was blocked because the commit author doesn’t have permission to create deployments for this project.” An authorized project administrator must resolve author access before deploying. No author identity or permission settings were changed.

Deploy the display code first: the existing live category renderer does not support the new `drinks` icon. Then publish the staged Contentful versions:

```powershell
node scripts/contentful/client-feedback.mjs --apply --publish-staged
```

This uses `artifacts/client-feedback/staged.json`, checks every saved version before publishing, and publishes the portrait and linked entries before the homepage reference. Backups and the preview snapshot are in the same ignored artifacts directory. Do not rerun the original import or restore the archived seed over current editorial content.

The optional Author field was added to the article content model. The article, category, portrait, and text changes are now published. The About story is still awaiting the client.

## Verification

- Live desktop and mobile verification passed for `/`, `/shop?category=drinks`, `/blog`, and `/blog/kookoo-roo-koo`: HTTP 200, images decoded, author credit present, sample notice absent for the poem, working category filters, no horizontal overflow, and no browser errors. Screenshots and results are saved in `artifacts/client-feedback/live/`.
- The previously exported PDF represents the earlier draft preview; the website now contains the published changes.

- Production build passed against published Contentful content.
- Seven Contentful tests passed, including author, approval status, and article image mapping.
- Changed files passed ESLint and Prettier checks.
- Local preview of the staged content passed desktop (1440px) and mobile (390px) browser checks for homepage, Drinks filter, blog index, and poem page: HTTP 200, no horizontal overflow, no browser errors, portrait images decoded, correct author and poem text, sample notice absent on the approved poem, and category filtering working.
- Screenshots and verification results are in `artifacts/client-feedback/`. The preview used a temporary fetch adapter outside application code; the production content loader still serves only published Contentful content.
