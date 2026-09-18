import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const output = path.resolve("artifacts/pdf");
const logo = await readFile("docs/assets/zulzidan-logo.png");
const source = await readFile("docs/simbiat-initial-estimate.html", "utf8");
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
  if (pages.length !== 3 || overflowing.length) {
    throw new Error(`Estimate layout invalid: ${JSON.stringify(pages)}`);
  }
  const filename = path.join(output, "Simbiat-Initial-Website-Estimate.pdf");
  await page.pdf({
    path: filename,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    outline: true,
  });
  for (const { id } of pages) {
    await page.locator(`#${id}`).screenshot({
      path: path.join(output, `estimate-${id}-proof.png`),
    });
  }
  await writeFile(
    path.join(output, "Simbiat-Initial-Website-Estimate.html"),
    html,
  );
  console.log(
    `${filename}: ${pages.length} pages, ${((await stat(filename)).size / 1024).toFixed(0)} KB; layout checks passed.`,
  );
} finally {
  await browser.close();
}
