import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const output = path.resolve("artifacts/pdf");
const source = await readFile("docs/foundation-progress.html", "utf8");
const screenshots = {
  OWNER_DESKTOP: "desktop/owner-overview.png",
  OWNER_MOBILE: "mobile/owner-overview.png",
  CHECKOUT_REVIEW: "desktop/checkout-review-detail.png",
};
let html = source;
for (const [token, file] of Object.entries(screenshots)) {
  const image = await readFile(path.resolve("artifacts/screenshots", file));
  html = html.replaceAll(
    `{{${token}}}`,
    `data:image/png;base64,${image.toString("base64")}`,
  );
}
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1122, height: 794 },
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  const issues = await page.locator(".page").evaluateAll((pages) =>
    pages.flatMap((page) => {
      const footer = page.querySelector("footer").getBoundingClientRect();
      const bottom = Math.max(
        ...[...page.children]
          .filter((child) => child.tagName !== "FOOTER")
          .map((child) => child.getBoundingClientRect().bottom),
      );
      return page.scrollWidth > 1122 ||
        page.scrollHeight > 794 ||
        bottom > footer.top - 10
        ? [page.id]
        : [];
    }),
  );
  if (issues.length)
    throw new Error(`Progress report layout overflow: ${issues.join(", ")}`);
  await page.pdf({
    path: path.join(output, "Simbiat-Foundation-Progress.pdf"),
    format: "A4",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
  });
  for (const id of ["progress", "owner", "review"])
    await page
      .locator(`#${id}`)
      .screenshot({ path: path.join(output, `foundation-${id}-proof.png`) });
  await writeFile(path.join(output, "Simbiat-Foundation-Progress.html"), html);
  console.log(
    "Foundation progress report: artifacts/pdf/Simbiat-Foundation-Progress.pdf (3 pages; layout checked)",
  );
} finally {
  await browser.close();
}
