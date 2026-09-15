import { test, expect } from "@playwright/test";
import { unlockGate, seedFavorit } from "./helpers";

test("a homepage placeholder listing is seeded as a real annons, so admin can resolve its adress/pris", async ({
  page,
}) => {
  await unlockGate(page);

  // "s2" is one of the homepage's static placeholder listings (Södermalm
  // carousel, see dummy-listings.ts) — never created via the seller
  // onboarding flow. The app seeds it into saljare-annonser on boot (see
  // annons-seed.ts), so admin should be able to resolve its real adress/pris
  // instead of falling back to "Annons #s2" / "Ingen adress angiven".
  await seedFavorit(page, {
    userId: "u_e2e_dummyseed",
    annonsId: "s2",
    titel: "Café med uteservering · SoFo",
    pris: 680000,
    ort: "Stockholm · Södermalm",
    kategori: "Lokal",
    savedAt: new Date().toISOString(),
  });

  await page.goto("/admin/sparade");

  const grupp = page.locator("details", { has: page.getByText("Café med uteservering · SoFo") });
  await expect(grupp.getByText("Skånegatan 71")).toBeVisible();
  await expect(grupp.getByText("680 000 kr")).toBeVisible();
  await expect(grupp.getByText("Annons #s2")).toHaveCount(0);
  await expect(grupp.getByText("Ingen adress angiven")).toHaveCount(0);
});

test("a lokaler.tsx placeholder listing is seeded as a real annons, so admin can resolve its adress/pris", async ({
  page,
}) => {
  await unlockGate(page);

  // "plp1" is one of lokaler.tsx's static placeholder listings (see
  // lokalerSodermalmListings in dummy-listings.ts) — same class of
  // resolution gap as the homepage's dummyListings, fixed the same way.
  await seedFavorit(page, {
    userId: "u_e2e_lokalerseed",
    annonsId: "plp1",
    titel: "Restauranglokal · Hornstull",
    pris: 2250000,
    ort: "Stockholm · Södermalm",
    kategori: "Lokal",
    savedAt: new Date().toISOString(),
  });

  await page.goto("/admin/sparade");

  const grupp = page.locator("details", { has: page.getByText("Restauranglokal · Hornstull") });
  await expect(grupp.getByText("Bergsundsgatan 3")).toBeVisible();
  await expect(grupp.getByText("2 250 000 kr")).toBeVisible();
  await expect(grupp.getByText("Annons #plp1")).toHaveCount(0);
  await expect(grupp.getByText("Ingen adress angiven")).toHaveCount(0);
});
