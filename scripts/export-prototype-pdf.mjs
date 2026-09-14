import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

// PDFs use the reviewed screenshots, never a live customer/session or external service.
// Refresh screenshots with `npm run screenshots` before exporting revised UI.
const output = path.resolve("artifacts/pdf");
const screenshotRoot = path.resolve("artifacts/screenshots");
const screens = [
  [
    "Homepage",
    "home",
    "/",
    "Introduce the business, collections, recipes, and stories.",
  ],
  [
    "Product catalog",
    "shop",
    "/shop",
    "Browse 15 sample products with category filters, search, and sorting.",
  ],
  [
    "Product detail",
    "shop-plantain-chips",
    "/shop/plantain-chips",
    "Review a product, choose options, set quantity, and add it to the bag.",
  ],
  [
    "Shopping bag",
    "cart",
    "/cart",
    "Review selected variants, change quantities, and see the estimated summary.",
  ],
  [
    "Guest checkout",
    "checkout",
    "/checkout",
    "Preview contact, shipping, delivery, and the proposed payment-provider handoff.",
  ],
  [
    "Order confirmation",
    "order-confirmation",
    "/order-confirmation",
    "Show the sample order summary and the proposed next steps.",
  ],
  [
    "Recipes",
    "recipes",
    "/recipes",
    "Find cooking inspiration through recipe search and category filters.",
  ],
  [
    "Recipe detail",
    "recipes-egusi-greens",
    "/recipes/egusi-greens",
    "Connect ingredients and preparation instructions to relevant products.",
  ],
  [
    "Journal / Blog",
    "blog",
    "/blog",
    "Explore educational articles, ingredient guides, and business stories.",
  ],
  [
    "Article",
    "blog-a-pantry-that-feels-like-home",
    "/blog/a-pantry-that-feels-like-home",
    "Read an editorial story and discover a related product.",
  ],
  [
    "About the business",
    "about",
    "/about",
    "Present the proposed business story, sourcing relationships, and values.",
  ],
  [
    "Contact",
    "contact",
    "/contact",
    "Preview a customer inquiry form, contact channels, and common questions.",
  ],
  [
    "Site search",
    "search",
    "/search",
    "Discover products, recipes, and articles through one local search.",
  ],
  [
    "Project scope",
    "scope",
    "/scope",
    "Review proposed capabilities, assumptions, materials, and open decisions.",
  ],
  [
    "Screen directory",
    "prototype",
    "/prototype",
    "Access every proposed screen and load a sample cart for a walkthrough.",
  ],
  [
    "Shipping information",
    "shipping",
    "/shipping",
    "Show where approved delivery regions, rates, and policies will be explained.",
  ],
  [
    "Privacy placeholder",
    "privacy",
    "/privacy",
    "Reserve space for the client's approved privacy policy.",
  ],
  [
    "Terms placeholder",
    "terms",
    "/terms",
    "Reserve space for approved terms and operating policies.",
  ],
].map(([title, file, route, purpose]) => ({ title, file, route, purpose }));

const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const pageWidth = 1122;
const pageHeight = 793;
const imageWidth = 1026;
const frameHeight = 568;
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: pageWidth, height: pageHeight },
});

