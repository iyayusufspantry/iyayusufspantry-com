import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("stories keep reading and sharing together, with an optional composer that retains drafts", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/stories");
  const card = page.locator('.community-story-card[data-featured="true"]');
  await expect(card.locator("img")).toBeVisible();
  await expect(page.locator(".story-submission-form")).toHaveCount(0);
  for (const width of [320, 390, 768, 1440, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const cardBounds = await card.boundingBox();
    const collectionBounds = await page
      .locator(".stories-collection")
      .boundingBox();
    expect(cardBounds!.width).toBeGreaterThan(collectionBounds!.width * 0.95);
    if (width === 390 || width === 1440 || width === 2560) {
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.locator("img").evaluateAll(async (images) => {
        await Promise.all(
          images.map(async (image) => {
            if (image instanceof HTMLImageElement) {
              await image.decode();
            }
          }),
        );
      });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `artifacts/stories-ux/${testInfo.project.name}-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
  }
  await page.setViewportSize(testInfo.project.use.viewport!);
  const heroShare = page.locator(".page-heading").getByRole("button", {
    name: "Share your story",
    exact: true,
  });
  await heroShare.focus();
  await heroShare.press("Enter");
  const composer = page.getByRole("dialog", {
    name: "Share your story",
    exact: true,
  });
  await expect(composer).toBeVisible();
  await expect(
    composer.getByRole("heading", { name: "Share your story", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(composer).toBeHidden();
  await expect(heroShare).toBeFocused();
  await expect(page).not.toHaveURL(/#share-story$/);

  const invite = page
    .locator(".story-contribute")
    .getByRole("button", { name: "Share your story" });
  await invite.click();
  await composer
    .getByLabel("Display name", { exact: true })
    .fill("A pantry reader");
  await composer.getByLabel("Story title").fill("Sunday in the kitchen");
  await composer.getByRole("checkbox").check();
  await page.keyboard.press("Escape");
  await expect(composer).toBeHidden();
  await expect(invite).toBeFocused();
  await invite.click();
  await expect(composer.getByLabel("Story title")).toHaveValue(
    "Sunday in the kitchen",
  );
  await expect(
    composer.getByLabel("Display name", { exact: true }),
  ).toHaveValue("A pantry reader");
  await expect(composer.getByRole("checkbox")).toBeChecked();
  await page.evaluate(
    () => (document.documentElement.dataset.textSize = "largest"),
  );
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const bounds = await composer.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.height).toBeLessThanOrEqual(844);
    expect(
      await composer.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    if (width === 390 || width === 1440) {
      await page.screenshot({
        path: `artifacts/stories-ux/${testInfo.project.name}-${width}-composer.png`,
        animations: "disabled",
      });
    }
  }
  expect(
    (
      await new AxeBuilder({ page })
        .include(".story-composer-dialog")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(composer).toBeHidden();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test("homepage product cards and journal show the supplied photographs", async ({
  page,
}) => {
  await page.goto("/");
  for (const slug of ["classic-chin-chin", "palm-oil"]) {
    const photo = page
      .locator(`.product-image-link[href='/shop/${slug}'] img`)
      .first();
    await expect(async () => {
      await photo.scrollIntoViewIfNeeded();
      await expect(photo).toBeVisible();
      expect(
        await photo.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      ).toBe(true);
    }).toPass({ timeout: 15000 });
  }
  const journal = page
    .locator(".editorial-card")
    .filter({ hasText: "A pantry that feels like home" });
  await expect(journal.locator("img")).toHaveAttribute(
    "alt",
    "White-lidded jars of Nigerian snacks on a warm stone counter.",
  );
  await page.goto("/blog/kookoo-roo-koo");
  await expect(
    page.getByRole("link", { name: "Share your story", exact: true }),
  ).toHaveAttribute("href", "/stories#share-story");
});

test("story form requires consent, preserves retries, and confirms review rather than publication", async ({
  page,
}) => {
  const sent: Record<string, unknown>[] = [];
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
  await page.goto("/stories#share-story");
  const form = page.locator(".story-submission-form");
  await form
    .getByLabel("Display name", { exact: true })
    .fill("A pantry reader");
  await form.getByLabel("Email address").fill("private@example.com");
  await form.getByLabel("Story title").fill("Sunday snacks");
  await form
    .getByLabel("Your story", { exact: true })
    .fill(
      "Every Sunday we gathered in the kitchen and shared our favorite snacks.",
    );
  const submit = form.getByRole("button", { name: "Send story for review" });
  await submit.click();
  expect(sent).toHaveLength(0);
  await form.getByRole("checkbox").check();
  await submit.click();
  await expect(form.getByRole("alert")).toBeVisible();
  await expect(form.getByLabel("Story title")).toHaveValue("Sunday snacks");
  await submit.click();
  await expect(form.getByRole("status")).toContainText("Simbiat will review");
  expect(sent).toHaveLength(2);
  expect(sent[0].consent).toBe(true);
  expect(sent[0].requestId).toBe(sent[1].requestId);
  await expect(form.getByLabel("Story title")).toBeEmpty();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .include(".story-composer-dialog")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `artifacts/stories-playwright/form-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("story API rejects missing consent and owner review is protected", async ({
  request,
}) => {
  const denied = await request.post("/api/stories", {
    headers: { origin: "http://localhost:3105" },
    data: { consent: false },
  });
  expect(denied.status()).toBe(400);
  const foreign = await request.post("/api/stories", {
    headers: { origin: "https://example.com" },
    data: {},
  });
  expect(foreign.status()).toBe(403);
  for (const method of ["get", "post"] as const) {
    const response = await request[method]("/api/owner/stories", {
      headers: { origin: "http://localhost:3105" },
    });
    expect(response.status()).toBe(401);
  }
});
