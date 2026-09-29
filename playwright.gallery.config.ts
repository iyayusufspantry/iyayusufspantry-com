import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "**/product-gallery.spec.ts",
  projects: [
    {
      name: "chromium-short",
      use: { browserName: "chromium", viewport: { width: 1440, height: 800 } },
    },
    {
      name: "webkit-short",
      use: { browserName: "webkit", viewport: { width: 1440, height: 800 } },
    },
    {
      name: "webkit-mobile",
      use: {
        browserName: "webkit",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
