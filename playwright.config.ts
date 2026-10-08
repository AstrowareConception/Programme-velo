import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    serviceWorkers: "block",
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "mobile-chromium",
      use: {
        browserName: "chromium",
        launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: "desktop-chromium",
      use: {
        browserName: "chromium",
        launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined,
        viewport: { width: 1280, height: 900 }
      }
    },
    ...(["mobile", "tablet"] as const).map(size => ({
      name: `${size}-webkit`,
      // Real WebKit rendering on the essential manual flows, not simulated BLE qualification.
      testMatch: ["**/program-cycles.spec.ts", "**/trophy-rewards.spec.ts", "**/cloud-unconfigured.spec.ts", "**/short-workouts.spec.ts", "**/timed-trials.spec.ts", "**/accessibility.spec.ts", "**/coach-score.spec.ts", "**/session-journey.spec.ts", "**/session-persistence.spec.ts", "**/discovery.spec.ts", "**/support-diagnostic.spec.ts", "**/backup-transfer.spec.ts"],
      use: {
        browserName: "webkit" as const,
        launchOptions: process.env.WEBKIT_PATH ? { executablePath: process.env.WEBKIT_PATH } : undefined,
        viewport: size === "tablet" ? { width: 1024, height: 768 } : { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true
      }
    }))
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: "npm run build && npm run start -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 120_000
  }
});
