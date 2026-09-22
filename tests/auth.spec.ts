import { test, expect } from "@playwright/test";

test("account controls open sign-in and sign-up without leaving the store", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open menu" }).click();
  }

  const header = page.locator(".site-header");
  await expect(
    header.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    header.getByRole("button", { name: "Sign up", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await header.getByRole("button", { name: "Sign in", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("input").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await header.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("input").first()).toBeVisible();
  await expect(page).toHaveURL("/");
});

for (const route of ["/sign-in", "/sign-up"]) {
  test(`${route} renders the account form within the viewport`, async ({
    page,
  }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main input").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