try {
  const assets = new Map();
  for (const screen of screens) {
    for (const viewport of ["desktop", "mobile"]) {
      const filename = path.join(
        screenshotRoot,
        viewport,
        `${screen.file}.png`,
      );
      const buffer = await readFile(filename).catch(() => {
        throw new Error(`Missing ${filename}. Run npm run screenshots first.`);
      });
      const data = {
        uri: `data:image/png;base64,${buffer.toString("base64")}`,
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
      };
      assets.set(`${viewport}/${screen.file}`, data);
    }
  }

  // Read screenshot pixels to choose page boundaries between text rows.
  // The source PNGs remain unchanged. A small repeated strip preserves continuity.
  for (const screen of screens) {
    const asset = assets.get(`desktop/${screen.file}`);
    const maxHeight = Math.floor((frameHeight * asset.width) / imageWidth);
    const cuts = await page.evaluate(
      async ({ uri, maxHeight }) => {
        const img = new Image();
        img.src = uri;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(img, 0, 0);
        const pixels = context.getImageData(0, 0, img.width, img.height).data;
        const emptyRow = (y) => {
          let dark = 0;
          for (let x = 60; x < img.width - 60; x += 2) {
            const index = (y * img.width + x) * 4;
            if (pixels[index] + pixels[index + 1] + pixels[index + 2] < 500)
              dark++;
          }
          return dark === 0;
        };
        const pieces = [];
        let top = 0;
        while (top < img.height) {
          let bottom = Math.min(top + maxHeight, img.height);
          if (bottom < img.height) {
            for (
              let candidate = bottom - 1;
              candidate > bottom - 140;
              candidate--
            ) {
              if (
                emptyRow(candidate - 2) &&
                emptyRow(candidate - 1) &&
                emptyRow(candidate) &&
                emptyRow(candidate + 1)
              ) {
                bottom = candidate;
                break;
              }
            }
          }
          pieces.push({ top, bottom });
          if (bottom === img.height) break;
          top = bottom - 20;
        }
        return pieces;
      },
      { uri: asset.uri, maxHeight },
    );
    asset.cuts = cuts;
  }

  const styles = `
    @page{size:A4 landscape;margin:0}*{box-sizing:border-box}html,body{margin:0;background:white;color:#242424;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{width:${pageWidth}px;height:${pageHeight}px;padding:30px 48px 28px;position:relative;overflow:hidden;break-after:page}.page:last-child{break-after:auto}
    .mast{height:31px;display:flex;justify-content:space-between;align-items:start;border-bottom:1px solid #ddd;font-size:10px;color:#656565;letter-spacing:.3px}.brand{font-size:20px;letter-spacing:-1px;font-weight:600;color:#242424}.pill{border:1px solid #d5d5d0;padding:5px 9px;border-radius:4px;background:#fafaf8;font-size:8px;letter-spacing:.6px;text-transform:uppercase}
    .screen-heading{height:100px;padding-top:16px}.screen-heading .row{display:flex;align-items:baseline;justify-content:space-between;gap:20px}h1,h2,h3,p{margin:0}h1{font-size:25px;font-weight:500;letter-spacing:-.7px}h2{font-size:28px;font-weight:500;letter-spacing:-.8px}code{font-size:9px;color:#666}.purpose{font-size:11px;color:#666;margin-top:8px;line-height:1.6}.slice-label{display:block;color:#727272;font-size:9px;margin-top:8px}
    .frame{position:relative;width:${imageWidth}px;height:${frameHeight}px;border:1px solid #dcdcd7;border-radius:4px;overflow:hidden;background:white}.frame img{position:absolute;left:0;display:block;width:100%;max-width:none}.footer{position:absolute;bottom:21px;left:48px;right:48px;border-top:1px solid #ddd;padding-top:10px;display:flex;justify-content:space-between;font-size:8px;color:#666}.footer a{color:#666;text-decoration:none}
    .cover{background:#f5f5f1}.cover-title{font-size:65px;line-height:1.07;font-weight:500;letter-spacing:-2.8px;max-width:750px;margin-top:83px}.cover-title span{color:#73736c;display:block}.eyebrow{font-size:10px;letter-spacing:1.7px;color:#666;text-transform:uppercase}.cover .eyebrow{margin-top:37px}.cover-sub{font-size:17px;line-height:1.8;max-width:670px;color:#60605b;margin-top:24px}.cover-bottom{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:43px;border-top:1px solid #d5d5cf;padding-top:24px}.cover-bottom h2{font-size:15px;letter-spacing:0;margin-bottom:9px}.cover-bottom p{font-size:12px;line-height:1.85;color:#666}.cover-meta{font-size:10px;color:#666;margin-top:20px}
    .index-title{margin-top:27px}.index-copy{font-size:12px;color:#666;line-height:1.8;margin-top:12px}.index-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:48px;margin-top:22px}.index-item{display:flex;align-items:baseline;gap:13px;border-bottom:1px solid #e4e4df;padding:7px 0;text-decoration:none;color:inherit}.index-no{font-size:9px;color:#777}.index-item strong{font-size:12px;font-weight:500}.index-item small{font-size:9px;color:#777;display:block;margin-top:5px}.page-ref{font-size:11px;margin-left:auto}.note{background:#f5f5f1;border:1px solid #e2e2dc;border-radius:5px;padding:18px 20px;font-size:11px;line-height:1.8;color:#666;margin-top:22px}
    .phones{display:grid;grid-template-columns:repeat(3,1fr);gap:48px;padding:3px 43px}.phone-card h2{font-size:16px;margin-bottom:9px;letter-spacing:-.3px}.phone{height:516px;width:238px;border:1px solid #d4d4ce;border-radius:12px;overflow:hidden;background:white;position:relative}.phone img{position:absolute;top:0;width:100%;height:auto}.phone-card p{font-size:9px;color:#666;line-height:1.7;margin-top:10px;width:240px}
  `;
  function footer(number, total, kind) {
    return `<footer class="footer"><a href="#index">SIMBIAT · ${kind} · Project Scope Prototype</a><span>Visual review only · No real orders or payments</span><span>${number} / ${total}</span></footer>`;
  }
  function mast(label = "Visual scope · Client review") {
    return `<header class="mast"><span class="brand">simbiat.</span><span>${label}</span><span class="pill">Project Scope Prototype</span></header>`;
  }
  function cover(kind, number, total) {
    return `<section class="page cover" id="cover">${mast()}<div class="eyebrow">Prepared for Simbiat · Scope discussion</div><h1 class="cover-title">A taste of what’s next.<span>The website prototype.</span></h1><p class="cover-sub">${kind === "Visual overview" ? "A visual companion to the proposed project scope. Explore the pages, customer journey, and proposed experience before final pricing." : "The complete desktop screen reference. Long layouts continue across consecutive pages so every captured section can be reviewed at a readable size."}</p><div class="cover-bottom"><div><h2>${kind}</h2><p>18 proposed screens · Guest shopping flow<br>${kind === "Visual overview" ? "Selected mobile previews · Payment detail" : "Full desktop layouts · Paginated continuations"}</p></div><div><h2>For discussion, not final approval</h2><p>Photography, wording, products, prices, colors, features, and integrations are illustrative and subject to confirmation. No real orders or payments are processed.</p></div></div><p class="cover-meta">Read alongside the written scope. Final scope, timeline, and pricing follow confirmation.</p>${footer(number, total, kind)}</section>`;
  }
  function screenPage(
    screen,
    cut,
    part,
    count,
    number,
    total,
    kind,
    anchor = screen.file,
  ) {
    const asset = assets.get(`desktop/${screen.file}`);
    const scale = imageWidth / asset.width;
    const label =
      kind === "Visual overview"
        ? part === "payment"
          ? "Payment area · Lower-page excerpt"
          : "Opening view · Complete layout in the companion reference PDF"
        : `Desktop layout · Part ${part + 1} of ${count}${part > 0 ? " · Small overlap retained for continuity" : ""}`;
    const height = Math.min(frameHeight, (cut.bottom - cut.top) * scale);
    return `<section class="page" id="${anchor}">${mast()}<div class="screen-heading"><div class="row"><h1>${escape(screen.title)}${part === "payment" ? " — payment preview" : ""}</h1><code>${escape(screen.route)}</code></div><p class="purpose">${escape(screen.purpose)}</p><span class="slice-label">${label}</span></div><div class="frame"><img src="${asset.uri}" alt="${escape(screen.title)} screenshot" style="top:${-cut.top * scale}px;clip-path:inset(${cut.top * scale}px 0 ${Math.max(0, asset.height * scale - cut.top * scale - height)}px 0)"></div>${footer(number, total, kind)}</section>`;
  }
  function mobilePage(files, group, number, total, kind) {
    return `<section class="page" id="mobile-${group}">${mast("Responsive experience · Mobile preview")}<div class="screen-heading"><div class="row"><h1>Made for a smaller screen.</h1><code>390 px mobile viewport · ${group} / 2</code></div><p class="purpose">Opening views of the responsive prototype. These are excerpts; pages continue below each viewport.</p></div><div class="phones">${files
      .map((file) => {
        const screen = screens.find((item) => item.file === file);
        const asset = assets.get(`mobile/${file}`);
        return `<article class="phone-card"><h2>${escape(screen.title)}</h2><div class="phone"><img src="${asset.uri}" alt="${escape(screen.title)} mobile opening view"></div><p>${escape(screen.route)}<br>Sample layout · Final content to be confirmed</p></article>`;
      })
      .join("")}</div>${footer(number, total, kind)}</section>`;
  }

  const manifest = [];
  for (const detailed of [false, true]) {
    const kind = detailed ? "Complete screen reference" : "Visual overview";
    const entries = [];
    let number = 3;
    for (const screen of screens) {
      const asset = assets.get(`desktop/${screen.file}`);
      const count = detailed ? asset.cuts.length : 1;
      entries.push({ screen, start: number, count });
      number += count;
    }
    const total = number - 1 + (detailed ? 0 : 3);
    let html = cover(kind, 1, total);
    html += `<section class="page" id="index">${mast()}<h1 class="index-title">A guide to the proposed experience.</h1><p class="index-copy">Select a screen name to jump to its pages. The prototype demonstrates a guest shopping journey:<br><strong>Discover → Browse → Product → Bag → Checkout → Confirmation</strong></p><nav class="index-grid">${entries.map(({ screen, start, count }, index) => `<a class="index-item" href="#${screen.file}"><span class="index-no">${String(index + 1).padStart(2, "0")}</span><span><strong>${escape(screen.title)}</strong><small>${escape(screen.route)}</small></span><span class="page-ref">${start}${count > 1 ? `–${start + count - 1}` : ""}</span></a>`).join("")}</nav><div class="note">${detailed ? "Every desktop screenshot is included from top to bottom. Page continuations repeat a small strip so content at the join remains readable." : `The following pages show the opening view of each proposed screen. Payment detail: page ${number}. Mobile previews: pages ${number + 1}–${number + 2}. The companion complete reference includes every captured desktop section.`}<br>Products, stock, dietary options, prices, and policy copy remain placeholders. Production architecture and providers are not committed.</div>${footer(2, total, kind)}</section>`;
    for (const { screen, start } of entries) {
      const asset = assets.get(`desktop/${screen.file}`);
      const cuts = detailed
        ? asset.cuts
        : [
            {
              top: 0,
              bottom: Math.min(
                asset.height,
                Math.floor((frameHeight * asset.width) / imageWidth),
              ),
            },
          ];
      cuts.forEach((cut, index) => {
        html += screenPage(
          screen,
          cut,
          index,
          cuts.length,
          start + index,
          total,
          kind,
          index === 0 ? screen.file : `${screen.file}-${index + 1}`,
        );
      });
    }
    if (!detailed) {
      const screen = screens.find((screen) => screen.file === "checkout");
      const asset = assets.get("desktop/checkout");
      const top = 970;
      const bottom = Math.min(
        asset.height,
        top + Math.floor((frameHeight * asset.width) / imageWidth),
      );
      html += screenPage(
        screen,
        { top, bottom },
        "payment",
        1,
        number,
        total,
        kind,
        "payment-detail",
      );
      html += mobilePage(
        ["home", "shop", "shop-plantain-chips"],
        1,
        number + 1,
        total,
        kind,
      );
      html += mobilePage(
        ["cart", "checkout", "recipes"],
        2,
        number + 2,
        total,
        kind,
      );
    }
    const filename = detailed
      ? "Simbiat-Prototype-Complete-Reference.pdf"
      : "Simbiat-Visual-Prototype.pdf";
    const htmlDocument = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Simbiat — ${kind}</title><style>${styles}</style></head><body>${html}</body></html>`;
    await page.setContent(htmlDocument, { waitUntil: "load", timeout: 60000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode()));
    });
    const layouts = await page
      .locator(".page")
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          width: node.scrollWidth,
          height: node.scrollHeight,
        })),
      );
    if (
      layouts.some(
        (layout) => layout.width > pageWidth || layout.height > pageHeight,
      )
    )
      throw new Error(
        `PDF page overflow in ${kind}: ${JSON.stringify(layouts.map((layout, index) => ({ ...layout, page: index + 1 })).filter((layout) => layout.width > pageWidth || layout.height > pageHeight))}`,
      );
    await page.pdf({
      path: path.join(output, filename),
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      outline: true,
    });
    await page
      .locator(".page")
      .first()
      .screenshot({
        path: path.join(
          output,
          detailed ? "reference-cover.png" : "overview-cover.png",
        ),
        caret: "initial",
      });
    if (!detailed) {
      for (const id of ["index", "home", "payment-detail", "mobile-1"])
        await page
          .locator(`#${id}`)
          .screenshot({
            path: path.join(output, `${id}-proof.png`),
            caret: "initial",
          });
    }
    const bytes = (await stat(path.join(output, filename))).size;
    manifest.push({
      filename,
      pages: total,
      megabytes: Number((bytes / 1048576).toFixed(2)),
      entries: entries.map(({ screen, start, count }) => ({
        title: screen.title,
        page: start,
        pages: count,
      })),
    });
    console.log(
      `${filename}: ${total} pages, ${(bytes / 1048576).toFixed(2)} MB`,
    );
  }
  await writeFile(
    path.join(output, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
} finally {
  await browser.close();
}
