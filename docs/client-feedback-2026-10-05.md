# October 5 — The People Behind Our Ingredients

Updated the existing **Sourcing stories** article identified by Simbiat's screenshot, retaining `/blog/closer-to-the-source` and its homepage featured placement.

The title is **The People Behind Our Ingredients**. Both supplied paragraphs are published verbatim, including the wording about growing ingredients, direct relationships, fair compensation, traceability and honoring the people behind the harvest. The card summary is **Our story begins with the people who grow our food.** The article is marked approved, dated October 5, 2026, with a one-minute reading time. The existing related-product link and category remain intact.

The photograph remains a **Photo coming soon** placeholder on the homepage card, journal listing and article hero until Simbiat supplies her collage of farmers, fishermen and women. Her attached screenshot is a placement reference.

`node scripts/contentful/october-5-sourcing.mjs` previews the changes; `--apply` backs up the article and its linked paragraphs, preserves unrelated fields and other locales, refuses pending editor changes, and publishes only the saved versions. Both editable paragraph references and the legacy structured/rich-text fields receive the supplied copy. Backups, plans and browser evidence are under ignored `artifacts/client-feedback-2026-10-05-sourcing/`.

This is a Contentful-only update and requires no application deployment. No messages were sent and no payment settings changed.

Verified the live website at 1440px and 390px: the article has the exact title and both supplied paragraphs, the homepage and journal cards show the new title/summary and retain their link, metadata has the new title, all three placements retain the photo placeholder, and the sample-content notice is removed. No horizontal overflow or uncaught browser errors occurred. Script lint, formatting and whitespace checks passed.
