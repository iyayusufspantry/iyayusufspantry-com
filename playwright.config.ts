import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testIgnore: [
    "**/payments.test.ts",
    "**/operations.test.ts",
    "**/payments-ui.spec.ts",
    "**/operations-ui.spec.ts",
  ],
  fullyParallel: true,
  workers: 3,
  timeout: 30000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    env: {
      STRIPE_CHECKOUT_ENABLED: "false",
      CONTACT_ENABLED: "false",
      NEWSLETTER_ENABLED: "false",
    },
    command: "npm run start -- --hostname localhost --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
