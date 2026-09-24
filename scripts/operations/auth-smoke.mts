import nextEnv from "@next/env";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { Pool } from "pg";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.CLERK_SECRET_KEY?.startsWith("sk_test_"))
  throw new Error("A Clerk development instance is required");
const require = createRequire(import.meta.url);
const clerkRequire = createRequire(require.resolve("@clerk/nextjs"));
const { createClerkClient } = clerkRequire("@clerk/backend");
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const suffix = randomUUID();
const email = `pantry-${suffix}+clerk_test@example.com`;
const customerEmail = `customer-${suffix}+clerk_test@example.com`;
const password = `Pantry!${randomUUID()}a7`;
const origin = "http://localhost:3104";
const messageId = randomUUID();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
let stage = "start local acceptance server";
const server = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "localhost",
    "--port",
    "3104",
  ],
  {
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...process.env,
      APP_URL: origin,
      OWNER_EMAILS: email,
      OWNER_CLERK_USER_IDS: "",
      CONTACT_ENABLED: "true",
      FORM_SECRET: randomUUID(),
      EMAIL_DELIVERY_ENABLED: "false",
      CRON_SECRET: "",
    },
  },
);
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
page.setDefaultTimeout(30000);
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${origin}/sign-up`)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* Startup. */
    }
    if (server.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, "Server unavailable");
  assert.equal((await fetch(`${origin}/api/owner`)).status, 401);
  const testing = await clerk.testingTokens.createTestingToken();
  await context.route(
    /https:\/\/[^/]+\.clerk\.accounts\.dev\/v1\//,
    async (route) => {
      const url = new URL(route.request().url());
      url.searchParams.set("__clerk_testing_token", testing.token);
      const response = await route.fetch({ url: url.toString() });
      const body = await response.json();
      // Match Clerk's official Playwright testing-token helper for its dev UI.
      for (const resource of [body.response, body.client]) {
        if (resource && resource.captcha_bypass === false)
          resource.captcha_bypass = true;
      }
      return route.fulfill({ response, json: body });
    },
  );
  stage = "sign up using the Clerk test email and verification code";
  await page.goto(`${origin}/sign-up`);
  await expect(page.locator('input[name="emailAddress"]')).toBeVisible();
  for (const [name, value] of [
    ["firstName", "Pantry"],
    ["lastName", "Test"],
    ["username", `pantry${suffix.replaceAll("-", "")}`],
    ["emailAddress", email],
    ["password", password],
  ]) {
    const input = page.locator(`input[name="${name}"]`);
    if (await input.isVisible()) await input.fill(value);
  }
  const legal = page.locator('input[name="legalAccepted"]');
  if (await legal.isVisible()) await legal.check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const otp = page.getByRole("textbox", { name: /verification code/i });
  await expect(otp).toBeVisible();
  await otp.pressSequentially("424242");
  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            !!(window as unknown as { Clerk?: { user?: unknown } }).Clerk?.user,
        ),
      { timeout: 30000 },
    )
    .toBe(true);
  console.log(
    "Clerk sign-up and email-code verification passed with a reserved test address; no verification email sent.",
  );

  stage = "verify owner authorization and saved contact inbox";
  await page.goto(`${origin}/owner`);
  await expect(
    page.getByRole("heading", { name: "Test orders", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  const total = await page.evaluate(async () => {
    const data = await (await fetch("/api/owner")).json();
    return data.orders[0]?.quote.subtotalCents as number | undefined;
  });
  if (total !== undefined)
    await expect(page.locator("article").first()).toContainText(
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(total / 100),
    );
  const status = await page.evaluate(
    async ({ id }) => {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          name: "Acceptance Test",
          email: "test@example.com",
          subject: "general",
          message: "Isolated acceptance test message; removed after the check.",
        }),
      });
      return response.status;
    },
    { id: messageId },
  );
  assert.equal(status, 200);
  await page.getByRole("button", { name: "Refresh dashboard" }).click();
  await expect(
    page.getByText(
      "Isolated acceptance test message; removed after the check.",
    ),
  ).toBeVisible({ timeout: 30000 });
  await mkdir("artifacts/operations", { recursive: true });
  await page.screenshot({
    path: "artifacts/operations/owner-dashboard.png",
    fullPage: true,
  });
  console.log(
    "Verified owner can open the protected dashboard and read a persisted contact submission.",
  );

  stage = "verify regular account denial";
  const customer = await clerk.users.createUser({
    emailAddress: [customerEmail],
    password,
  });
  const session = await clerk.sessions.createSession({ userId: customer.id });
  const token = await clerk.sessions.getToken(session.id);
  const denied = await fetch(`${origin}/api/owner`, {
    headers: { Authorization: `Bearer ${token.jwt}` },
  });
  assert.equal(denied.status, 403);
  console.log(
    "Signed-out requests return 401; a real signed-in non-owner returns 403.",
  );

  stage = "sign out and sign back in";
  await page.evaluate(async () => {
    await (
      window as unknown as { Clerk: { signOut: () => Promise<void> } }
    ).Clerk.signOut();
  });
  await page.goto(`${origin}/sign-in`);
  await page.locator('input[name="identifier"]').fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            !!(window as unknown as { Clerk?: { user?: unknown } }).Clerk?.user,
        ),
      { timeout: 30000 },
    )
    .toBe(true);
  console.log("Sign-out and password sign-in passed.");
} catch {
  await mkdir("artifacts/operations", { recursive: true });
  await page
    .screenshot({
      path: "artifacts/operations/auth-failure.png",
      fullPage: true,
    })
    .catch(() => {});
  console.error(
    `Acceptance check failed at: ${stage}. Inspect artifacts/operations/auth-failure.png. Credentials were not printed.`,
  );
  process.exitCode = 1;
} finally {
  await browser.close();
  server.kill();
  // Only this run's exact, randomly generated test accounts/message are removed.
  for (const address of [email, customerEmail]) {
    const users = await clerk.users.getUserList({ emailAddress: [address] });
    for (const user of users.data) {
      if (
        user.emailAddresses.some(
          (entry: { emailAddress: string }) => entry.emailAddress === address,
        )
      )
        await clerk.users.deleteUser(user.id);
    }
  }
  let cleaned = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await pool.query(
        "DELETE FROM simbiat_operations.contact_messages WHERE id=$1",
        [messageId],
      );
      cleaned = true;
      break;
    } catch {
      /* Retry transient database connection failures with the same ID. */
    }
  }
  await pool.end();
  if (cleaned)
    console.log("Acceptance-test accounts and contact record removed.");
  else {
    console.error(
      `Test contact cleanup needs retry for reference ${messageId}.`,
    );
    process.exitCode = 1;
  }
}
