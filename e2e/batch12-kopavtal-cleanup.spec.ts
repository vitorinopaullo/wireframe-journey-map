import { test, expect } from "@playwright/test";
import {
  unlockGate,
  seedSession,
  seedAnnons,
  seedBuyerInterest,
  seedDeal,
  seedAccount,
} from "./helpers";

test("admin.affarer.index.tsx never renders Intresse inskickat, while kopare's Väntar på dig tab still does", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-9101", "Kalle", "Kopvis");

  await seedAnnons(page, {
    id: "e2e-batch12-vantarpdf-annons",
    titel: "E2E batch12 väntar-pdf",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 70" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-batch12-vantarpdf-interest",
    annonsId: "e2e-batch12-vantarpdf-annons",
    kKod: "K-e2e-b12vp",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_198501019101",
  });

  await page.goto("/admin/affarer");
  await expect(page.getByText("Intresse inskickat", { exact: true })).toHaveCount(0);
  await expect(page.getByText("E2E batch12 väntar-pdf")).toHaveCount(0);

  await page.goto("/kopare/affarer");
  await expect(page.getByText("Väntar på dig (1)")).toBeVisible();
  await expect(page.getByText("Steg: Intresse inskickat")).toBeVisible();
});

test('STEG_LABEL and saljare.intressenter.tsx both say "Köpavtal", not "Matchad"', async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-batch12-kopavtal-annons",
    titel: "E2E batch12 köpavtal",
    agarUserId: "u_198501019102",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 71" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-batch12-kopavtal-interest",
    annonsId: "e2e-batch12-kopavtal-annons",
    kKod: "K-e2e-b12kp",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_b12kp",
  });
  await seedDeal(page, "e2e-batch12-kopavtal-interest", { steg: "matchad" });

  await page.goto("/admin/affarer/e2e-batch12-kopavtal-interest");
  // Scoped to the progress-stepper span, not the dev-only "hoppa till steg"
  // dropdown, which also has a "Köpavtal" option and would otherwise make
  // this a strict-mode violation (two matches).
  await expect(page.locator("span").filter({ hasText: "Köpavtal" })).toBeVisible();
  await expect(page.getByText("Matchad", { exact: true })).toHaveCount(0);

  await seedSession(page, "19850101-9102", "Sanna", "Saljarsson");
  await page.goto("/saljare/intressenter");
  await expect(page.getByText("Köpavtal", { exact: true })).toBeVisible();
  await expect(page.getByText("Matchad", { exact: true })).toHaveCount(0);
});

test("the hyresvärd mail's Företagspresentation row shows the uploaded filename, not always —", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-batch12-hv-annons",
    titel: "E2E batch12 hyresvärd",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 72" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedAccount(page, {
    id: "e2e-acc-batch12-hv",
    userId: "u_e2e_b12hv",
    bankid: { fornamn: "Hyra", efternamn: "Testsson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { foretagspresentation: "min-presentation.pdf" },
  });
  await seedBuyerInterest(page, {
    id: "e2e-batch12-hv-interest",
    annonsId: "e2e-batch12-hv-annons",
    kKod: "K-e2e-b12hv",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_b12hv",
  });
  await seedDeal(page, "e2e-batch12-hv-interest", { steg: "hyresvard" });

  await page.goto("/admin/affarer/e2e-batch12-hv-interest");
  await expect(page.getByText("Sammanställning att skicka till hyresvärden")).toBeVisible();
  await expect(page.getByText("min-presentation.pdf", { exact: true })).toBeVisible();
});
