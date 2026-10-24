import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("shop sort supports keyboard selection, prices, search and categories", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/shop");
  const sort = page.getByRole("combobox", { name: "Sort products" });
  const cards = page.locator(".product-card");
  const names = cards.locator("h3");
  const originalNames = await names.allTextContents();
  expect(originalNames.length).toBeGreaterThan(1);
  await expect(sort).toHaveAttribute("data-slot", "select-trigger");

  await sort.focus();
  await sort.press("Space");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option").first()).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("option").last()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(sort).toBeFocused();
  await expect(names).toHaveText(
    [...originalNames].sort((a, b) => a.localeCompare(b)),
  );

  for (const direction of ["Low to high", "High to low"]) {
    await sort.click();
    await page.getByRole("option", { name: `Price: ${direction}` }).click();
    const prices = (
      await cards.locator(".product-price").allTextContents()
    ).map((price) => Number(price.replace(/[^\d.]/g, "")));
    expect(prices).toEqual(
      [...prices].sort((a, b) => (direction === "Low to high" ? a - b : b - a)),
    );
  }

  const search = page.getByRole("searchbox", { name: "Search products" });
  await expect(search).toHaveAttribute("data-slot", "input");
  await search.fill(originalNames[0]);
  await expect(names).toHaveText([originalNames[0]]);
  await search.fill("");
  await page.getByRole("button", { name: "Snacks", exact: true }).click();
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBeLessThan(originalNames.length);
  for (const meta of await cards.locator(".product-meta").allTextContents()) {
    expect(meta).toContain("Snacks");
  }
  await search.fill("nothing-matches-this");
  await expect(cards).toHaveCount(0);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(cards).toHaveCount(originalNames.length);
});

test("shop controls fit narrow screens and larger text with an accessible popup", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/shop");
  const sort = page.getByRole("combobox", { name: "Sort products" });
  const toolbar = page.locator(".shop-toolbar");

  for (const size of ["default", "largest"]) {
    await page.evaluate((value) => {
      document.documentElement.setAttribute("data-text-size", value);
    }, size);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await sort.scrollIntoViewIfNeeded();
      const toolbarBounds = await toolbar.boundingBox();
      const sortBounds = await sort.boundingBox();
      expect(sortBounds!.height).toBeGreaterThanOrEqual(44);
      expect(sortBounds!.x).toBeGreaterThanOrEqual(toolbarBounds!.x);
      expect(sortBounds!.x + sortBounds!.width).toBeLessThanOrEqual(
        toolbarBounds!.x + toolbarBounds!.width,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await sort.click();
      const popup = page.getByRole("listbox");
      await expect(popup).toBeVisible();
      const popupBounds = await popup.boundingBox();
      expect(popupBounds!.x).toBeGreaterThanOrEqual(0);
      expect(popupBounds!.x + popupBounds!.width).toBeLessThanOrEqual(width);
      if (width === 390 || width === 1440) {
        await page.screenshot({
          path: `artifacts/shop-controls/${testInfo.project.name}-${width}-${size}-open.png`,
          animations: "disabled",
        });
      }
      await page.keyboard.press("Escape");
      await expect(popup).toBeHidden();
      await expect(sort).toBeFocused();
    }
  }
  await sort.click();
  // Radix hides the background and traps focus while the list is open.
  // Audit the popup itself, then the whole page after it is dismissed.
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => document.activeElement?.closest('[role="listbox"]') !== null,
    ),
  ).toBe(true);
  const popupAccessibility = await new AxeBuilder({ page })
    .include('[data-slot="select-content"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    popupAccessibility.violations.map((violation) => violation.id),
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});
