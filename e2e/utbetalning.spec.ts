import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal } from "./helpers";

async function switchToSeller(page: import("@playwright/test").Page, sellerUserId: string) {
  await page.evaluate((userId) => {
    sessionStorage.setItem(
      "trelink-session",
      JSON.stringify({
        userId,
        bankid: {
          personnr: "19800101-0000",
          fornamn: "Sven",
          efternamn: "Saljarsson",
          verifieradAt: Date.now(),
        },
        createdAt: Date.now(),
      }),
    );
  }, sellerUserId);
}

test("Bekräfta utbetalning is only available once arvode has been lyft", async ({ page }) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-utbet-gate-annons",
    titel: "E2E utbetalning gate",
    agarUserId: "u_e2e_utbet_gate_seller",
    pris: "3 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 110" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-utbet-gate-interest",
    annonsId: "e2e-utbet-gate-annons",
    kKod: "K-e2e-ug",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_utbet_gate",
  });
  await seedDeal(page, "e2e-utbet-gate-interest", { steg: "klar" });

  // Before lyftArvode, there is no payout confirmation action at all.
  await page.goto("/admin/affarer/e2e-utbet-gate-interest");
  await expect(
    page.getByRole("button", { name: "Bekräfta utbetalning till säljaren →" }),
  ).toHaveCount(0);

  // After lyftArvode, the action appears.
  await page.getByRole("button", { name: "Lyft arvode →" }).click();
  await page.getByRole("button", { name: "Bekräfta och skicka till säljaren →" }).click();
  await expect(
    page.getByRole("button", { name: "Bekräfta utbetalning till säljaren →" }),
  ).toBeVisible();
});

test("bekraftaUtbetalning fires a notification and the seller's page reflects the confirmed state", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-utbet-confirm-annons",
    titel: "E2E utbetalning confirm",
    agarUserId: "u_e2e_utbet_confirm_seller",
    pris: "3 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 111" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-utbet-confirm-interest",
    annonsId: "e2e-utbet-confirm-annons",
    kKod: "K-e2e-uc",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_utbet_confirm",
  });
  await seedDeal(page, "e2e-utbet-confirm-interest", {
    steg: "klar",
    arvode: {
      belopp: 300000,
      lyftAt: new Date().toISOString(),
      kvittensSkapadAt: new Date().toISOString(),
    },
  });

  // Seller sees "Utbetalning väntar" before confirmation.
  await switchToSeller(page, "u_e2e_utbet_confirm_seller");
  await page.goto("/saljare/affarer/e2e-utbet-confirm-interest");
  await expect(page.getByText("Utbetalning väntar.")).toBeVisible();

  // Admin confirms the payout.
  await page.goto("/admin/affarer/e2e-utbet-confirm-interest");
  await page.getByRole("button", { name: "Bekräfta utbetalning till säljaren →" }).click();

  const notiser = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("trelink-admin-notiser") ?? "[]"),
  );
  const utbetalningNotis = notiser.find(
    (n: { lank?: string; kategori?: string }) =>
      n.lank === "/saljare/affarer/e2e-utbet-confirm-interest" && n.kategori === "saljare-affar",
  );
  expect(utbetalningNotis?.text).toContain("Utbetalning genomförd");
  expect(utbetalningNotis?.text).toMatch(/300.000 kr/);

  // The seller's own page now reflects the confirmed state.
  await switchToSeller(page, "u_e2e_utbet_confirm_seller");
  await page.goto("/saljare/affarer/e2e-utbet-confirm-interest");
  await expect(page.getByText("Utbetalning genomförd,")).toBeVisible();
});
