import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("contact shows saved confirmation and reuses the request after an uncertain failure", async ({
  page,
}) => {
  const sent: Record<string, unknown>[] = [];
  await page.route("**/api/contact", async (route) => {
    sent.push(route.request().postDataJSON());
    if (sent.length === 1) await route.abort();
    else
      await route.fulfill({
        json: { message: "Thank you. Your message has been received." },
      });
  });
  await page.goto("/contact");
  await page.getByLabel("Name", { exact: true }).fill("Test Customer");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("test@example.com");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Please help with this sample inquiry.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByRole("button", { name: "Send message" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Your message has been received" }),
  ).toBeVisible();
  expect(sent).toHaveLength(2);
  expect(sent[0].requestId).toBe(sent[1].requestId);
  await expect(page.getByLabel("Name", { exact: true })).toBeEmpty();
  expect(
    (
      await new AxeBuilder({ page })
        .include(".contact-form")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test("newsletter requires consent and reports provider errors honestly", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/newsletter", async (route) => {
    calls++;
    expect(route.request().postDataJSON().consent).toBe(true);
    await route.fulfill({
      status: calls === 1 ? 503 : 200,
      json:
        calls === 1
          ? { error: "Temporarily unavailable. Please try again." }
          : { message: "If confirmation is needed, we’ll email you a link." },
    });
  });
  await page.goto("/");
  const form = page.locator(".newsletter-form");
  await form
    .getByLabel("Email address", { exact: true })
    .fill("test@example.com");
  await form.getByRole("button", { name: "Subscribe to newsletter" }).click();
  expect(calls).toBe(0);
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Subscribe to newsletter" }).click();
  await expect(form.getByRole("status")).toContainText(
    "Temporarily unavailable",
  );
  await form.getByRole("button", { name: "Subscribe to newsletter" }).click();
  await expect(form.getByRole("status")).toContainText(
    "confirmation is needed",
  );
  expect(
    (
      await new AxeBuilder({ page })
        .include(".newsletter")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test("subscription links only change state after explicit confirmation", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/newsletter/manage", async (route) => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({
      action: "confirm",
      token: "a".repeat(64),
    });
    await route.fulfill({ json: { message: "You’re subscribed." } });
  });
  await page.goto(`/newsletter/confirm#token=${"a".repeat(64)}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Confirm",
  );
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Confirm subscription" }).click();
  await expect(page.getByRole("status")).toContainText("subscribed");
  expect(new URL(page.url()).hash).toBe("");
});

test("owner and scheduled maintenance endpoints reject unauthenticated access", async ({
  request,
  page,
}) => {
  expect((await request.get("/api/owner")).status()).toBe(401);
  expect(
    (
      await request.post("/api/owner", {
        data: { action: "fulfill", id: "invalid" },
      })
    ).status(),
  ).toBe(401);
  expect((await request.get("/api/cron/maintenance")).status()).toBe(401);
  expect(
    (
      await request.post("/api/contact", {
        headers: { Origin: "https://foreign.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/newsletter", {
        headers: { Origin: "http://localhost:3103" },
        data: { email: "test@example.com", consent: false },
      })
    ).status(),
  ).toBe(400);
  await page.goto("/owner");
  await expect(page).toHaveURL(/\/sign-in/);
});
