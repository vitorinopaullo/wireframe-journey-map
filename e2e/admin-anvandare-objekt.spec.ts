import { test, expect } from "@playwright/test";
import {
  unlockGate,
  seedAnnons,
  seedAccount,
  seedFavorit,
  seedBuyerInterest,
  seedDeal,
} from "./helpers";

test("favorit and intresse rows on the admin account page both link to /annons/$id with a TRL ref", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAccount(page, {
    id: "e2e-acc-objekt-links",
    userId: "u_e2e_objekt_links",
    bankid: { personnr: "19900101-9201", fornamn: "Objekt", efternamn: "Länksson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: {},
  });

  await seedAnnons(page, {
    id: "e2e-objekt-links-favorit-annons",
    titel: "E2E objekt-favorit",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 60" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedFavorit(page, {
    userId: "u_e2e_objekt_links",
    annonsId: "e2e-objekt-links-favorit-annons",
    titel: "E2E objekt-favorit",
    pris: 900000,
    ort: "Stockholm",
    kategori: "Lokal",
    savedAt: new Date().toISOString(),
  });

  await seedAnnons(page, {
    id: "e2e-objekt-links-intresse-annons",
    titel: "E2E objekt-intresse",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 61" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-objekt-links-interest",
    annonsId: "e2e-objekt-links-intresse-annons",
    kKod: "K-7700",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_objekt_links",
  });

  await page.goto("/admin/anvandare/e2e-acc-objekt-links");

  const favoritRad = page.locator("a", { has: page.getByText("E2E objekt-favorit") });
  await expect(favoritRad).toHaveAttribute("href", "/annons/e2e-objekt-links-favorit-annons");
  await expect(favoritRad.getByText("TRL-")).toBeVisible();

  const intresseRad = page.locator("a", { has: page.getByText("E2E objekt-intresse") });
  await expect(intresseRad).toHaveAttribute("href", "/annons/e2e-objekt-links-intresse-annons");
  await expect(intresseRad.getByText("TRL-")).toBeVisible();
});

test("the intresse-row label reads Köpt once the deal reaches steg klar", async ({ page }) => {
  await unlockGate(page);

  await seedAccount(page, {
    id: "e2e-acc-objekt-klar",
    userId: "u_e2e_objekt_klar",
    bankid: { personnr: "19900101-9202", fornamn: "Klar", efternamn: "Kopare" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: {},
  });
  await seedAnnons(page, {
    id: "e2e-objekt-klar-annons",
    titel: "E2E objekt-klar",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 62" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-objekt-klar-interest",
    annonsId: "e2e-objekt-klar-annons",
    kKod: "K-7701",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_objekt_klar",
  });
  await seedDeal(page, "e2e-objekt-klar-interest", { steg: "klar" });

  await page.goto("/admin/anvandare/e2e-acc-objekt-klar");

  const rad = page.locator("a", { has: page.getByText("E2E objekt-klar") });
  await expect(rad.getByText("Köpt", { exact: true })).toBeVisible();
  // Not the buyer-perspective wording ("Du vill köpa") that IntresseStatusTag would show.
  await expect(rad.getByText("Du vill köpa")).toHaveCount(0);
});
