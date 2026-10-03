# October 1: journal photo and community stories

**October 3 recheck:** the community invitation, story page, and enabled shopper form are now live. See [the current request checklist](client-request-recheck-2026-10-03.md) for fresh verification; the rollout notes below record the original intake status.

## Photographs

The three new screenshots in `public/assets/1oktober/` identify the journal's center card, the homepage product cards, and the area below the Kookoo roo koo article. The other files repeat the September 30 supplied photographs.

Published the current assortment photograph (`1790739359352blob.jpg`) on **A pantry that feels like home**, including its alt text. This updates the homepage journal card, journal listing, article hero, and related article cards. `scripts/contentful/october-1.mjs` is a read-only plan by default; `--apply` backs up the original entry, preserves unrelated fields, rejects pending editorial changes, and uses version checks before publishing. The backup is in ignored `artifacts/client-feedback-2026-10-01/`.

Verified the public homepage shows the supplied Chin Chin and African Red Palm Oil photos. Their descriptions, $10 Chin Chin price, $10/$20 oil sizes, galleries, and shared snack container reference were already published in the September 30 update. Product cards now explicitly select the first gallery image by product slug instead of depending on the product's editable name.

## Community stories

- Invitations appear below the homepage journal, on the journal index, and between each article and its related articles.
- `/stories` displays the latest 50 published stories and a submission form with display name, private email, title, story, and required publication consent.
- New submissions are saved as pending. Nothing is automatically published or emailed. The API uses the existing same-origin checks, size limits, honeypot, and persistent rate limits. Retries with an unchanged request ID save once.
- `/owner` includes an independently loaded review queue. Simbiat can filter pending/published/declined stories, publish, unpublish, decline, or return a story to review. Lists paginate in batches of 25. Version checks reject stale reviews. Owner endpoints require the existing verified owner authorization.
- Public queries select only display name, title, story, and ID. Private email and moderation fields never enter public props. Story text renders as text, not HTML. The form explains publication permission, private email use, and how to request removal.

## Rollout

The new application code has **not been deployed**. The journal photo is already published and verified live. The additive story table/index migration has been applied to the configured database with `pnpm operations:setup`, preserving existing data.

Deploy the application and set `STORIES_ENABLED=true` in the hosting environment to activate submissions and owner review. This also requires the existing contact-form configuration (`CONTACT_ENABLED=true`, database, form secret, and owner allowlist). Keep the flag off until deployment is ready. No hosting environment values were changed. The local browser test configuration enables the feature only for its test server.

`/stories` reads publication status on each request so unpublished stories disappear on reload. Existing open browser tabs may retain text already loaded. An unavailable database produces an explicit error; failed submissions preserve entered text for retry.

## Verification

- Production build and TypeScript passed. Generated artifact directories are now excluded from TypeScript compilation, consistent with ESLint and Git ignores; a previous scratch script in `artifacts/` had blocked type checking.
- All 11 operations integration tests passed, including story consent, concurrent retry deduplication, private pending submissions, public field filtering, stale review rejection, publication, unpublication, and decline. Tests use a temporary database schema and remove it afterward.
- Desktop/mobile browser checks passed for product photographs, updated journal photo, article invitation, required consent, retry behavior, submission confirmation, horizontal layout, accessibility, rejection of foreign origins, and unauthenticated review access. Form submissions in these browser tests use mocked responses; persistence/publication is covered separately by the database integration test.
- Browser artifacts are in ignored `artifacts/stories-playwright/`. Existing September 30 files and gallery-test edits were preserved.

## Suggested next content pass

Replace the remaining sample-product and editorial placeholder photos before launch. Ground Egusi and the sourcing-story card still show placeholders; no replacement photos for those were identified in this intake.
