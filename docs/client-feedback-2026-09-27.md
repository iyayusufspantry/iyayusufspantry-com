# Simbiat's September 27 feedback

Implemented in the working tree and saved as Contentful drafts. The live site has not changed.

- Added Drinks as the sixth category, with a glass icon and a balanced category grid. No drink products or prices were invented.
- Made “Experience authentic Nigerian foods.” the main motto. Kept “A taste of home. A world of good food.” as supporting homepage and footer copy.
- Added “Kookoo roo koo,” with Yusuf Sanni's exact supplied poem, author credit, and portrait. Featured it on the homepage and blog index. Approved articles no longer display sample article notices.
- Preserved the logo, colors, existing product inventory, and About story pending Simbiat's text.

## Deployment blocker

Vercel blocked deployment `dpl_8QoJRu3UK4Z7kT22cHNvJWWgmQfK`: “The deployment was blocked because the commit author doesn’t have permission to create deployments for this project.” An authorized project administrator must resolve author access before deploying. No author identity or permission settings were changed.

Deploy the display code first: the existing live category renderer does not support the new `drinks` icon. Then publish the staged Contentful versions:

```powershell
node scripts/contentful/client-feedback.mjs --apply --publish-staged
```

This uses `artifacts/client-feedback/staged.json`, checks every saved version before publishing, and publishes the portrait and linked entries before the homepage reference. Backups and the preview snapshot are in the same ignored artifacts directory. Do not rerun the original import or restore the archived seed over current editorial content.

The optional Author field was added to the article content model. The article, category, portrait, and text changes remain unpublished. The About story is still awaiting the client.

## Verification

- Production build passed against published Contentful content.
- Seven Contentful tests passed, including author, approval status, and article image mapping.
- Changed files passed ESLint and Prettier checks.
- Local preview of the staged content passed desktop (1440px) and mobile (390px) browser checks for homepage, Drinks filter, blog index, and poem page: HTTP 200, no horizontal overflow, no browser errors, portrait images decoded, correct author and poem text, sample notice absent on the approved poem, and category filtering working.
- Screenshots and verification results are in `artifacts/client-feedback/`. The preview used a temporary fetch adapter outside application code; the production content loader still serves only published Contentful content.
