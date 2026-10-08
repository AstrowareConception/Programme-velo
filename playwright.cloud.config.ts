import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./cloud-e2e", timeout: 120000, expect: { timeout: 15000 }, workers: 1, retries: 0,
  outputDir: "test-results/cloud", reporter: "list",
  use: { baseURL: "http://127.0.0.1:3015", serviceWorkers: "block", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "cloud-chromium", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined } },
    { name: "cloud-webkit", use: { browserName: "webkit", viewport: { width: 1024, height: 768 }, launchOptions: process.env.WEBKIT_PATH ? { executablePath: process.env.WEBKIT_PATH } : undefined } }
  ],
  webServer: { command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3015", url: "http://127.0.0.1:3015", timeout: 180000, reuseExistingServer: false,
    env: { NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key", NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-veloquest.firebaseapp.com", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-veloquest", NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app", NEXT_PUBLIC_FIREBASE_EMULATORS: "true" } }
});
