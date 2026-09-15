import { test, expect } from "@playwright/test";
import { unlockGate, seedSession, seedAnnons, seedBuyerInterest, seedDeal } from "./helpers";

test("typing digits into the buyer profile's Org.nr field auto-inserts the dash after 6 digits", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-9201", "Kalle", "Kopvis");

  // /kopare/profil renders session-derived text (buyer name) that SSR can't
  // know about, so the client remounts the subtree right after hydration —
  // wait for that to settle before locating elements, same as unlockGate
  // does for the gate form's own hydration race.
  await page.goto("/kopare/profil");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("556677-8899").fill("5566778899");

  await expect(page.getByPlaceholder("556677-8899")).toHaveValue("556677-8899");
});

test('an invalid Org.nr format on the buyer profile shows an error only after blur, and doesn\'t block "Spara och fortsätt"', async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-9202", "Nils", "Nyskapare");

  // Same hydration-race wait as above — see comment there.
  await page.goto("/kopare/profil?next=/dashboard");
  await page.waitForLoadState("networkidle");
  const orgnrInput = page.getByPlaceholder("556677-8899");
  await orgnrInput.fill("1234");

  await expect(page.getByText("Ogiltigt format. Ange som XXXXXX-XXXX.")).toHaveCount(0);

  await orgnrInput.blur();
  await expect(page.getByText("Ogiltigt format. Ange som XXXXXX-XXXX.")).toBeVisible();

  const submitBtn = page.getByRole("button", { name: "Spara och fortsätt →" });
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("the same org.nr formatting applies in admin's Bolagsuppgifter editor", async ({ page }) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-orgnr-admin-annons",
    titel: "E2E orgnr admin",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 80" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-orgnr-admin-interest",
    annonsId: "e2e-orgnr-admin-annons",
    kKod: "K-e2e-orgnr",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_orgnr",
  });
  await seedDeal(page, "e2e-orgnr-admin-interest", { steg: "granskning" });

  await page.goto("/admin/affarer/e2e-orgnr-admin-interest");
  const orgnrInput = page.locator("label", { hasText: "Org.nr" }).locator("input");
  await orgnrInput.fill("5566778899");
  await expect(orgnrInput).toHaveValue("556677-8899");

  await orgnrInput.fill("1234");
  await orgnrInput.blur();
  await expect(page.getByText("Ogiltigt format. Ange som XXXXXX-XXXX.")).toBeVisible();
});
