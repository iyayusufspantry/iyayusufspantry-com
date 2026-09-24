import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "operations-ui.spec.ts",
  outputDir: "artifacts/operations-playwright",
  reporter: "list",
  workers: 1,
  use: { baseURL: "http://localhost:3103", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "npm run start -- --hostname localhost --port 3103",
    url: "http://localhost:3103",
    reuseExistingServer: false,
    timeout: 60000,
    // Provider requests are mocked. No email worker is invoked by these tests.
    env: {
      APP_URL: "http://localhost:3103",
      CONTACT_ENABLED: "true",
      NEWSLETTER_ENABLED: "true",
      OWNER_CLERK_USER_IDS: "user_test_only",
      OWNER_EMAILS: "",
      FORM_SECRET: "browser-test-only-not-a-real-secret",
      EMAIL_DELIVERY_ENABLED: "true",
      RESEND_API_KEY: "re_mock_only",
      EMAIL_FROM: "test@example.com",
      CRON_SECRET: "",
    },
  },
});
