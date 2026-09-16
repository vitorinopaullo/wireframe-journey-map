import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal, seedSession } from "./helpers";

test('VantarTag shows "Väntar på köparen" for v="dig" and "Väntar på dig" for v="saljare" on the seller\'s Mina affärer list', async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19800101-2101", "Sven", "Saljare");

  await seedAnnons(page, {
    id: "e2e-savt-buyer-annons",
    titel: "E2E vantartag buyer turn",
    agarUserId: "u_198001012101",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 130" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-savt-buyer-interest",
    annonsId: "e2e-savt-buyer-annons",
    kKod: "K-e2e-savtb",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_savt_buyer",
  });
  // kopare hasn't signed yet — vantarFor returns "dig" (the buyer).
  await seedDeal(page, "e2e-savt-buyer-interest", {
    steg: "matchad",
    kopeavtal: {
      skapadAt: new Date().toISOString(),
      skickadAt: new Date().toISOString(),
      signerat: { kopare: false, saljare: false },
    },
  });

  await seedAnnons(page, {
    id: "e2e-savt-seller-annons",
    titel: "E2E vantartag seller turn",
    agarUserId: "u_198001012101",
    pris: "2 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 131" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-savt-seller-interest",
    annonsId: "e2e-savt-seller-annons",
    kKod: "K-e2e-savts",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_savt_seller",
  });
  // kopare has signed, saljare hasn't — vantarFor returns "saljare" (this seller's turn).
  await seedDeal(page, "e2e-savt-seller-interest", {
    steg: "matchad",
    kopeavtal: {
      skapadAt: new Date().toISOString(),
      skickadAt: new Date().toISOString(),
      signerat: { kopare: true, saljare: false },
    },
  });

  await page.goto("/saljare/affarer");

  await expect(page.getByText("Väntar på köparen")).toBeVisible();
  await expect(page.getByText("Väntar på dig", { exact: true })).toBeVisible();
  await expect(page.getByText("Väntar på säljare", { exact: true })).toHaveCount(0);
});

test('the bold-border highlight appears only on the card where vantar === "saljare"', async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19800101-2102", "Bo", "Saljare");

  await seedAnnons(page, {
    id: "e2e-savt-border-buyer-annons",
    titel: "E2E vantartag border buyer turn",
    agarUserId: "u_198001012102",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 132" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-savt-border-buyer-interest",
    annonsId: "e2e-savt-border-buyer-annons",
    kKod: "K-e2e-savtbb",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_savt_border_buyer",
  });
  await seedDeal(page, "e2e-savt-border-buyer-interest", {
    steg: "matchad",
    kopeavtal: {
      skapadAt: new Date().toISOString(),
      skickadAt: new Date().toISOString(),
      signerat: { kopare: false, saljare: false },
    },
  });

  await seedAnnons(page, {
    id: "e2e-savt-border-seller-annons",
    titel: "E2E vantartag border seller turn",
    agarUserId: "u_198001012102",
    pris: "2 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 133" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-savt-border-seller-interest",
    annonsId: "e2e-savt-border-seller-annons",
    kKod: "K-e2e-savtbs",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_savt_border_seller",
  });
  await seedDeal(page, "e2e-savt-border-seller-interest", {
    steg: "matchad",
    kopeavtal: {
      skapadAt: new Date().toISOString(),
      skickadAt: new Date().toISOString(),
      signerat: { kopare: true, saljare: false },
    },
  });

  await page.goto("/saljare/affarer");

  const cards = page.locator("main div.rounded-card.border.border-foreground\\/15.bg-card.p-4");
  await expect(cards).toHaveCount(2);

  const buyerTurnCard = cards.filter({ hasText: "E2E vantartag border buyer turn" });
  const sellerTurnCard = cards.filter({ hasText: "E2E vantartag border seller turn" });

  await expect(buyerTurnCard).not.toHaveClass(/border-2 border-foreground/);
  await expect(sellerTurnCard).toHaveClass(/border-2 border-foreground/);
});
