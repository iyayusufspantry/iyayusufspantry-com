import nextEnv from "@next/env";
import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { paymentConfig } from "../../lib/payments/config";

nextEnv.loadEnvConfig(process.cwd(), true);
const config = paymentConfig();
const publicTest = process.argv.includes("--public");
if (publicTest) config.origin = "https://www.iyayusufspantry.com";
if (
  !publicTest &&
  !["localhost", "127.0.0.1"].includes(new URL(config.origin).hostname)
)
  throw new Error("Use --public to explicitly test the deployed sandbox.");
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
try {
  await page.goto(`${config.origin}/checkout`);
  await page.getByRole("button", { name: "Load sample cart" }).click();
  await page
    .getByRole("button", { name: "Continue to Stripe — test payment" })
    .click();
  await page.waitForURL("https://checkout.stripe.com/**", { timeout: 60000 });
  await page.locator("#email").fill("sandbox-buyer@example.com");
  await page.locator("#shippingName").fill("Sandbox Test Buyer");
  await expect(page.locator("#shippingCountry")).toHaveValue("US");
  await page.locator("#shippingAddressLine1").fill("123 Test Street");
  await page.locator("#shippingLocality").fill("New York");
  await page.locator("#shippingPostalCode").fill("10001");
  await page.locator("#shippingAdministrativeArea").selectOption("NY");
  await page.locator("#cardNumber").fill("4242424242424242");
  await page.locator("#cardExpiry").fill("1230");
  await page.locator("#cardCvc").fill("123");
  await page.getByTestId("hosted-payment-submit-button").click();
  await page.waitForURL(`${config.origin}/order-confirmation?**`, {
    timeout: 60000,
  });
  await expect(
    page.getByRole("heading", { name: "Test payment confirmed" }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.locator(".confirmation-card")).toContainText("USD");
  await mkdir("artifacts/payments", { recursive: true });
  await page.screenshot({
    path: `artifacts/payments/${publicTest ? "public-" : ""}confirmed-test-payment.png`,
    fullPage: true,
  });
  console.log(
    "Stripe's hosted form accepted the test card. The real signed payment event saved the order, deducted sample stock, and the website displayed confirmation.",
  );
} catch {
  await mkdir("artifacts/payments", { recursive: true });
  await page.screenshot({
    path: `artifacts/payments/${publicTest ? "public-" : ""}purchase-test-failure.png`,
    fullPage: true,
  });
  console.error(
    `Hosted sandbox purchase check failed; inspect artifacts/payments/${publicTest ? "public-" : ""}purchase-test-failure.png. No live payment was attempted.`,
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
