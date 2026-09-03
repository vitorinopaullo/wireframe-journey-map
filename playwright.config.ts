import { defineConfig, devices } from "@playwright/test";

// Assumes the app's own dev server (npm run dev) is already running at
// localhost:8080 — Playwright does not start or manage it here, matching
// how this project is normally verified (see CLAUDE.md "Testing").
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
