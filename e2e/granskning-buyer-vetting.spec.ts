import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal, seedSession } from "./helpers";

test("Matcha köpare stays disabled until KYC, firmatecknare and företagspresentation are all satisfied", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-vetting-annons",
    titel: "E2E granskningskrav",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 20" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-vetting-interest",
    annonsId: "e2e-vetting-annons",
    kKod: "K-e2e-vet",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_vet",
  });

  await page.goto("/admin/affarer/e2e-vetting-interest");
  await expect(page.getByRole("button", { name: "Matcha köpare (krav saknas)" })).toBeDisabled();

  // KYC-dokument and företagspresentation uploaded, but firmatecknare not
  // yet answered — still disabled.
  await seedDeal(page, "e2e-vetting-interest", {
    interestId: "e2e-vetting-interest",
    steg: "granskning",
    granskning: { kycDokument: "kyc.pdf", foretagspresentation: "pres.pdf" },
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Matcha köpare (krav saknas)" })).toBeDisabled();

  // Firmatecknare confirmed too — all three requirements met, button enables.
  await seedDeal(page, "e2e-vetting-interest", {
    interestId: "e2e-vetting-interest",
    steg: "granskning",
    granskning: { kycDokument: "kyc.pdf", foretagspresentation: "pres.pdf", firmatecknare: true },
  });
  await page.reload();
  const matchaBtn = page.getByRole("button", { name: "Matcha köpare →" });
  await expect(matchaBtn).toBeEnabled();
  await matchaBtn.click();
  await expect(page.getByText("Köpeavtal", { exact: true })).toBeVisible();
});

test("avvisaKandidat closes the deal, drops the candidate from the granskning group, and shows up in Avslutade", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-avvisa-annons",
    titel: "E2E avvisa kandidat",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 21" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-avvisa-1",
    annonsId: "e2e-avvisa-annons",
    kKod: "K-e2e-av1",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_av1",
  });
  await seedBuyerInterest(page, {
    id: "e2e-avvisa-2",
    annonsId: "e2e-avvisa-annons",
    kKod: "K-e2e-av2",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_av2",
  });

  page.on("dialog", (d) => d.accept());

  await page.goto("/admin/affarer/e2e-avvisa-1");
  await page.getByRole("button", { name: "Avvisa" }).click();
  await expect(page.getByText("Avslutad — TreLink valde en annan köpare")).toBeVisible();

  await page.goto("/admin/affarer");
  const grupp = page.locator("details", { has: page.getByText("E2E avvisa kandidat") });
  await expect(grupp.getByText("1 kandidat")).toBeVisible();
  await grupp.locator("summary").click();
  await expect(grupp.getByText("K-e2e-av2")).toBeVisible();
  await expect(grupp.getByText("K-e2e-av1")).toHaveCount(0);

  await expect(page.getByText("Avslutade", { exact: true })).toBeVisible();
  await expect(page.getByText("TreLink valde en annan köpare")).toBeVisible();
});

test("a komplettering request from TreLink is visible on the buyer's own deal page", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6002", "Karin", "Köpvis");

  await seedAnnons(page, {
    id: "e2e-kompl-annons",
    titel: "E2E komplettering köpare",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 22" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-kompl-interest",
    annonsId: "e2e-kompl-annons",
    kKod: "K-e2e-kompl",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501016002",
  });
  await seedDeal(page, "e2e-kompl-interest", {
    interestId: "e2e-kompl-interest",
    steg: "granskning",
    granskning: {
      komplettering: {
        message: "Vi behöver ett tydligare KYC-dokument, det nuvarande är oläsligt.",
        at: new Date().toISOString(),
      },
    },
  });

  await page.goto("/kopare/affarer/e2e-kompl-interest");
  await expect(
    page.getByText("Vi behöver ett tydligare KYC-dokument, det nuvarande är oläsligt."),
  ).toBeVisible();
});

test('the buyer\'s "Kan inte gå vidare än" box lists exactly the unmet requirements and disappears once satisfied', async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6003", "Bertil", "Bevisson");

  await seedAnnons(page, {
    id: "e2e-buyer-validation-annons",
    titel: "E2E köparvalidering",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 23" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-buyer-validation-interest",
    annonsId: "e2e-buyer-validation-annons",
    kKod: "K-e2e-bv",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501016003",
  });
  await seedDeal(page, "e2e-buyer-validation-interest", {
    interestId: "e2e-buyer-validation-interest",
    steg: "granskning",
  });

  await page.goto("/kopare/affarer/e2e-buyer-validation-interest");
  await expect(page.getByText("Kan inte gå vidare än")).toBeVisible();
  await expect(page.getByText("Ladda upp KYC-dokument")).toBeVisible();
  await expect(page.getByText("Bekräfta om du är firmatecknare")).toBeVisible();
  await expect(page.getByText("Ladda upp företagspresentation")).toBeVisible();

  // Partially satisfied — KYC done, firmatecknare and företagspresentation
  // still missing.
  await seedDeal(page, "e2e-buyer-validation-interest", {
    interestId: "e2e-buyer-validation-interest",
    steg: "granskning",
    granskning: { kycDokument: "kyc.pdf" },
  });
  await page.reload();
  await expect(page.getByText("Ladda upp KYC-dokument")).toHaveCount(0);
  await expect(page.getByText("Bekräfta om du är firmatecknare")).toBeVisible();
  await expect(page.getByText("Ladda upp företagspresentation")).toBeVisible();

  // All three satisfied — the box disappears entirely.
  await seedDeal(page, "e2e-buyer-validation-interest", {
    interestId: "e2e-buyer-validation-interest",
    steg: "granskning",
    granskning: { kycDokument: "kyc.pdf", foretagspresentation: "pres.pdf", firmatecknare: true },
  });
  await page.reload();
  await expect(page.getByText("Kan inte gå vidare än")).toHaveCount(0);
});
