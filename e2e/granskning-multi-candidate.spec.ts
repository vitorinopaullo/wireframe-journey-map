import { test, expect } from "@playwright/test";
import {
  unlockGate,
  seedAnnons,
  seedBuyerInterest,
  seedDeal,
  seedAccount,
  seedSession,
} from "./helpers";

test("admin.kopare.tsx groups multiple vantar-pdf leads for the same annons", async ({ page }) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-multi-waiting-annons",
    titel: "E2E flera väntande",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 10" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-multi-waiting-1",
    annonsId: "e2e-multi-waiting-annons",
    kKod: "K-e2e-mw1",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_mw1",
  });
  await seedBuyerInterest(page, {
    id: "e2e-multi-waiting-2",
    annonsId: "e2e-multi-waiting-annons",
    kKod: "K-e2e-mw2",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_mw2",
  });

  await page.goto("/admin/kopare");

  const grupp = page.locator("details", { has: page.getByText("E2E flera väntande") });
  await expect(grupp.getByText("2 intresserade")).toBeVisible();
  await expect(grupp.getByText("K-e2e-mw1")).toBeHidden();

  await grupp.locator("summary").click();

  await expect(grupp.getByText("K-e2e-mw1")).toBeVisible();
  await expect(grupp.getByText("K-e2e-mw2")).toBeVisible();
});

test("admin.affarer.index.tsx groups granskning candidates and matching one leaves the other in place", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-multi-granskning-annons",
    titel: "E2E flera kandidater",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 11" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-multi-granskning-1",
    annonsId: "e2e-multi-granskning-annons",
    kKod: "K-e2e-mg1",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_mg1",
  });
  await seedBuyerInterest(page, {
    id: "e2e-multi-granskning-2",
    annonsId: "e2e-multi-granskning-annons",
    kKod: "K-e2e-mg2",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_mg2",
  });

  await page.goto("/admin/affarer");

  const grupp = page.locator("details", { has: page.getByText("E2E flera kandidater") });
  await expect(grupp.getByText("2 kandidater")).toBeVisible();

  await grupp.locator("summary").click();
  await expect(grupp.getByText("K-e2e-mg1")).toBeVisible();
  await expect(grupp.getByText("K-e2e-mg2")).toBeVisible();

  // Match the first candidate from its own detail page — the "Matchning"
  // box (gated on steg === "granskning") should be replaced by "Köpeavtal"
  // (gated on steg === "matchad") once the deal advances.
  await page.goto("/admin/affarer/e2e-multi-granskning-1");
  await page.getByRole("button", { name: "Matcha köpare →" }).click();
  await expect(page.getByText("Köpeavtal", { exact: true })).toBeVisible();

  // Back on the list, the granskning group should now only contain the
  // untouched second candidate; the matched one is an individual row.
  await page.goto("/admin/affarer");
  const kvarvarandeGrupp = page.locator("details", {
    has: page.getByText("E2E flera kandidater"),
  });
  await expect(kvarvarandeGrupp.getByText("1 kandidat")).toBeVisible();
  await kvarvarandeGrupp.locator("summary").click();
  await expect(kvarvarandeGrupp.getByText("K-e2e-mg2")).toBeVisible();
  await expect(kvarvarandeGrupp.getByText("K-e2e-mg1")).toHaveCount(0);
});

test("buyer's company-presentation upload at granskning is visible as Uppladdad in the admin candidate view", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6001", "Ex", "Empel");
  await seedAccount(page, {
    id: "e2e-acc-fp",
    userId: "u_198501016001",
    bankid: { personnr: "19850101-6001", fornamn: "Ex", efternamn: "Empel" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { bolag: "E2E Presentation AB" },
  });

  await seedAnnons(page, {
    id: "e2e-fp-annons",
    titel: "E2E företagspresentation",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 12" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-fp-interest",
    annonsId: "e2e-fp-annons",
    kKod: "K-e2e-fp",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501016001",
  });
  await seedDeal(page, "e2e-fp-interest", { steg: "granskning" });

  await page.goto("/kopare/affarer/e2e-fp-interest");
  await expect(page.getByText("TreLink granskar de köpare")).toBeVisible();

  // Only one file input exists on the page at the granskning step (the
  // Företagspresentation row), so a bare type selector is unambiguous.
  await page.locator('input[type="file"]').setInputFiles({
    name: "foretagspresentation.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("e2e test file"),
  });

  await expect(page.getByText("foretagspresentation.pdf", { exact: true })).toBeVisible();

  await page.goto("/admin/affarer");
  const grupp = page.locator("details", { has: page.getByText("E2E företagspresentation") });
  await grupp.locator("summary").click();
  const rad = grupp.locator("tr", { has: page.getByText("K-e2e-fp") });
  await expect(rad.getByText("Uppladdad")).toBeVisible();
});
