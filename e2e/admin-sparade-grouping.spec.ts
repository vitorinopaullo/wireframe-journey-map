import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedFavorit, seedAccount, seedSession } from "./helpers";

test("admin.sparade groups favoriter by annons and links through to the per-annons detail page", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-sparade-multi-annons",
    titel: "E2E flera sparade",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 21" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedAccount(page, {
    id: "e2e-acc-sparade-1",
    userId: "u_e2e_sparade1",
    bankid: { personnr: "19900101-9001", fornamn: "Sparade", efternamn: "Ettson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { telefon: "070-1112233", epost: "sparade1@example.com" },
  });
  await seedAccount(page, {
    id: "e2e-acc-sparade-2",
    userId: "u_e2e_sparade2",
    bankid: { personnr: "19900101-9002", fornamn: "Sparade", efternamn: "Tvason" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { telefon: "070-4445566", epost: "sparade2@example.com" },
  });
  await seedFavorit(page, {
    userId: "u_e2e_sparade1",
    annonsId: "e2e-sparade-multi-annons",
    titel: "E2E flera sparade",
    pris: 900000,
    ort: "Stockholm",
    kategori: "Lokal",
    savedAt: new Date().toISOString(),
  });
  await seedFavorit(page, {
    userId: "u_e2e_sparade2",
    annonsId: "e2e-sparade-multi-annons",
    titel: "E2E flera sparade",
    pris: 900000,
    ort: "Stockholm",
    kategori: "Lokal",
    savedAt: new Date().toISOString(),
  });

  await page.goto("/admin/sparade");

  const rad = page.locator("tr", { has: page.getByText("E2E flera sparade") });
  await expect(rad.getByText("2 sparade")).toBeVisible();
  await expect(rad.getByText("TRL-")).toBeVisible();
  await expect(page.getByText("Datum sparad")).toHaveCount(0);

  await page.getByRole("link", { name: "E2E flera sparade" }).click();
  await page.waitForURL(/\/admin\/sparade\/e2e-sparade-multi-annons/);

  await expect(page.getByText("Ettson")).toBeVisible();
  await expect(page.getByText("Tvason")).toBeVisible();
  await expect(page.getByText("070-1112233")).toBeVisible();
  await expect(page.getByText("sparade1@example.com")).toBeVisible();
  await expect(page.getByText("070-4445566")).toBeVisible();
  await expect(page.getByText("sparade2@example.com")).toBeVisible();

  const kKoder = await page.locator("tbody tr td:first-child").allTextContents();
  expect(kKoder).toHaveLength(2);
  expect(new Set(kKoder).size).toBe(2);
  for (const kod of kKoder) expect(kod).toMatch(/^K-\d{4}$/);
});

test("a buyer's Köpar-ID stays the same across a favorit on one listing and an interest on another", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19900101-9003", "Samma", "Kod");
  await seedAccount(page, {
    id: "e2e-acc-samekod",
    userId: "u_199001019003",
    bankid: { personnr: "19900101-9003", fornamn: "Samma", efternamn: "Kod" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { bolag: "E2E Samma Kod AB", orgnr: "556677-9003" },
  });

  await seedAnnons(page, {
    id: "e2e-samekod-annons-a",
    titel: "E2E samma kod A",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 22" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedAnnons(page, {
    id: "e2e-samekod-annons-b",
    titel: "E2E samma kod B",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 23" },
    workflow: { state: "publicerad", timeline: [] },
  });

  // Save listing A as a favorit through the real UI — this is the first
  // point a Köpar-ID should ever get minted for this buyer.
  await page.goto("/annons/e2e-samekod-annons-a");
  await page.getByRole("button", { name: "Spara" }).first().click();
  await expect(page.getByRole("button", { name: "Sparad" }).first()).toBeVisible();

  await page.goto("/admin/sparade/e2e-samekod-annons-a");
  const kodFranFavorit = await page.locator("tbody tr td:first-child").first().textContent();
  expect(kodFranFavorit).toMatch(/^K-\d{4}$/);

  // Declare interest in a *different* listing — the buyer must keep the
  // exact same code, not be assigned a fresh one.
  await page.goto("/annons/e2e-samekod-annons-b");
  await page.getByRole("button", { name: "Interesserad →" }).click();

  await page.goto("/admin/kopare");
  await page
    .locator("details", { has: page.getByText("E2E samma kod B") })
    .locator("summary")
    .click();
  await expect(page.getByText(kodFranFavorit!.trim())).toBeVisible();
});
