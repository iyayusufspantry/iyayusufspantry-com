"""Create the email + meeting progress PDF from verified project records."""
from pathlib import Path
from io import BytesIO
from html import escape
import json

from PIL import Image as PILImage
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf/Simbiat-Email-and-Meeting-Progress-2026-10-24.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont("Body", "C:/Windows/Fonts/calibri.ttf"))
pdfmetrics.registerFont(TTFont("Bold", "C:/Windows/Fonts/calibrib.ttf"))
pdfmetrics.registerFont(TTFont("Light", "C:/Windows/Fonts/calibril.ttf"))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Bold", italic="Body", boldItalic="Bold")

W, H = A4
M, CW = 44, A4[0] - 88
INK, GREEN, MUTED = "#29325f", "#075e4e", "#586760"
PAPER, MINT, LINE, AMBER = "#fcfaf5", "#e7f4ec", "#d9e2d9", "#9b5c10"
styles = {
    "body": ParagraphStyle("Body", fontName="Body", fontSize=10.5, leading=14.5, textColor=colors.HexColor(INK)),
    "small": ParagraphStyle("Small", fontName="Body", fontSize=9, leading=12.2, textColor=colors.HexColor(MUTED)),
    "tiny": ParagraphStyle("Tiny", fontName="Body", fontSize=8, leading=10.5, textColor=colors.HexColor(MUTED)),
    "h2": ParagraphStyle("H2", fontName="Bold", fontSize=15, leading=19, textColor=colors.HexColor(INK)),
    "h3": ParagraphStyle("H3", fontName="Bold", fontSize=11.5, leading=15, textColor=colors.HexColor(GREEN)),
    "table": ParagraphStyle("Table", fontName="Body", fontSize=9.4, leading=12.2, textColor=colors.HexColor(INK)),
    "tablehead": ParagraphStyle("TableHead", fontName="Bold", fontSize=9, leading=12, textColor=colors.white),
}
c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle("Iya Yusuf's Pantry - Email and Meeting Progress Report")
c.setAuthor("Zulzidan")
c.setSubject("Completed work, screenshots, decisions, verification and remaining actions as of 24 October 2026")
c.setCreator("Zulzidan project report")
layout = []
page_no = 0
PAGE_COUNT = 8


def para(text, x, y, width=CW, style="body", gap=8):
    p = Paragraph(text, styles[style])
    _, height = p.wrap(width, H)
    if y - height < 52:
        raise ValueError(f"Text overflows page {page_no}: {text[:70]}")
    p.drawOn(c, x, y - height)
    layout.append({"page": page_no, "top": round(y, 2), "bottom": round(y-height, 2), "text": text[:100]})
    return y - height - gap


def rule(y):
    c.setStrokeColor(colors.HexColor(LINE))
    c.setLineWidth(0.65)
    c.line(M, y, W - M, y)


def page(title, subtitle, label):
    global page_no
    if page_no:
        c.showPage()
    page_no += 1
    c.setFillColor(colors.HexColor(PAPER))
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(colors.HexColor(GREEN))
    c.setFont("Bold", 9)
    c.drawString(M, H - 35, "IYA YUSUF'S PANTRY")
    c.setFont("Body", 8.5)
    c.drawRightString(W-M, H-35, label.upper())
    c.setFillColor(colors.HexColor(INK))
    c.setFont("Light", 29)
    c.drawString(M, H - 82, title)
    y = para(subtitle, M, H-99, style="small", gap=14)
    rule(y)
    rule(42)
    c.setFillColor(colors.HexColor(MUTED))
    c.setFont("Body", 8)
    c.drawString(M, 27, "24 October 2026  |  Email + meeting follow-through  |  Zulzidan")
    c.drawRightString(W-M, 27, f"{page_no} / {PAGE_COUNT}")
    return y - 18


def note(text, y, color=MINT):
    p = Paragraph(text, styles["body"])
    _, height = p.wrap(CW-28, H)
    boxheight = height + 24
    if y-boxheight < 52:
        raise ValueError("Note overflows")
    c.setFillColor(colors.HexColor(color))
    c.roundRect(M, y-boxheight, CW, boxheight, 9, fill=1, stroke=0)
    para(text, M+14, y-12, CW-28, gap=0)
    return y-boxheight-15


def bullet(text, y, width=CW, x=M, gap=6):
    c.setFillColor(colors.HexColor(GREEN))
    c.circle(x+3, y-6, 2, fill=1, stroke=0)
    return para(text, x+13, y, width-13, gap=gap)


