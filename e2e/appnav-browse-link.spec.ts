import { test, expect } from "@playwright/test";
import { unlockGate, seedSession } from "./helpers";

test("buyerNav's Sök annons link is present on every app-shell page and navigates to /lokaler", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-8001", "Anna", "Svensson", "kopare");

  for (const path of ["/dashboard?mode=kopare", "/kopare/affarer", "/kopare/profil"]) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "Sök annons" })).toBeVisible();
  }

  await page.getByRole("link", { name: "Sök annons" }).click();
  await expect(page).toHaveURL(/\/lokaler/);
});

test("sellerNav has no Sök annons link — a seller browses by switching to Köpare via the account menu instead", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19900202-8002", "Erik", "Karlsson", "saljare");

  await page.goto("/dashboard?mode=saljare");
  await expect(page.getByRole("link", { name: "Sök annons" })).toHaveCount(0);
});
