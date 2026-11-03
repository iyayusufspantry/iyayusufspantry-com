import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "live-payments-ui.spec.ts",
  outputDir: "artifacts/live-payments-playwright",
  reporter: "list",
  workers: 1,
  use: { baseURL: "http://localhost:3105", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "npm run start -- --hostname localhost --port 3105",
    url: "http://localhost:3105",
    env: {
      APP_URL: "https://pantry.example",
      STRIPE_PAYMENT_MODE: "live",
      STRIPE_API_KEY: "sk_live_ui_test_not_a_real_key",
      STRIPE_LIVE_WEBHOOK_SECRET: "whsec_ui_test_only",
      STRIPE_LIVE_TAX_READY: "true",
      STRIPE_CHECKOUT_ENABLED: "true",
    },
    reuseExistingServer: false,
    timeout: 60000,
  },
});
