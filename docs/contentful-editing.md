# Editing the website in Contentful

Open [the Contentful space](https://app.contentful.com/spaces/lfm7lmn9p7cr) and select the `master` environment. Website content now uses linked entries and ordinary text fields instead of JSON editors.

## Where to edit

| Change                              | Contentful entry and field                                                                                                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page headings, descriptions, labels | **Website page → Page text**, or **Shared website copy → Shared text**. Open the linked **Website text** entry and edit **Text**.                                                               |
| Policy wording                      | **Policy → Policy sections**. Each linked **Content section** has a **Heading** and **Paragraph**.                                                                                              |
| Blog article body                   | **Journal article → Article sections**. Edit the linked headings and paragraphs.                                                                                                                |
| Menu labels and destinations        | **Navigation menu → Menu links**. Each **Navigation link** has a **Link label** and **Website path**, such as `/shop`.                                                                          |
| Colours                             | **Site settings → Brand colours**. Open the relevant colour and edit **Value**, using a six-digit hex colour such as `#06ad8f`.                                                                 |
| Contact information                 | **Site settings → Contact details**. Open the relevant email, phone, or WhatsApp value. The separate placeholder entry has a checkbox. These displayed details do not configure email delivery. |
| Products, variants, prices, photos  | Existing **Product**, **Product variant**, category, and asset entries.                                                                                                                         |
| Recipes, ingredients and steps      | Existing **Recipe** fields and linked products.                                                                                                                                                 |
| Homepage featured content           | **Website page** for `/`, using featured product, recipe, and article references.                                                                                                               |
| FAQs                                | Existing **Frequently asked question** entries.                                                                                                                                                 |

Reference lists preserve their order. Drag policy sections, article sections, or menu links to reorder them. Add a Content section or Navigation link using the reference field when needed. Reordering Website text does not rearrange the page layout: each text entry is bound to an existing place on the website.

## Publish an edit

1. Open the page, policy, article, menu, or site settings entry.
2. Open the linked item and change its text.
3. **Publish the linked item.** A saved draft does not appear on the website.
4. If you added, removed, or reordered references, **publish the parent entry too**. Publish any new linked entries first.
5. Reload the website to see the updated content. The Contentful webhook refreshes cached pages; a timed refresh is the fallback.

Keep placeholders such as `{0}` unchanged in messages that contain them. Technical binding keys are hidden to avoid accidentally disconnecting text from the page. Existing Website text entries can be edited; a developer should add new bound text positions or change page structure.

Stock, orders, fulfillment and received contact messages remain in the protected owner dashboard. Payments, email delivery settings, shipping/tax calculations, layouts, fonts and new features are not controlled by these content entries.

## Migration and rollback

The reference migration adds four content types: Website text, Content section, Navigation link, and Brand or contact value. Existing JSON and duplicate rich-text fields are retained and hidden from normal editing; they are rollback data, not the editing source. The website supports legacy entries until they are migrated. A schema marker prevents removed/empty references from restoring archived text.

Preview the migration with `npm run contentful:references`; apply with `npm run contentful:references -- --apply`. It reads current remote content, checks for pending editor changes, creates deterministic child IDs, publishes children before parents, and compares the complete mapped website content before and after. Reruns preserve edited migrated content. Backups are saved in ignored `artifacts/contentful/references-before-*.json` files. Do not restore archived seed JSON over client edits.

Run `npm run contentful:test-references` for content preservation, edit/reorder, empty/unpublished reference and URL/type validation checks. The original export/verification tools concern the archived import and are not an editor-content synchronization mechanism.

Contentful reference behaviour follows its [content model documentation](https://www.contentful.com/developers/docs/concepts/data-model/).
