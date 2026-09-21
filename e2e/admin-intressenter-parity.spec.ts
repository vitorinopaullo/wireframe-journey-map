import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedAccount } from "./helpers";

test("Mobil and Mail render on an Intressenter row from account.profil", async ({ page }) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-int-parity-annons",
    titel: "E2E intressenter parity",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 60" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedAccount(page, {
    id: "e2e-acc-parity",
    userId: "u_e2e_parity",
    bankid: { personnr: "19850101-6020", fornamn: "Pia", efternamn: "Ritet" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { bolag: "Parity AB", telefon: "0705556677", epost: "pia@example.com" },
  });
  await seedBuyerInterest(page, {
    id: "e2e-int-parity-interest",
    annonsId: "e2e-int-parity-annons",
    kKod: "K-e2e-parity",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_parity",
  });

  await page.goto("/admin/kopare");
  await page
    .locator("details", { has: page.getByText("E2E intressenter parity") })
    .locator("summary")
    .click();

  const rad = page.locator("tr", { has: page.getByText("K-e2e-parity") });
  await expect(rad.getByText("070 55 566 77")).toBeVisible();
  await expect(rad.getByText("pia@example.com")).toBeVisible();
});

test("the Status column shows PDF öppnat vs Väntar på beslut — ring säljaren correctly", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-status-annons",
    titel: "E2E status label",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 61" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-status-not-opened",
    annonsId: "e2e-status-annons",
    kKod: "K-e2e-notopened",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_notopened",
  });
  await seedBuyerInterest(page, {
    id: "e2e-status-opened",
    annonsId: "e2e-status-annons",
    kKod: "K-e2e-opened",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_opened",
    pdfOppnadAt: new Date().toISOString(),
  });

  await page.goto("/admin/kopare");
  await page
    .locator("details", { has: page.getByText("E2E status label") })
    .locator("summary")
    .click();

  const radNotOpened = page.locator("tr", { has: page.getByText("K-e2e-notopened") });
  await expect(radNotOpened.getByText("Väntar på beslut — ring säljaren")).toBeVisible();

  const radOpened = page.locator("tr", { has: page.getByText("K-e2e-opened") });
  await expect(radOpened.getByText("PDF öppnat")).toBeVisible();
});