def table(headers, rows, widths, y, font="table", highlight=(), vpad=7):
    data = [[Paragraph(escape(h), styles["tablehead"]) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(value), styles[font]) for value in row])
    t = Table(data, colWidths=widths, hAlign="LEFT")
    commands = [
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor(GREEN)),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 9), ("RIGHTPADDING", (0,0), (-1,-1), 9),
        ("TOPPADDING", (0,0), (-1,-1), vpad), ("BOTTOMPADDING", (0,0), (-1,-1), vpad),
        ("LINEBELOW", (0,0), (-1,0), 0.6, colors.HexColor(GREEN)),
    ]
    for index in range(1, len(data)):
        commands.append(("BACKGROUND", (0,index), (-1,index), colors.HexColor(MINT if index-1 in highlight else ("#ffffff" if index % 2 else "#f1f3ed"))))
        commands.append(("LINEBELOW", (0,index), (-1,index), 0.35, colors.HexColor(LINE)))
    t.setStyle(TableStyle(commands))
    _, height = t.wrap(CW, H)
    if y-height < 52:
        raise ValueError(f"Table overflows page {page_no}: height={height}, y={y}")
    t.drawOn(c, M, y-height)
    layout.append({"page": page_no, "top":y, "bottom":y-height, "tableRows":len(rows)})
    return y-height-14


def picture(path, x, top, width, height=None, crop=None):
    img = PILImage.open(ROOT/path)
    if crop:
        img = img.crop(crop)
    iw, ih = img.size
    if height is None:
        height = width * ih / iw
    if top-height < 52:
        raise ValueError(f"Image overflows page {page_no}")
    c.drawImage(ImageReader(img), x, top-height, width=width, height=height, preserveAspectRatio=True, anchor="n", mask="auto")
    return top-height


# 1 - Overview and complete delivered-work ledger.
y = page("Email + meeting progress", "Work completed from Simbiat's email, five supplied images and the 1:48:34 meeting transcript.", "Progress report")
y = note("<b>Current position:</b> the two banner assets and their CMS bindings are published. The application changes are implemented and tested locally, with deployment still outstanding. Stock is documented, not applied to inventory.", y)
y = para("What has been completed", M, y, style="h2")
rows = [
    ("Community stories", "Compact cards, full-story reader, title/author search and six cards per page.", "Local / tested"),
    ("Ingredient searches", "Selected unfamiliar ingredient names link to Google without rewriting label or allergen text.", "Local / tested"),
    ("Homepage covers", "Food collage for Community Stories; Pantry People cap for Merch. Editable through Contentful.", "CMS published;<br/>app local"),
    ("Starting stock", "Mapped 20 units per size for egusi, ogbono and palm oil; all other approved products retain 50.", "Intake validated"),
    ("Client decisions", "Recorded co-ownership, IRS-document readiness, accepted 4 PM time and mailbox funding arrangement.", "Recorded"),
    ("Recipe direction", "Reconciled the later meeting decision: record content first; paid recipe products remain on hold.", "Recorded"),
    ("Correspondence", "Prepared an updated reply covering allocations, email-plan checks, funding and website revisions.", "Draft / unsent"),
    ("Verification", "Production build, TypeScript, targeted lint/format checks and 36 selected checks passed.", "Passed"),
]
y = table(["Workstream", "Completed result", "Status"], rows, [100, 308, CW-408], y)
y = para("Reading this report", M, y, style="h3")
y = para("Screenshots are local browser previews. CMS publication is distinct from deploying the website application. Account discussions in the meeting are recorded as client context, not completed Stripe or mailbox work by the agent.", M, y)
para("Prepared 24 October 2026, Asia/Makassar. This is the intake/report date; the original email and recording dates have not been established.", M, y, style="small")

# 2 - User experience implementation, with actual local screenshots.
y = page("Community story previews", "The email and meeting both request a compact alternative to full-text story listings.", "Website changes")
y = para("01 / Community stories", M, y, style="h2")
y = para("<b>Request:</b> headings or short previews should replace full bodies in the listing (meeting 01:35:00-01:35:50; also repeated in the email).", M, y)
y = para("<b>Delivered:</b> short cards with a Read story button; a scrollable full-text dialog; search by title or author; and six-card pagination. Published submissions and approved CMS stories use the same layout. Keyboard dismissal restores focus; submission moderation and private email handling remain in place.", M, y)
image_top = y-3
left_x, right_x = M+45, M+282
picture("artifacts/meeting-2026-10-24/story-cards-mobile.png", left_x, image_top, 190, 356, crop=(0,300,390,1031))
picture("artifacts/meeting-2026-10-24/story-open-mobile.png", right_x, image_top, 190, 356, crop=(0,0,390,731))
y = image_top-366
para("Compact preview cards", left_x, y, 190, "small")
para("Full story on demand", right_x, y, 190, "small")
y -= 30
y = note("<b>Local browser previews:</b> readers see a short excerpt first and open the complete story only when they choose. Existing approved editorial stories retain their article-page links.", y)
para("Additional fixture checks cover pagination, author search, long stories, keyboard focus and escaped submitted text. Application deployment is still outstanding.", M, y, style="small")

