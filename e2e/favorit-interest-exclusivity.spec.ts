import { test, expect } from "@playwright/test";
import {
  unlockGate,
  seedAnnons,
  seedFavorit,
  seedBuyerInterest,
  seedAccount,
  seedSession,
} from "./helpers";

test("declaring interest from the favoriter page removes the favorit and creates a lead", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-5001", "Ex", "Empel");

  await seedAnnons(page, {
    id: "e2e-fav-int-annons",
    titel: "E2E favorit till intresse",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 6" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedFavorit(page, {
    userId: "u_198501015001",
    annonsId: "e2e-fav-int-annons",
    titel: "E2E favorit till intresse",
    pris: 900000,
    ort: "Stockholm",
    kategori: "Lokal",
    savedAt: new Date().toISOString(),
  });

  await page.goto("/kopare/favoriter");
  await expect(page.getByText("E2E favorit till intresse")).toBeVisible();

  await page.getByRole("link", { name: "Anmäl intresse" }).click();
  await page.waitForURL(/\/annons\/e2e-fav-int-annons\/underlag/);

  await page.goto("/kopare/favoriter");
  await expect(page.getByText("E2E favorit till intresse")).toHaveCount(0);

  await page.goto("/admin/sparade");
  await expect(page.getByText("E2E favorit till intresse")).toHaveCount(0);

  await page.goto("/admin/kopare");
  await expect(page.getByText("E2E favorit till intresse")).toBeVisible();
});

test("buying via annons.$id.index.tsx removes a favorit for the same listing", async ({ page }) => {
  await unlockGate(page);
  await seedSession(page, "19850101-5002", "Ex", "Empel2");
  await seedAccount(page, {
    id: "e2e-acc-buy1",
    userId: "u_198501015002",
    bankid: { personnr: "19850101-5002", fornamn: "Ex", efternamn: "Empel2" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { bolag: "E2E Köpar AB", orgnr: "556677-1010" },
  });

  await seedAnnons(page, {
    id: "e2e-buy1-annons",
    titel: "E2E köp via annonssida",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 7" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedFavorit(page, {
    userId: "u_198501015002",
    annonsId: "e2e-buy1-annons",
    titel: "E2E köp via annonssida",
    pris: 900000,
    ort: "Stockholm",
    kategori: "Lokal",
    savedAt: new Date().toISOString(),
  });
  await seedBuyerInterest(page, {
    id: "e2e-buy1-interest",
    annonsId: "e2e-buy1-annons",
    kKod: "K-e2ebuy1",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_198501015002",
  });

  await page.goto("/annons/e2e-buy1-annons");
  await page.getByRole("button", { name: "Köp →" }).click();
  await expect(page.getByText("Du vill köpa — TreLink hör av sig.")).toBeVisible();

  const favoriter = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("kopare-favoriter") ?? "[]"),
  );
  expect(favoriter.some((f: { annonsId: string }) => f.annonsId === "e2e-buy1-annons")).toBe(false);
});

test("buying via annons.$id.underlag.tsx removes a favorit for the same listing", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-5003", "Ex", "Empel3");
  await seedAccount(page, {
    id: "e2e-acc-buy2",
    userId: "u_198501015003",
    bankid: { personnr: "19850101-5003", fornamn: "Ex", efternamn: "Empel3" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { bolag: "E2E Köpar AB 2", orgnr: "556677-2020" },
  });

  await seedAnnons(page, {
    id: "e2e-buy2-annons",
    titel: "E2E köp via underlagssida",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 8" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedFavorit(page, {
    userId: "u_198501015003",
    annonsId: "e2e-buy2-annons",
    titel: "E2E köp via underlagssida",
    pris: 900000,
    ort: "Stockholm",
    kategori: "Lokal",
    savedAt: new Date().toISOString(),
  });
  await seedBuyerInterest(page, {
    id: "e2e-buy2-interest",
    annonsId: "e2e-buy2-annons",
    kKod: "K-e2ebuy2",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_198501015003",
  });

  await page.goto("/annons/e2e-buy2-annons/underlag");
  await page.getByRole("button", { name: "Öppna PDF" }).click();
  await page.getByRole("button", { name: "Köp →" }).click();
  await expect(page.getByText("Intresse registrerat")).toBeVisible();

  const favoriter = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("kopare-favoriter") ?? "[]"),
  );
  expect(favoriter.some((f: { annonsId: string }) => f.annonsId === "e2e-buy2-annons")).toBe(false);
});

test("saving a listing increments the Sparade nav badge, which clears on visit", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-5004", "Ex", "Empel4");

  await seedAnnons(page, {
    id: "e2e-save-badge-annons",
    titel: "E2E badge-test",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 9" },
    workflow: { state: "publicerad", timeline: [] },
  });

  await page.goto("/annons/e2e-save-badge-annons");
  await page.getByRole("button", { name: "Spara" }).first().click();
  await expect(page.getByRole("button", { name: "Sparad" }).first()).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("link", { name: /Sparade\s*\d+/ })).toBeVisible();

  await page.goto("/admin/sparade");
  await expect(page.getByText("E2E badge-test")).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("link", { name: "Sparade" })).toBeVisible();
});
