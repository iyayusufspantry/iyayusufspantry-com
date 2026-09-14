import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const output = path.resolve("artifacts/pdf");
const logo = await readFile("docs/assets/zulzidan-logo.png");
const source = await readFile("docs/simbiat-proposed-scope.html", "utf8");
const html = source.replaceAll(
  "assets/zulzidan-logo.png",
  `data:image/png;base64,${logo.toString("base64")}`,
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 794, height: 1122 },
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  const pages = await page.locator(".page").evaluateAll((nodes) =>
    nodes.map((node) => {
      const footerTop = node
        .querySelector("footer")
        .getBoundingClientRect().top;
      const children = [...node.children].filter(
        (child) => child.tagName !== "FOOTER",
      );
      return {
        id: node.id,
        width: node.scrollWidth,
        height: node.scrollHeight,
        contentBottom: Math.max(
          ...children.map((child) => child.getBoundingClientRect().bottom),
        ),
        footerTop,
      };
    }),
  );
  const overflowing = pages.filter(
    (page) =>
      page.width > 794 ||
      page.height > 1122 ||
      page.contentBottom > page.footerTop - 12,
  );
  if (overflowing.length)
    throw new Error(`Scope layout overflow: ${JSON.stringify(overflowing)}`);
  const filename = path.join(output, "Simbiat-Proposed-Website-Scope.pdf");
  await page.pdf({
    path: filename,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    outline: true,
  });
  for (const id of [
    "overview",
    "storefront",
    "commercial",
    "decisions",
    "review",
  ]) {
    await page
      .locator(`#${id}`)
      .screenshot({
        path: path.join(output, `scope-written-${id}-proof.png`),
        caret: "initial",
      });
  }
  // Portable HTML companion for editing/review without the original logo directory.
  await writeFile(
    path.join(output, "Simbiat-Proposed-Website-Scope.html"),
    html,
  );
  console.log(
    `${filename}: ${pages.length} pages, ${((await stat(filename)).size / 1024).toFixed(0)} KB`,
  );
} finally {
  await browser.close();
}