# 3 - Ingredient links, with focused screenshots from the actual local product pages.
y = page("Ingredient search links", "02 / Ingredient search links - actual local screenshots added to this report.", "Website changes")
y = para("<b>Request:</b> help customers identify unfamiliar ingredients without replacing the supplied ingredient list (meeting 00:59:35-01:03:29).", M, y)
y = bullet("Added small search icons and Google links for selected names such as tiger nuts, nutmeg, cloves and specialty pepper-soup ingredients. Links open in a new tab with accessible labels.", y)
y = bullet("Kept the original ingredient wording and separate allergen statements. Water and sugar remain plain text; existing product-level Learn more links remain.", y)
y -= 8
column_width = (CW - 24) / 2
para("Tiger Nut Drink", M, y, column_width, "h3")
para("Chin Chin", M + column_width + 24, y, column_width, "h3")
image_top = y - 25
bottom1 = picture("artifacts/client-feedback-2026-10-24/ingredient-links-tiger-nut-drink.png", M, image_top, column_width)
bottom2 = picture("artifacts/client-feedback-2026-10-24/ingredient-links-classic-chin-chin.png", M + column_width + 24, image_top, column_width)
y = min(bottom1, bottom2) - 14
y = para("Actual product-details sections captured at a 390-pixel browser width. These are focused local screenshots, not mockups.", M, y, style="small", gap=14)
y = note("<b>Visible in the screenshots:</b> green underlined ingredient names with a small magnifying-glass icon. Tiger nuts, ginger, cloves, cinnamon and nutmeg are linked. Water and sugar remain plain text; the Chin Chin <b>Contains milk.</b> statement is preserved.", y)
y = para("Verified link behavior", M, y, style="h2")
y = para("The tiger nuts link points to Google's search for <b>tiger nuts ingredient</b> and opens in a new tab. The captured Chin Chin section includes the nutmeg link and unchanged allergen statement.", M, y)
y = para("Local pages: /shop/tiger-nut-drink and /shop/classic-chin-chin. Screenshot capture rechecked the tiger nuts destination, the new-tab target and the visible milk-allergen statement.", M, y, style="small")
para("QR codes were discussed, but none were generated: Simbiat said she can create them herself. Ingredient links remain local pending application deployment.", M, y, style="small")

# 4 - Cover art, desktop and mobile visual evidence.
y = page("The two requested covers", "All five supplied files were inspected: three reference screenshots and two cover images.", "Email images")
y = para("Community Stories", M, y, style="h2")
y = para("Used the additional food-and-drink collage from the supplied folder for the community highlight. The existing article/author image and /stories destination remain intact.", M, y)
y = picture("artifacts/client-feedback-2026-10-24/community-desktop.png", M, y-2, CW)-17
y = para("Merch", M, y, style="h2")
y = para("Used the olive-green Pantry People cap for the Merch highlight. Its destination remains the Merch category. The image does not create a priced product listing.", M, y)
y = picture("artifacts/client-feedback-2026-10-24/merch-desktop.png", M, y-2, CW)-17
mobile_top=y
bottom1=picture("artifacts/client-feedback-2026-10-24/community-mobile.png", M+48, mobile_top, 165)
bottom2=picture("artifacts/client-feedback-2026-10-24/merch-mobile.png", M+294, mobile_top, 165)
y=min(bottom1,bottom2)-12
y=para("Local desktop and mobile previews at 1440 and 390 pixels. The original source images were not modified.", M, y, style="small")
y=note("<b>Published in Contentful:</b> two optional image fields, two assets and their site-settings bindings. The homepage reads these fields locally. The existing public application still needs deployment to display them.", y)
para("Backups and version checks protected other settings/locales and editor drafts. A repeat CMS preview reports no new fields, uploads or reference changes remaining.", M, y, style="small")

