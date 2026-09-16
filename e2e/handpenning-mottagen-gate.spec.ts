import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal } from "./helpers";

test('"Handpenning mottagen" stays hidden until both kvittens signatures are in place, even with kvitto/UC-utdrag already uploaded', async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-hmg-annons",
    titel: "E2E handpenning mottagen gate",
    agarUserId: "u_e2e_hmg_seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 120" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-hmg-interest",
    annonsId: "e2e-hmg-annons",
    kKod: "K-e2e-hmg",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_hmg",
  });

  // Uploads present, kvittens sent, but neither party has signed yet.
  await seedDeal(page, "e2e-hmg-interest", {
    steg: "handpenning",
    handpenning: {
      kvitto: "kvitto.pdf",
      ucUtdrag: "uc.pdf",
      kvittensSkapadAt: new Date().toISOString(),
      kvittensSkickadAt: new Date().toISOString(),
    },
  });
  await page.goto("/admin/affarer/e2e-hmg-interest");
  await expect(page.getByRole("button", { name: "Handpenning mottagen →" })).toHaveCount(0);
  await expect(page.getByText("Väntar på att köparen och säljaren signerar")).toBeVisible();

  // Only the buyer has signed — still hidden.
  await seedDeal(page, "e2e-hmg-interest", {
    steg: "handpenning",
    handpenning: {
      kvitto: "kvitto.pdf",
      ucUtdrag: "uc.pdf",
      kvittensSkapadAt: new Date().toISOString(),
      kvittensSkickadAt: new Date().toISOString(),
      kvittensSignerat: { kopare: true, saljare: false },
    },
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Handpenning mottagen →" })).toHaveCount(0);

  // Both parties have signed — the action appears and works.
  await seedDeal(page, "e2e-hmg-interest", {
    steg: "handpenning",
    handpenning: {
      kvitto: "kvitto.pdf",
      ucUtdrag: "uc.pdf",
      kvittensSkapadAt: new Date().toISOString(),
      kvittensSkickadAt: new Date().toISOString(),
      kvittensSignerat: { kopare: true, saljare: true },
    },
  });
  await page.reload();
  await page.getByRole("button", { name: "Handpenning mottagen →" }).click();

  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-hmg-interest"];
  });
  expect(deal.steg).toBe("hyresvard");
});
