import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal, seedAccount } from "./helpers";

test("Godkänn is disabled until the checklist is satisfied, then advances steg to matchad", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-inline-godkann-annons",
    titel: "E2E inline godkänn",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 20" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-inline-godkann-1",
    annonsId: "e2e-inline-godkann-annons",
    kKod: "K-e2e-ig1",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_ig1",
  });
  await seedDeal(page, "e2e-inline-godkann-1", {
    interestId: "e2e-inline-godkann-1",
    steg: "granskning",
  });

  await page.goto("/admin/affarer");
  const grupp = page.locator("details", { has: page.getByText("E2E inline godkänn") });
  await grupp.locator("summary").click();
  const rad = grupp.locator("tr", { has: page.getByText("K-e2e-ig1") });

  await expect(rad.getByRole("button", { name: "Godkänn (krav saknas)" })).toBeDisabled();

  await seedDeal(page, "e2e-inline-godkann-1", {
    interestId: "e2e-inline-godkann-1",
    steg: "granskning",
    granskning: { kycDokument: "kyc.pdf", foretagspresentation: "pres.pdf", firmatecknare: true },
  });
  await page.reload();
  const gruppAfter = page.locator("details", { has: page.getByText("E2E inline godkänn") });
  await gruppAfter.locator("summary").click();
  const radAfter = gruppAfter.locator("tr", { has: page.getByText("K-e2e-ig1") });

  const godkannBtn = radAfter.getByRole("button", { name: "Godkänn →" });
  await expect(godkannBtn).toBeEnabled();
  await godkannBtn.click();

  await expect(page.getByText("Steg: Matchad")).toBeVisible();
});

test("Avvisa removes the candidate from the granskning group and it appears in Avslutade", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-inline-avvisa-annons",
    titel: "E2E inline avvisa",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 21" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-inline-avvisa-1",
    annonsId: "e2e-inline-avvisa-annons",
    kKod: "K-e2e-ia1",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_ia1",
  });
  await seedDeal(page, "e2e-inline-avvisa-1", {
    interestId: "e2e-inline-avvisa-1",
    steg: "granskning",
  });

  await page.goto("/admin/affarer");
  const grupp = page.locator("details", { has: page.getByText("E2E inline avvisa") });
  await grupp.locator("summary").click();
  const rad = grupp.locator("tr", { has: page.getByText("K-e2e-ia1") });

  page.once("dialog", (dialog) => dialog.accept());
  await rad.getByRole("button", { name: "Avvisa" }).click();

  await expect(page.getByText("K-e2e-ia1")).toHaveCount(0);
  await expect(page.getByText("TreLink valde en annan köpare")).toBeVisible();
});

test("clicking Godkänn or Avvisa does not trigger the row's own navigate-to-account click", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-inline-noclick-annons",
    titel: "E2E inline ingen navigering",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 22" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-inline-noclick-1",
    annonsId: "e2e-inline-noclick-annons",
    kKod: "K-e2e-in1",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_in1",
  });
  await seedDeal(page, "e2e-inline-noclick-1", {
    interestId: "e2e-inline-noclick-1",
    steg: "granskning",
    granskning: { kycDokument: "kyc.pdf", foretagspresentation: "pres.pdf", firmatecknare: true },
  });
  // The row itself only navigates when its candidate has a matching admin
  // account — seed one so the click-through-prevention below is actually
  // exercising the stopPropagation guard, not just an absent onClick.
  await seedAccount(page, {
    id: "e2e-acc-in1",
    userId: "u_e2e_in1",
    bankid: { fornamn: "In1", efternamn: "Testsson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: {},
  });

  await page.goto("/admin/affarer");
  const grupp = page.locator("details", { has: page.getByText("E2E inline ingen navigering") });
  await grupp.locator("summary").click();
  const rad = grupp.locator("tr", { has: page.getByText("K-e2e-in1") });

  await rad.getByRole("button", { name: "Godkänn →" }).click();
  await expect(page).toHaveURL(/\/admin\/affarer\/?$/);

  // Re-seed a second granskning candidate to exercise Avvisa the same way.
  await seedBuyerInterest(page, {
    id: "e2e-inline-noclick-2",
    annonsId: "e2e-inline-noclick-annons",
    kKod: "K-e2e-in2",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_in2",
  });
  await seedDeal(page, "e2e-inline-noclick-2", {
    interestId: "e2e-inline-noclick-2",
    steg: "granskning",
  });
  await seedAccount(page, {
    id: "e2e-acc-in2",
    userId: "u_e2e_in2",
    bankid: { fornamn: "In2", efternamn: "Testsson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: {},
  });
  await page.reload();
  const gruppAfter = page.locator("details", {
    has: page.getByText("E2E inline ingen navigering"),
  });
  await gruppAfter.locator("summary").click();
  const radAfter = gruppAfter.locator("tr", { has: page.getByText("K-e2e-in2") });

  page.once("dialog", (dialog) => dialog.accept());
  await radAfter.getByRole("button", { name: "Avvisa" }).click();
  await expect(page).toHaveURL(/\/admin\/affarer\/?$/);
});

test('"Öppna granskning →" navigates to the candidate\'s deal detail page, not the account page', async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-inline-detail-link-annons",
    titel: "E2E inline detaljlänk",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 23" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-inline-detail-link-1",
    annonsId: "e2e-inline-detail-link-annons",
    kKod: "K-e2e-idl1",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_idl1",
  });
  await seedDeal(page, "e2e-inline-detail-link-1", {
    interestId: "e2e-inline-detail-link-1",
    steg: "granskning",
  });
  // The row itself navigates to the account page when the candidate has a
  // matching admin account — seed one so this test also proves "Öppna
  // granskning →" doesn't fall through to that click.
  await seedAccount(page, {
    id: "e2e-acc-idl1",
    userId: "u_e2e_idl1",
    bankid: { fornamn: "Idl1", efternamn: "Testsson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: {},
  });

  await page.goto("/admin/affarer");
  const grupp = page.locator("details", { has: page.getByText("E2E inline detaljlänk") });
  await grupp.locator("summary").click();
  const rad = grupp.locator("tr", { has: page.getByText("K-e2e-idl1") });

  await rad.getByRole("link", { name: "Öppna granskning →" }).click();
  await expect(page).toHaveURL(/\/admin\/affarer\/e2e-inline-detail-link-1$/);
});