# 5 - Full stock intake. Source values are pulled from the current JSON snapshot.
stock = json.loads((ROOT/"docs/starting-stock-2026-10-24.json").read_text(encoding="utf-8"))
revised = ["ground-egusi", "ogbono", "palm-oil"]
products = sorted(stock["products"], key=lambda p: (p["slug"] not in revised, revised.index(p["slug"]) if p["slug"] in revised else p["name"].lower()))
total = sum(p["startingQuantity"] for p in products)
variant_count = sum(len(p["variantAllocations"]) for p in products)
assert (len(products),variant_count,total,stock["appliedToInventory"]) == (21,24,1020,False)
y = page("Starting stock recorded", "The email resolves the size-allocation question and supersedes the earlier total for three products.", "Stock intake")
y=para("<b>Latest instruction:</b> 20 of each active size for egusi, ogbono and palm oil = <b>40 units per product</b>. The other 18 approved products retain 50 each.", M, y)
rows=[]
for p in products:
    allocations=p["variantAllocations"]
    sizes="<br/>".join(escape(a["size"])+f" - {a['startingQuantity']} units" for a in allocations)
    if len(allocations)==1:
        sizes="One active variant - 50 units"
    rows.append([escape(p["name"]), sizes, str(p["startingQuantity"])])
y=table(["Product", "Recorded allocation", "Total"],rows,[209,235,CW-444],y,highlight=range(3),vpad=5)
y=para(f"<b>{len(products)} products / {variant_count} active variants / {total:,} units.</b> Allocations were checked against published active variant IDs. Sample Dried Ugu and inactive legacy variants remain excluded.", M, y, style="small")
para("No live or sandbox inventory was changed or reset. The snapshot is ready for a separate live-inventory setup; earlier stock records remain historical.", M, y, style="small")

# 6 - Reconciled client decisions, including changes of direction.
y = page("Decisions reconciled", "The email answers open questions; later meeting decisions govern changes of direction.", "Client context")
rows = [
    ("Ownership + IRS", "Email: the LLC is co-owned by Simbiat and her mother; IRS documentation and a tax ID are available. Meeting: ownership is reported as 50/50. No private numbers were collected."),
    ("Accepted time", "Recorded acceptance of 4 PM Central Time. The email does not establish a new appointment date; no event was created. The older proposal referenced October 23."),
    ("Business mailbox", "Recorded permission for the developer to purchase with client funding. Verify the existing Hostinger plan, agree the total/term/renewal cost, then obtain the subscription payment before ordering."),
    ("Stripe progress", "Recorded the onboarding and identity-review discussion. Separate developer access, final capabilities, payout setup and live checkout were not independently verified. Current code remains sandbox-only."),
    ("Recipes", "Earlier paid-PDF/printed-recipe ideas were reconciled with the later decision at 01:33:14-01:33:50: build preparation videos/photos first and defer a paid recipe product. No paid recipe or fixed print price was created."),
    ("Social media", "Recorded interest in a reasonably priced proposal after website readiness. Simbiat will consider scripts and filming for your editing, with partial creative control. No retainer, posting permission or price was agreed."),
    ("Identity + history", "Kept the approved logo/colors and existing content. Family retail history and feedback on photography/logo quality were recorded as context; no rebrand or About-page rewrite was undertaken."),
]
y=table(["Topic", "Recorded outcome"],rows,[108,CW-108],y)
y=para("Correspondence and project records",M,y,style="h2")
y=para("Prepared a new unsent reply (page 8). Updated the README, client context, launch settings, development log and historical-draft notices so the answered ownership, stock and time questions are not repeated.",M,y)
para("The email-plan guidance directs the client to Hostinger's Emails section and the plan name for the domain. No Hostinger account entitlement, current subscription price, payment receipt or active inbox was verified.",M,y,style="small")

# 7 - Evidence, tests, unfinished actions, and traceable sources.
y=page("Checks and remaining work", "Verification reflects the completed work recorded in this development session.", "Handoff")
y=para("Verification completed",M,y,style="h2")
for text in [
    "Production build and TypeScript passed; targeted ESLint, formatting and whitespace checks passed.",
    "All 36 selected desktop/mobile checks passed across client feedback, Contentful mapping and meeting revisions. They include cover images/destinations, optional-image fallback, existing reading/photo controls, ingredient links and story readers.",
    "An eight-story fixture verified six/two-card pagination, author search, search reset, long-text scrolling, escaped submitted text and focus restoration at 1440 and 390 pixels. Layout checks also covered 320 and 2560 pixels.",
    "Banner and story screenshots were visually inspected. All 21 products, 24 active variants and the 1,020-unit intake total were validated. CMS repeat preview reports no pending cover changes.",
]:
    y=bullet(text,y,gap=5)
