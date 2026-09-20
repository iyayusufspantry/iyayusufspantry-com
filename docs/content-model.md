# Content and product intake

This is the proposed content structure for the client-owned Contentful setup. It is a schema plan, not a connected CMS or an executed migration. It stays within the proposal: up to 15 products, five categories, six variants per product, six recipes, and five initial posts.

## Content records

| Record              | Required fields                                                                                                                                   | Relationships / validation                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Site settings (one) | Business name, logo, contact email, brand colors, approved fonts                                                                                  | Logo alt text; optional WhatsApp; domain added when chosen                             |
| Category            | Stable ID, name, slug, description                                                                                                                | Unique slug; referenced by products                                                    |
| Product             | Stable ID, name, slug, description, category, pack information, ingredients, allergens, storage/preparation instructions, approved dietary claims | Ordered photos with alt text; related recipe references; draft until approved          |
| Product variant     | Immutable ID/SKU, product reference, size/option labels, price in cents, currency USD, active flag                                                | Up to six per product; unique SKU/option combination; no runtime size-price multiplier |
| Recipe              | Title, slug, summary, ingredients with quantities, steps, servings, prep/cook times, image/alt, category                                          | Related product references; client reviews quantities and preparation instructions     |
| Article             | Title, slug, summary, body, publication date, image/alt, category                                                                                 | Related products/articles; author only if approved                                     |
| Policy              | Policy kind, title, body, effective date                                                                                                          | Shipping, returns, privacy, terms; client-supplied approved text                       |
| About page          | Headline, business story, approved sourcing claims, photos/alt                                                                                    | Existing narrative remains draft until client confirms facts                           |

Rich text and images will need an explicit renderer/mapping when connected; CMS responses must not be blindly treated as the existing TypeScript objects. Validate incoming slugs, references, prices, currency, allowed media, and publication state on the server. Credentials stay server-side. Stock and orders belong in transactional storage (see the foundation architecture), not in editorial content.

## Product handoff

Use [product-intake.csv](product-intake.csv), one row per saleable variant. Shared product fields can repeat for variants. `price_usd` and `initial_stock` are blank for the client to fill; examples are format guidance only. Convert an approved dollar price to integer cents during import with decimal validation; do not copy sample prices or estimate stock. Photo fields can contain filenames or client-approved asset links. The template is for collection and manual review; no automatic importer is implemented yet.

Check before import:

- Product, category, SKU, size/option, weight/pack, final price, and starting stock all match client approval.
- Photos belong to the business or have permission for use; add meaningful alt text.
- Ingredients, allergens, dietary suitability, origin and storage claims are supplied/approved by the client.
- Shipping restrictions and any product-specific handling requirements are recorded.
- Every active variant has a stable ID and explicit price; hidden/draft products cannot be purchased.

## Pending materials and account handoff

| Material/access                               | State at milestone 01                              | Needed for                                      |
| --------------------------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| Initial installment                           | Received, per project owner                        | Work has started                                |
| Logo, colors, fonts                           | Awaiting client                                    | Final styling                                   |
| Domain and registrar                          | Awaiting client                                    | Domain connection and canonical URLs            |
| Product copy, prices, variants, photos, stock | Awaiting client                                    | Approved catalogue and fulfillment              |
| Recipes/articles/about copy                   | Awaiting client                                    | Replacing editorial samples                     |
| Business Google account                       | Awaiting client; client retains recovery/ownership | Client-controlled service setup and invitations |
| Stripe invitation and verification            | Awaiting client                                    | Test and live payment integration               |
| Shipping destinations/rate and tax settings   | To confirm                                         | Checkout totals and eligibility                 |
| Business contacts and approved policies       | Awaiting client                                    | Contact handling and policy publication         |
| Hosting, CMS, database, email costs           | To confirm before purchase                         | Integration/deployment                          |

Keep account ownership and recovery with the client. Use team invitations or guided setup instead of requesting passwords. Domain, Stripe, and CMS are separate services even when the same business email is used.
