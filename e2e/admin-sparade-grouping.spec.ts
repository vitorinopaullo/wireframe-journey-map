import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedFavorit, seedAccount, seedSession } from "./helpers";

test("admin.sparade groups favoriter by annons into an expandable group, matching Intressenter/Affärer", async ({
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
    profil: { telefon: "0701112233", epost: "sparade1@example.com" },
  });
  await seedAccount(page, {
    id: "e2e-acc-sparade-2",
    userId: "u_e2e_sparade2",
    bankid: { personnr: "19900101-9002", fornamn: "Sparade", efternamn: "Tvason" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { telefon: "0704445566", epost: "sparade2@example.com" },
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

  const grupp = page.locator("details", { has: page.getByText("E2E flera sparade") });
  await expect(grupp.getByText("2 sparade")).toBeVisible();
  await expect(grupp.getByText("TRL-")).toBeVisible();
  await expect(grupp.getByText("Ettson")).toBeHidden();

  await grupp.locator("summary").click();

  await expect(grupp.getByText("Sparade Ettson")).toBeVisible();
  await expect(grupp.getByText("Sparade Tvason")).toBeVisible();
  await expect(grupp.getByText("070 11 122 33")).toBeVisible();
  await expect(grupp.getByText("sparade1@example.com")).toBeVisible();
  await expect(grupp.getByText("070 44 455 66")).toBeVisible();
  await expect(grupp.getByText("sparade2@example.com")).toBeVisible();

  const kKoder = await grupp.locator("tbody tr td:nth-child(2)").allTextContents();
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

  await page.goto("/admin/sparade");
  const gruppA = page.locator("details", { has: page.getByText("E2E samma kod A") });
  await gruppA.locator("summary").click();
  const kodFranFavorit = await gruppA.locator("tbody tr td:nth-child(2)").first().textContent();
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
