import type { Page } from "@playwright/test";

// Password gate is a server-side cookie session (see src/lib/gate.functions.ts) —
// a fresh Playwright browser context has no cookie, so every test needs to
// unlock once before it can reach any route.
const SITE_PASSWORD = "trelink2026";

export async function unlockGate(page: Page) {
  await page.goto("/");
  const passwordField = page.locator('input[type="password"]');

  // The gate form is client-hydrated (its onSubmit calls a server function
  // and preventDefault()s the native GET submit) — clicking before
  // hydration finishes falls through to a native form GET submit instead
  // (visible as "?password=..." in the URL, no cookie set). Retry a couple
  // of times, waiting for hydration via networkidle first, until the
  // password field is actually gone.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!(await passwordField.isVisible().catch(() => false))) return;
    await page.waitForLoadState("networkidle");
    await passwordField.fill(SITE_PASSWORD);
    await page.getByRole("button", { name: "Lås upp" }).click();
    await page
      .waitForFunction(() => !document.querySelector('input[type="password"]'), { timeout: 5000 })
      .catch(() => {});
    if (!(await passwordField.isVisible().catch(() => false))) return;
    await page.goto("/");
  }
}

/** Same record shape as annons-workflow.ts (STORAGE_KEY = "saljare-annonser"). */
export async function seedAnnons(page: Page, annons: Record<string, unknown>) {
  await page.evaluate((item) => {
    const list: { id: unknown }[] = JSON.parse(localStorage.getItem("saljare-annonser") ?? "[]");
    const next = list.filter((a) => a.id !== item.id);
    next.push(item);
    localStorage.setItem("saljare-annonser", JSON.stringify(next));
  }, annons);
}

/**
 * Same shape as Session in mock-auth.ts. Session moved to sessionStorage
 * (per-tab, not shared across tabs) — see the "trelink-gate" commit history.
 * Must run after the page has navigated to the app's origin at least once.
 */
export async function seedSession(
  page: Page,
  personnr: string,
  fornamn: string,
  efternamn: string,
) {
  await page.evaluate(
    ({ personnr, fornamn, efternamn }) => {
      const userId = `u_${personnr.replace(/\D/g, "")}`;
      sessionStorage.setItem(
        "trelink-session",
        JSON.stringify({
          userId,
          bankid: { personnr, fornamn, efternamn, verifieradAt: Date.now() },
          createdAt: Date.now(),
        }),
      );
    },
    { personnr, fornamn, efternamn },
  );
}
