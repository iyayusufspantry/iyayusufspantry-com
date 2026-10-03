// Read-only recheck of the supplied September 28–October 2 email requests.
// Cart changes stay in isolated browser tabs. No real stories or orders are sent.
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { setDefaultResultOrder } from "node:dns";
import {
  products as earlyProducts,
  additionalSnacks,
  story as aboutStory,
} from "./contentful/september-29-content.mjs";
import {
  products as middleProducts,
  photos as middlePhotos,
  sharedSnackReferenceSlugs,
} from "./contentful/september-30-content.mjs";
import {
  products as latestProducts,
  photos as latestPhotos,
  story,
} from "./contentful/october-2-content.mjs";

setDefaultResultOrder("ipv4first");
const folder = "artifacts/client-request-recheck-2026-10-03";
await mkdir(folder, { recursive: true });
const report = { checkedAt: new Date().toISOString(), checks: [] };
const products = [
  ...earlyProducts,
  ...additionalSnacks,
  ...middleProducts,
  ...latestProducts,
];
const browser = await chromium.launch();
async function audit(environment, origin, width) {
  const page = await browser.newPage({
    viewport: { width, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  async function check(name, work) {
    try {
      const detail = await work();
      const status = detail?.status === "SKIP" ? "SKIP" : "PASS";
      report.checks.push({ environment, width, name, status, detail });
      console.log(`${status} ${environment} ${width} ${name}`);
    } catch (error) {
      report.checks.push({
        environment,
        width,
        name,
        status: "FAIL",
        detail: error.message.slice(0, 1200),
      });
      console.log(`FAIL ${environment} ${width} ${name}`);
    }
    await writeFile(`${folder}/audit.json`, JSON.stringify(report, null, 2));
  }
  async function visit(path) {
    const response = await page.goto(origin + path, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    if (response) assert.equal(response.status(), 200, path);
    else assert.equal(page.url(), origin + path, "Same-document navigation");
    await expect(page.locator("h1")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  async function photo(locator, alt) {
    await expect(locator).toHaveAttribute("alt", alt);
    await locator.scrollIntoViewIfNeeded();
    await locator.evaluate((img) =>
      Promise.race([
        img.decode(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Image decode timeout")), 15000),
        ),
      ]),
    );
    return { alt, src: await locator.getAttribute("src") };
  }
  async function capture(name, locator = page.locator("main")) {
    await locator.screenshot({
      path: `${folder}/${environment}-${width}-${name}.png`,
      animations: "disabled",
      style: "[data-sonner-toaster] { visibility: hidden; }",
    });
  }
  try {
    await check("Latest banner and three pantry photos", async () => {
      await visit("/");
      const images = [
        await photo(
          page.locator(".hero-visual img"),
          middlePhotos.assortment[1],
        ),
      ];
      for (const role of ["snackJars", "coconut", "drinks"])
        images.push(
          await photo(
            page
              .locator(".pantry-photo-grid")
              .getByAltText(middlePhotos[role][1]),
            middlePhotos[role][1],
          ),
        );
      await capture("homepage", page.locator(".home-hero"));
      return images;
    });
    await check(
      "Visible Chin Chin and African Red Palm Oil homepage photos",
      async () => {
        const images = [];
        for (const [slug, role] of [
          ["classic-chin-chin", "chinChin"],
          ["palm-oil", "palmOil32"],
        ])
          images.push(
            await photo(
              page
                .locator(`.product-image-link[href='/shop/${slug}'] img`)
                .first(),
              middlePhotos[role][1],
            ),
          );
        return images;
      },
    );
    await check("Updated center journal photo", async () => {
      const card = page
        .locator(".editorial-card")
        .filter({ hasText: "A pantry that feels like home" });
      const image = await photo(
        card.locator("img"),
        middlePhotos.assortment[1],
      );
      await capture("center-journal", card);
      return image;
    });
    await check("Homepage egusi soup placeholder photo", async () => {
      const card = page
        .locator(".editorial-card")
        .filter({ hasText: "A comforting bowl of egusi" });
      const image = await photo(
        card.locator("img"),
        "A close-up of a bowl of egusi soup with leafy greens on a stone counter.",
      );
      await capture("egusi-recipe", card);
      return image;
    });
    await check(
      "Footer logo returns to homepage top, including repeated clicks",
      async () => {
        const logo = page.locator("footer .wordmark");
        await logo.scrollIntoViewIfNeeded();
        const href = await logo.getAttribute("href");
        await logo.click();
        await expect
          .poll(() => page.evaluate(() => scrollY), { timeout: 7000 })
          .toBe(0);
        await logo.click();
        await expect
          .poll(() => page.evaluate(() => scrollY), { timeout: 7000 })
          .toBe(0);
        return { href };
      },
    );
    await check("Header logo returns to homepage top", async () => {
      await visit("/");
      await page.evaluate(() => scrollTo(0, 700));
      await page.locator("header .wordmark").click();
      await expect
        .poll(() => page.evaluate(() => scrollY), { timeout: 7000 })
        .toBe(0);
      if (width === 390) {
        await page.locator("button[aria-controls='mobile-menu']").click();
        await expect(page.locator("#mobile-menu")).toBeVisible();
        await page.locator("header .wordmark").click();
        await expect(page.locator("#mobile-menu")).toHaveCount(0);
      }
    });
    await check("Logo returns from shop to homepage top", async () => {
      await visit("/shop");
      await page.locator("footer .wordmark").click();
      await expect(page).toHaveURL(origin + "/#top");
      await expect
        .poll(() => page.evaluate(() => scrollY), { timeout: 7000 })
        .toBe(0);
    });
    await check("Complete four-paragraph About Us story", async () => {
      await visit("/about");
      for (const paragraph of aboutStory)
        await expect(page.locator("main")).toContainText(paragraph);
      await capture("about");
    });
    for (const product of products) {
      await check(
        `${product.name}: supplied copy, photos, size and price`,
        async () => {
          await visit(`/shop/${product.slug}`);
          await expect(page.locator("h1")).toHaveText(product.name);
          await expect(page.locator(".product-detail-copy")).toContainText(
            product.description,
          );
          if (!product.variants || product.variants.length === 1)
            await expect(page.locator(".product-detail-copy")).toContainText(
              product.unit,
            );
          const alts = product.photos.map((p) =>
            Array.isArray(p) ? p[1] : (middlePhotos[p] || latestPhotos[p])[1],
          );
          const references = sharedSnackReferenceSlugs.includes(product.slug)
            ? [middlePhotos.snackReference[1]]
            : [];
          const expectedAlts = [...alts, ...references];
          const thumbnails = page.locator(".gallery-thumbnails button");
          if (expectedAlts.length > 1)
            await expect(thumbnails).toHaveCount(expectedAlts.length);
          for (const [index, alt] of expectedAlts.entries()) {
            if (expectedAlts.length > 1) await thumbnails.nth(index).click();
            await photo(page.locator(".product-main-image img"), alt);
          }
          const variants = product.variants || [
            { size: "16 oz", priceCents: product.priceCents },
          ];
          for (const variant of variants) {
            if (variants.length > 1)
              await page
                .getByRole("button", { name: variant.size, exact: true })
                .click();
            if (variants.length > 1)
              await expect(page.locator(".product-detail-copy")).toContainText(
                variant.size,
              );
            await expect(
              page.locator(".product-detail-copy .text-2xl"),
            ).toHaveText(`$${(variant.priceCents / 100).toFixed(2)}`);
          }
          await capture(product.slug, page.locator(".product-detail-grid"));
          return {
            variants,
            galleryPhotos: expectedAlts.length,
            sharedSnackReference: references.length > 0,
          };
        },
      );
    }
    await check(
      "Complete nine-paragraph community story on journal page",
      async () => {
        await visit(`/blog/${story.slug}`);
        await expect(page.locator("h1")).toHaveText(story.title);
        for (const paragraph of story.paragraphs)
          await expect(page.locator(".article-body")).toContainText(paragraph);
        await capture("journal-story");
      },
    );
    await check(
      "Share-your-story invitation below requested article",
      async () => {
        await visit("/blog/kookoo-roo-koo");
        await expect(
          page.getByRole("link", { name: "Share your story", exact: true }),
        ).toHaveAttribute("href", "/stories#share-story");
      },
    );
    await check("Community story appears on community page", async () => {
      await visit("/stories");
      const article = page
        .locator("article")
        .filter({ has: page.getByRole("heading", { name: story.title }) });
      await expect(article).toBeVisible();
      await expect(article).toContainText("By Simbiat");
      for (const paragraph of story.paragraphs)
        await expect(article).toContainText(paragraph);
      await capture("community-story");
    });
    await check("Shopper story form, consent and retry behavior", async () => {
      await visit("/stories#share-story");
      const form = page.locator("#share-story form");
      await expect(form).toBeVisible();
      await capture("story-form", page.locator("#share-story"));
      const submit = form.getByRole("button", {
        name: "Send story for review",
      });
      if (environment === "local" && (await submit.isDisabled())) {
        await expect(form).toContainText(
          "Story submissions are temporarily unavailable.",
        );
        return {
          status: "SKIP",
          reason:
            "Submissions disabled in local configuration; live activation checked separately.",
        };
      }
      await expect(submit).toBeEnabled();
      const sent = [];
      await page.route("**/api/stories", async (route) => {
        sent.push(route.request().postDataJSON());
        if (sent.length === 1) await route.abort();
        else
          await route.fulfill({
            json: {
              message:
                "Thank you for sharing. Simbiat will review your story before it appears on the website.",
            },
          });
      });
      try {
        await form
          .getByLabel("Display name", { exact: true })
          .fill("Audit reader");
        await form.getByLabel("Email address").fill("audit@example.com");
        await form.getByLabel("Story title").fill("Audit only — never saved");
        await form
          .getByLabel("Your story", { exact: true })
          .fill(
            "This is an intercepted browser check. No story is submitted or saved to the live website.",
          );
        await submit.click();
        assert.equal(sent.length, 0, "Consent is required before submission");
        await form.getByRole("checkbox").check();
        await submit.click();
        await expect(form.getByRole("alert")).toBeVisible();
        await expect(form.getByLabel("Story title")).toHaveValue(
          "Audit only — never saved",
        );
        await submit.click();
        await expect(form.getByRole("status")).toContainText(
          "Simbiat will review your story",
        );
        assert.equal(sent.length, 2);
        assert.equal(sent[0].consent, true);
        assert.equal(sent[0].requestId, sent[1].requestId);
        await expect(form.getByLabel("Story title")).toBeEmpty();
        return {
          enabled: true,
          consentRequired: true,
          retryPreservesInputAndRequestId: true,
          realSubmissions: 0,
        };
      } finally {
        await page.unroute("**/api/stories");
      }
    });
    await check(
      "Owner story-review API rejects unauthenticated access",
      async () => {
        const response = await page.request.get(origin + "/api/owner/stories");
        assert.equal(response.status(), 401);
      },
    );
    await check("Egusi soup photo on recipe listing and detail", async () => {
      for (const route of ["/recipes", "/recipes/egusi-greens"]) {
        await visit(route);
        await photo(
          page
            .getByAltText(
              "A close-up of a bowl of egusi soup with leafy greens on a stone counter.",
            )
            .first(),
          "A close-up of a bowl of egusi soup with leafy greens on a stone counter.",
        );
      }
    });
    await check("No uncaught browser errors", async () =>
      assert.deepEqual(errors, []),
    );
  } finally {
    await page.close();
  }
}
try {
  for (const [environment, origin] of [
    ["live", "https://www.iyayusufspantry.com"],
    ["local", "http://localhost:3106"],
  ])
    await Promise.all(
      [1440, 390].map((width) => audit(environment, origin, width)),
    );
} finally {
  await browser.close();
  report.summary = {
    total: report.checks.length,
    passed: report.checks.filter((c) => c.status === "PASS").length,
    failed: report.checks.filter((c) => c.status === "FAIL").length,
    skipped: report.checks.filter((c) => c.status === "SKIP").length,
  };
  await writeFile(`${folder}/audit.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary));
}
