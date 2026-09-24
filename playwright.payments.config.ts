import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "payments-ui.spec.ts",
  outputDir: "artifacts/payments-playwright",
  reporter: "list",
  workers: 1,
  use: { baseURL: "http://localhost:3101", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "npm run start -- --hostname localhost --port 3101",
    url: "http://localhost:3101",
    env: { STRIPE_CHECKOUT_ENABLED: "true", APP_URL: "http://localhost:3101" },
    reuseExistingServer: false,
    timeout: 60000,
  },
});
