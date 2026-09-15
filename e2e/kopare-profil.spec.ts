import { test, expect } from "@playwright/test";
import { unlockGate, seedSession, seedAccount } from "./helpers";

test("the profile page no longer renders the five removed stub tabs", async ({ page }) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6030", "Petra", "Profilsson");

  // /kopare/profil renders session-derived text (buyer name) that SSR can't
  // know about, so the client remounts the subtree right after hydration —
  // wait for that to settle before locating elements, same as unlockGate
  // does for the gate form's own hydration race.
  await page.goto("/kopare/profil");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Personuppgifter", { exact: true })).toBeVisible();
  for (const label of ["Verifieringar", "Ekonomi", "Fakturor", "Notiser", "Säkerhet"]) {
    await expect(page.getByRole("button", { name: label, exact: true })).toHaveCount(0);
  }
});

test('"Spara och fortsätt" navigates to next even with bolag left empty', async ({ page }) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6031", "Nils", "Utankompani");

  await page.goto("/kopare/profil?next=/dashboard");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "Spara och fortsätt →" })).toBeEnabled();

  await page.getByRole("button", { name: "Spara och fortsätt →" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("uploading a company presentation on the profile page persists to account.profil.foretagspresentation", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6032", "Frida", "Filsson");
  // The admin account row is normally created on first BankID sign-in
  // (signInWithBankId → upsertAdminAccount with bankid); seedSession only
  // sets the session, so seed the row explicitly for a realistic upsert
  // target (upsertAdminAccount only creates a new row when patch.bankid is
  // present, which the profil-only upload call doesn't send).
  await seedAccount(page, {
    id: "e2e-acc-profil-upload",
    userId: "u_198501016032",
    bankid: { personnr: "19850101-6032", fornamn: "Frida", efternamn: "Filsson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: {},
  });

  // /kopare/profil renders session-derived text (buyer name) that SSR can't
  // know about, so the client remounts the subtree right after hydration —
  // wait for that to settle before locating elements, same as unlockGate
  // does for the gate form's own hydration race.
  await page.goto("/kopare/profil");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Företagspresentation (frivilligt)").setInputFiles({
    name: "foretagspresentation.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("e2e test file"),
  });

  await expect(page.getByText("foretagspresentation.pdf", { exact: true })).toBeVisible();

  const account = await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("trelink-admin-nya-konton") ?? "[]");
    return list.find((a: { userId: string }) => a.userId === "u_198501016032");
  });
  expect(account.profil.foretagspresentation).toBe("foretagspresentation.pdf");
});
