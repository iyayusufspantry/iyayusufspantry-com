import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage product cards and journal show the supplied photographs", async ({
  page,
}) => {
  await page.goto("/");
  for (const slug of ["classic-chin-chin", "palm-oil"]) {
    const photo = page
      .locator(`.product-image-link[href='/shop/${slug}'] img`)
      .first();
    await expect(photo).toBeVisible();
    await expect
      .poll(() =>
        photo.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
      )
      .toBe(true);
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
  const form = page.locator("#share-story form");
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
        .include("#share-story")
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
