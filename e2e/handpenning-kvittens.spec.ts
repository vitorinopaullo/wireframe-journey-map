import { test, expect } from "@playwright/test";
import {
  unlockGate,
  seedAnnons,
  seedBuyerInterest,
  seedDeal,
  seedAccount,
  seedSession,
} from "./helpers";

test("TreLink can only create the handpenning-kvittens after both kvitto and UC-utdrag are uploaded", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-kv-gate-annons",
    titel: "E2E kvittens-gate",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 30" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-kv-gate-interest",
    annonsId: "e2e-kv-gate-annons",
    kKod: "K-e2e-kvgate",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_kvgate",
  });

  // Neither upload present yet — no "Skapa kvittens" action.
  await seedDeal(page, "e2e-kv-gate-interest", { steg: "handpenning" });
  await page.goto("/admin/affarer/e2e-kv-gate-interest");
  await expect(page.getByRole("button", { name: "Skapa kvittens →" })).toHaveCount(0);
  await expect(
    page.getByText("Väntar på att köparen laddar upp kvittens och UC-utdrag innan"),
  ).toBeVisible();

  // Only kvitto present — still no action.
  await seedDeal(page, "e2e-kv-gate-interest", {
    steg: "handpenning",
    handpenning: { kvitto: "kvitto.pdf" },
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Skapa kvittens →" })).toHaveCount(0);

  // Both present — action appears.
  await seedDeal(page, "e2e-kv-gate-interest", {
    steg: "handpenning",
    handpenning: { kvitto: "kvitto.pdf", ucUtdrag: "uc.pdf" },
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Skapa kvittens →" })).toBeVisible();
});

test("buyer signing the handpenning-kvittens forwards it to the seller in the same action", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6003", "Sven", "Signant");

  await seedAnnons(page, {
    id: "e2e-kv-sign-annons",
    titel: "E2E kvittens-signering",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 31" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-kv-sign-interest",
    annonsId: "e2e-kv-sign-annons",
    kKod: "K-e2e-kvsign",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501016003",
  });
  await seedDeal(page, "e2e-kv-sign-interest", {
    steg: "handpenning",
    handpenning: {
      kvitto: "kvitto.pdf",
      ucUtdrag: "uc.pdf",
      kvittensSkapadAt: new Date().toISOString(),
      kvittensSkickadAt: new Date().toISOString(),
    },
  });

  await page.goto("/kopare/affarer/e2e-kv-sign-interest");
  await expect(page.getByText("TreLink har upprättat en kvittens")).toBeVisible();

  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Signera kvittens →" }).click();

  await expect(
    page.getByText("Du har signerat kvittensen. Den är skickad till säljaren."),
  ).toBeVisible();

  // The forwarding to the seller happens in the same click, not a separate step.
  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-kv-sign-interest"];
  });
  expect(deal.handpenning.kvittensSigneradAt).toBeTruthy();
  expect(deal.handpenning.kvittensSkickadTillSaljareAt).toBeTruthy();
});

test("the köpeavtal's Undertecknare section shows the fallback contact when the buyer isn't firmatecknare", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-undertecknare-annons",
    titel: "E2E undertecknare",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 32" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedAccount(page, {
    id: "e2e-acc-undertecknare",
    userId: "u_e2e_ut",
    bankid: { personnr: "19850101-6004", fornamn: "Ej", efternamn: "Firmatecknare" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { bolag: "Undertecknare Test AB" },
  });
  await seedBuyerInterest(page, {
    id: "e2e-undertecknare-interest",
    annonsId: "e2e-undertecknare-annons",
    kKod: "K-e2e-ut",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_ut",
  });
  await seedDeal(page, "e2e-undertecknare-interest", {
    steg: "matchad",
    granskning: {
      firmatecknare: false,
      ftRoll: "VD",
      ftFornamn: "Anna",
      ftEfternamn: "Ombud",
      ftMail: "anna@example.com",
      ftMobil: "0701234567",
    },
  });

  await page.goto("/admin/affarer/e2e-undertecknare-interest");
  await page.getByRole("button", { name: "Skapa köpeavtal →" }).click();

  await expect(page.getByText("Undertecknare", { exact: true })).toBeVisible();
  await expect(page.getByText("Anna Ombud (VD)")).toBeVisible();
});
