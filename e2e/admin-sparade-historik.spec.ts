import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedAccount, seedSession } from "./helpers";

test("converting a saved favorit to an interest still shows the buyer under Historik on the per-annons Sparade page", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19900101-9101", "Hist", "Konvertsson");
  await seedAccount(page, {
    id: "e2e-acc-histconvert",
    userId: "u_199001019101",
    bankid: { personnr: "19900101-9101", fornamn: "Hist", efternamn: "Konvertsson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { bolag: "E2E Hist AB", orgnr: "556677-9101" },
  });
  await seedAnnons(page, {
    id: "e2e-histconvert-annons",
    titel: "E2E historik vid konvertering",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 24" },
    workflow: { state: "publicerad", timeline: [] },
  });

  await page.goto("/annons/e2e-histconvert-annons");
  await page.getByRole("button", { name: "Spara" }).first().click();
  await expect(page.getByRole("button", { name: "Sparad" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Interesserad →" }).first().click();

  await page.goto("/admin/sparade/e2e-histconvert-annons");

  // The buyer is gone from the live favoriter table …
  await expect(page.getByText("Inga sparade favoriter kvar för den här annonsen.")).toBeVisible();

  // … but still shows up in Historik with both events, newest first.
  await expect(page.getByText("Omvandlades till intresseanmälan")).toBeVisible();
  await expect(page.getByText("Sparade som favorit")).toBeVisible();
});

test("an annons with zero current favoriter but existing history still appears on the main Sparade list", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19900101-9102", "Hist", "Bortkonverterad");
  await seedAccount(page, {
    id: "e2e-acc-histgone",
    userId: "u_199001019102",
    bankid: { personnr: "19900101-9102", fornamn: "Hist", efternamn: "Bortkonverterad" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { bolag: "E2E Hist AB 2", orgnr: "556677-9102" },
  });
  await seedAnnons(page, {
    id: "e2e-histgone-annons",
    titel: "E2E historik utan aktiva favoriter",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 25" },
    workflow: { state: "publicerad", timeline: [] },
  });

  await page.goto("/annons/e2e-histgone-annons");
  await page.getByRole("button", { name: "Spara" }).first().click();
  await expect(page.getByRole("button", { name: "Sparad" }).first()).toBeVisible();
  // Unsave it again — no current favorit remains, only history.
  await page.getByRole("button", { name: "Sparad" }).first().click();
  await expect(page.getByRole("button", { name: "Spara" }).first()).toBeVisible();

  await page.goto("/admin/sparade");
  const rad = page.locator("tr", { has: page.getByText("E2E historik utan aktiva favoriter") });
  await expect(rad.getByText("0 sparade nu")).toBeVisible();
  await expect(rad.getByText(/i historik/)).toBeVisible();
});

test("adding a note on the admin account page persists and displays with a timestamp", async ({
  page,
}) => {
  await unlockGate(page);
  await seedAccount(page, {
    id: "e2e-acc-notering",
    userId: "u_e2e_notering",
    bankid: { personnr: "19900101-9103", fornamn: "Note", efternamn: "Ringsson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { telefon: "070-1231231", epost: "note-e2e@example.com" },
  });

  await page.goto("/admin/anvandare/e2e-acc-notering");
  await expect(page.getByText("Inga anteckningar än.")).toBeVisible();

  await page
    .getByPlaceholder("T.ex. Ringde 2026-09-11, ville tänka en vecka till")
    .fill("Ringde 2026-09-11, ville tänka en vecka till");
  await page.getByRole("button", { name: "Logga" }).click();

  await expect(page.getByText("Ringde 2026-09-11, ville tänka en vecka till")).toBeVisible();
  await expect(page.getByText("Inga anteckningar än.")).toHaveCount(0);

  const noteringar = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("trelink-admin-noteringar") ?? "[]"),
  );
  expect(noteringar).toHaveLength(1);
  expect(noteringar[0].userId).toBe("u_e2e_notering");
  expect(noteringar[0].ts).toBeTruthy();
});