y=para("These are selected checks, not a full production acceptance test. The earlier 14-check run is included in the development history; it is not added to 36 as a separate final total.",M,y,style="small",gap=12)
y=para("Remaining homework",M,y,style="h2")
for text in [
    "<b>Zul:</b> deploy the tested application updates and verify the public story cards, ingredient links and banner covers.",
    "<b>Zul:</b> check the brother's story in the owner review queue. Receipt and moderation remain unverified. Obtain cap pricing, sizes and stock only if a saleable listing is wanted.",
    "<b>Zul + Simbiat:</b> finish Stripe access/configuration, live-payment acceptance, inventory initialization and final shipping/tax/policy decisions.",
    "<b>Zul + Simbiat:</b> confirm/fund the mailbox plan, create the inbox and test incoming messages/replies before changing website email destinations.",
    "<b>Simbiat:</b> record preparation videos/photos. <b>Zul:</b> prepare the social-media proposal after website readiness. Recheck the meeting date before any scheduling action or time acknowledgment.",
]:
    y=bullet(text,y,gap=5)
y=para("Source and evidence index",M,y,style="h2")
sources=[
    "User-supplied email, five local images, and 1:48:34 meeting transcript; original sent/recording dates unverified.",
    "Records: docs/client-feedback-2026-10-24.md; docs/client-meeting-2026-10-24.md.<br/>Allocations: docs/starting-stock-2026-10-24.json. Reply: docs/simbiat-october-24-reply.md.",
    "Evidence: artifacts/client-feedback-2026-10-24/ and artifacts/meeting-2026-10-24/. These folders contain screenshots, the CMS plan/backups and fixture results.",
    'Mailbox reference: <link href="https://www.hostinger.com/support/5832752-how-to-check-the-email-service-included-in-your-hosting-plan-at-hostinger/" color="#075e4e">Hostinger: checking the email service included in a hosting plan</link> (reviewed 24 October 2026).',
]
for text in sources:
    y=para(text,M,y,style="tiny",gap=5)

# 8 - Exact practical reply with a historical-timing note.
y=page("Prepared reply", "Draft only. This message has not been sent.", "Correspondence")
y=note("<b>Before sending:</b> check whether the 4 PM acknowledgment is still timely and update the deployment wording after publication. The original email date is unverified, and the earlier proposal referred to October 23.",y)
reply=[
    "Hi Simbiat,",
    "Thank you for confirming these details and sending the pictures.",
    "I've noted that you and your mom co-own the LLC and that you have the IRS documentation ready. Any tax, identity or bank details can be entered directly into Stripe when needed.",
    "I've also recorded 20 units of each size for egusi, ogbono and palm oil. That makes 40 units of each of those products in total.",
    "To check the email plan, log in to Hostinger, open <b>Emails</b> in the sidebar, and look for <b>iyayusufspantry.com</b>. Check the plan name shown for that domain. If no email service is listed, we'll check whether your account has an included service available before buying a plan. <link href='https://www.hostinger.com/support/5832752-how-to-check-the-email-service-included-in-your-hosting-plan-at-hostinger/' color='#075e4e'>Hostinger's guide explains where to look.</link>",
    "I'm happy to arrange the purchase. Once I've confirmed the total price, billing period and renewal cost with you, you can send the subscription payment and I'll place the order. Then I'll set up <b>info@iyayusufspantry.com</b> and test incoming mail and replies.",
    "I've noted your acceptance of 4 PM Central Time.",
    "For community stories, I've prepared short preview cards with a Read story button, so readers can open the full story without scrolling through every story first. They can also search by title or name. I'll use the supplied food collage for the community banner and the Pantry People cap for the Merch banner. These website changes are being checked locally before deployment.",
    "Best,<br/>Zul",
]
for text in reply:
    y=para(text,M,y,gap=11)
rule(y-1)
y-=17
para("Scope of this report: no application deployment, inventory mutation, Stripe/account submission, mailbox/DNS change, subscription purchase, calendar booking or external message was performed during these revisions. CMS cover publication is complete.",M,y,style="small")

assert page_no == PAGE_COUNT
c.save()
proof=ROOT/"tmp/pdfs/client-progress-2026-10-24"
proof.mkdir(parents=True,exist_ok=True)
(proof/"layout.json").write_text(json.dumps(layout,indent=2),encoding="utf-8")
print(json.dumps({"pdf":str(OUT),"pages":page_no,"bytes":OUT.stat().st_size,"products":len(products),"variants":variant_count,"units":total},indent=2))
