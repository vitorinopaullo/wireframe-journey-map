import { test, expect } from "@playwright/test";
import { unlockGate, seedSession } from "./helpers";

test("a logged-in buyer can reach their profile from a public page via the account menu", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-7001", "Anna", "Svensson", "kopare");

  await page.goto("/lokaler");
  await page.getByRole("button", { name: "AS" }).click();
  await expect(page.getByText("Anna Svensson", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Profil" }).click();
  await expect(page).toHaveURL(/\/kopare\/profil/);
});

test("switching roles from the account menu works from both a public page and an app-shell page", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19900202-7002", "Erik", "Karlsson", "saljare");

  // From a public page (annons detail).
  await page.goto("/annons/1");
  await page.getByRole("button", { name: "EK" }).click();
  await page.getByRole("link", { name: "Byt till Köpare" }).click();
  await expect(page).toHaveURL(/\/dashboard\?mode=kopare/);

  // From an app-shell page (AppLayout).
  await page.getByRole("button", { name: "EK" }).click();
  await page.getByRole("link", { name: "Byt till Säljare" }).click();
  await expect(page).toHaveURL(/\/dashboard\?mode=saljare/);
  await expect(page.getByText("Säljarpanel", { exact: true })).toBeVisible();
});
