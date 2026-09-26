import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = "https://www.iyayusufspantry.com";
const output = path.resolve("artifacts/pdf");
const captures = path.resolve("artifacts/client-review");
await mkdir(output, { recursive: true });
await mkdir(captures, { recursive: true });
const browser = await chromium.launch();
try {
  let html = await readFile("docs/client-review.html", "utf8");
  for (const [name, route, width, height] of [
    ["HOME", "/", 1440, 1000],
    ["SHOP", "/shop", 1440, 1000],
    ["PRODUCT", "/shop/classic-chin-chin", 390, 960],
    ["RECIPES", "/recipes", 1440, 1000],
    ["BLOG", "/blog", 1440, 1000],
    ["CHECKOUT", "/checkout", 1440, 1000],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const response = await page.goto(origin + route, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    if (!response?.ok()) throw new Error(`${route} did not load`);
    if (name === "CHECKOUT")
      await page.getByRole("button", { name: "Load sample cart" }).click();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images]
          .filter((image) => {
            const rect = image.getBoundingClientRect();
            return rect.top < innerHeight && rect.bottom > 0;
          })
          .map((image) =>
            Promise.race([
              image.decode(),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Visible image timed out")),
                  15000,
                ),
              ),
            ]),
          ),
      );
    });
    // Capture the real initial viewport; the linked website provides the full page.
    const bytes = await page.screenshot({
      path: path.join(captures, `${name.toLowerCase()}.png`),
      animations: "disabled",
    });
    html = html.replaceAll(
      `{{${name}}}`,
      `data:image/png;base64,${bytes.toString("base64")}`,
    );
    console.log(`Captured ${route} at ${width}px`);
    await page.close();
  }
  html = html.replaceAll(
    "{{DATE}}",
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Makassar",
    }).format(new Date()),
  );
  if (/\{\{[A-Z]+\}\}/.test(html)) throw new Error("Unresolved template token");
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
      const rect = page.getBoundingClientRect();
      const footer = page.querySelector("footer").getBoundingClientRect();
      const content = page.querySelector(".content").getBoundingClientRect();
      return page.scrollHeight > rect.height + 1 ||
        page.scrollWidth > rect.width + 1 ||
        content.bottom > footer.top - 12
        ? [page.id]
        : [];
    }),
  );
  if (issues.length)
    throw new Error(`PDF layout overflow: ${issues.join(", ")}`);
  const filename = "Iya-Yusufs-Pantry-Website-Review";
  await page.pdf({
    path: path.join(output, filename + ".pdf"),
    format: "A4",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
  });
  for (const id of ["direction", "shopping", "stories", "review"]) {
    await page
      .locator("#" + id)
      .screenshot({ path: path.join(captures, id + "-proof.png") });
  }
  await writeFile(path.join(output, filename + ".html"), html);
  console.log(`Created ${filename}.pdf — 4 pages; images and layout checked.`);
} finally {
  await browser.close();
}
