import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "stories-ui.spec.ts",
  outputDir: "artifacts/stories-playwright",
  reporter: "list",
  workers: 1,
  timeout: 90000,
  use: { baseURL: "http://localhost:3105", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "pnpm dev --hostname localhost --port 3105",
    url: "http://localhost:3105",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      APP_URL: "http://localhost:3105",
      STORIES_ENABLED: "true",
      CONTACT_ENABLED: "true",
      OWNER_CLERK_USER_IDS: "user_test_only",
      FORM_SECRET: "browser-test-only-not-a-real-secret",
      EMAIL_DELIVERY_ENABLED: "false",
      NODE_OPTIONS: "--dns-result-order=ipv4first",
    },
  },
});
