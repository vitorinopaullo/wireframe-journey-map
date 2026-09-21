import { test, expect } from "@playwright/test";
import {
  unlockGate,
  seedAccount,
  seedAnnons,
  seedBuyerInterest,
  seedDeal,
  seedFavorit,
  seedSession,
} from "./helpers";

test("phone numbers render formatted (not raw digits) across all four admin views", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAccount(page, {
    id: "e2e-tel-acc",
    userId: "u_e2e_tel",
    bankid: { personnr: "19850101-6201", fornamn: "Petra", efternamn: "Telefonsson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { telefon: "0761234567", epost: "petra@example.com" },
  });
  await seedAnnons(page, {
    id: "e2e-tel-annons",
    titel: "E2E telefon",
    agarUserId: "u_e2e_tel_other_owner",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 700" },
    workflow: { state: "publicerad", timeline: [] },
  });
  // admin.kopare.tsx only lists väntar-pdf leads (see
  // admin-intressenter-pending-only.spec.ts), while admin.affarer.index.tsx
  // only lists vill-ga-vidare candidates with a deal — two separate
  // interests so both surfaces have something to render.
  await seedBuyerInterest(page, {
    id: "e2e-tel-interest-pending",
    annonsId: "e2e-tel-annons",
    kKod: "K-e2e-tel-pending",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_tel",
  });
  await seedBuyerInterest(page, {
    id: "e2e-tel-interest-granskning",
    annonsId: "e2e-tel-annons",
    kKod: "K-e2e-tel-granskning",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_tel",
  });
  await seedFavorit(page, {
    userId: "u_e2e_tel",
    annonsId: "e2e-tel-annons",
    titel: "E2E telefon",
    pris: 1000000,
    ort: "Stockholm",
    kategori: "overlatelse",
    savedAt: new Date().toISOString(),
  });
  await seedDeal(page, "e2e-tel-interest-granskning", { steg: "granskning" });

  // admin.anvandare.$id.tsx
  await page.goto("/admin/anvandare/e2e-tel-acc");
  await expect(page.getByText("076 12 345 67", { exact: true })).toBeVisible();
  await expect(page.getByText("0761234567")).toHaveCount(0);

  // admin.kopare.tsx
  await page.goto("/admin/kopare");
  await page.getByText("1 intresserade").click();
  await expect(page.getByText("076 12", { exact: false })).toBeVisible();
  await expect(page.getByText("0761234567")).toHaveCount(0);

  // admin.sparade.tsx
  await page.goto("/admin/sparade");
  await page.getByText("1 sparade").click();
  await expect(page.getByText("076 12 345 67", { exact: true })).toBeVisible();
  await expect(page.getByText("0761234567")).toHaveCount(0);

  // admin.affarer.index.tsx
  await page.goto("/admin/affarer");
  await page.getByText("1 kandidat").click();
  await expect(page.getByText("076 12 345 67", { exact: true })).toBeVisible();
  await expect(page.getByText("0761234567")).toHaveCount(0);
});

test("admin views show the seller-perspective komplettering label, not the buyer/seller-only one", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-adminlabel-annons",
    titel: "E2E admin label",
    agarUserId: "u_e2e_adminlabel_seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 701" },
    workflow: {
      state: "komplettering",
      timeline: [],
      komplettering: { message: "test", at: new Date().toISOString() },
    },
  });

  await page.goto("/admin/annonser");
  await expect(page.getByText("Väntar på säljarens komplettering")).toBeVisible();
  await expect(page.getByText("Väntar på din komplettering")).toHaveCount(0);

  await page.goto("/admin/annonser/e2e-adminlabel-annons");
  await expect(page.getByText("Väntar på säljarens komplettering")).toBeVisible();
  await expect(page.getByText("Väntar på din komplettering")).toHaveCount(0);
});

test("seller and admin affär pages describe the buyer's status in third person, not as Du", async ({
  page,
}) => {
  await unlockGate(page);

  await seedSession(page, "19800101-6202", "Sara", "Statuslabel", "saljare");
  await seedAnnons(page, {
    id: "e2e-statuslabel-annons",
    titel: "E2E status label",
    agarUserId: "u_198001016202",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 702" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-statuslabel-interest",
    annonsId: "e2e-statuslabel-annons",
    kKod: "K-e2e-statuslabel",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_statuslabel_buyer",
  });
  await seedDeal(page, "e2e-statuslabel-interest", { steg: "granskning" });

  // Admin's own affär detail page.
  await page.goto("/admin/affarer/e2e-statuslabel-interest");
  await expect(page.getByText("Köparen vill köpa")).toBeVisible();
  await expect(page.getByText("Du vill köpa")).toHaveCount(0);

  // Seller's own affär detail page.
  await page.goto("/saljare/affarer/e2e-statuslabel-interest");
  await expect(page.getByText("Köparen vill köpa")).toBeVisible();
  await expect(page.getByText("Du vill köpa")).toHaveCount(0);
});
