import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage highlights rotate, pause while being read and support manual navigation", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const banner = page.getByRole("region", { name: "Pantry highlights" });
  await expect(banner).toBeVisible();
  await expect(banner.locator(".highlight-position")).toHaveText("1 / 4");
  await page.clock.runFor(5100);
  await expect(banner.locator(".highlight-position")).toHaveText("2 / 4");
  await banner.hover();
  await page.clock.runFor(10000);
  await expect(banner.locator(".highlight-position")).toHaveText("2 / 4");
  await banner.getByRole("button", { name: "Next highlight" }).click();
  await expect(banner.locator(".highlight-position")).toHaveText("3 / 4");
  await expect(
    banner.getByRole("button", { name: "Play highlights" }),
  ).toBeVisible();
  await expect(banner.getByRole("link")).toHaveAttribute("href", "/stories");
  await banner.getByRole("button", { name: "Next highlight" }).click();
  await expect(banner.getByRole("link")).toHaveAttribute(
    "href",
    "/shop?category=merch",
  );
  await banner.getByRole("link").click();
  await expect(
    page.getByRole("heading", { name: "Merch is on the way" }),
  ).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(0);
});

test("reduced motion keeps homepage highlights paused", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  const banner = page.getByRole("region", { name: "Pantry highlights" });
  await expect(
    banner.getByRole("button", { name: "Play highlights" }),
  ).toBeVisible();
  await page.clock.runFor(15000);
  await expect(banner.locator(".highlight-position")).toHaveText("1 / 4");
});

test("product photo enlargement offers zoom, photo navigation and keyboard dismissal", async ({
  page,
}) => {
  await page.goto("/shop/zobo-drink");
  const trigger = page.getByRole("button", {
    name: "Enlarge Zobo Drink photo",
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Zobo Drink" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(dialog.locator("output")).toHaveText("150%");
  expect(
    await dialog
      .locator(".photo-viewer-stage")
      .evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Next enlarged photo" }).click();
  await expect(dialog.locator("output")).toHaveText("100%");
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map((item) => item.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("larger reading text persists across navigation and mobile layouts", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("button", { name: "Reading settings", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Make yourself comfortable",
  });
  await dialog.getByRole("radio", { name: "Largest", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute(
    "data-text-size",
    "largest",
  );
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map((item) => item.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await page.goto("/shop");
  await expect(page.locator("html")).toHaveAttribute(
    "data-text-size",
    "largest",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("the supplied Chin Chin jar displays its corrected jar size and existing price", async ({
  page,
}) => {
  await page.goto("/shop/classic-chin-chin");
  await expect(
    page
      .locator(".product-detail-copy")
      .getByText("16 oz jar", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".product-detail-copy").getByText("$10.00", { exact: true }),
  ).toBeVisible();
});
