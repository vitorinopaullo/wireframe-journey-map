import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal } from "./helpers";

test("steg only advances to tilltrade once all three parties have signed the overenskommelse", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-otp-advance-annons",
    titel: "E2E overenskommelse tre parter advance",
    agarUserId: "u_e2e_otp_advance_seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 80" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-otp-advance-interest",
    annonsId: "e2e-otp-advance-annons",
    kKod: "K-e2e-otpa",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_otp_advance",
  });
  await seedDeal(page, "e2e-otp-advance-interest", {
    steg: "signering",
    overenskommelse: {
      skapadAt: new Date().toISOString(),
      skickadAt: new Date().toISOString(),
      signerat: { kopare: true, saljare: true, hyresvard: false },
    },
  });

  // Both köpare and säljare have signed, but steg has NOT advanced yet —
  // hyresvard is still missing.
  await page.goto("/admin/affarer/e2e-otp-advance-interest");
  await expect(page.getByRole("button", { name: "Bekräfta tillträde →" })).toHaveCount(0);
  let deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-otp-advance-interest"];
  });
  expect(deal.steg).toBe("signering");

  // Admin simulates the hyresvard signature via the SignicatFlow modal.
  await page
    .getByRole("button", { name: "Hyresvärdens signering (simulerad av TreLink) →" })
    .click();
  await page.getByRole("button", { name: "Sign documents" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "Tillbaka till min annons" })).toBeVisible({
    timeout: 5000,
  });
  await page.getByRole("button", { name: "Tillbaka till min annons" }).click();

  await expect(page.getByRole("button", { name: "Bekräfta tillträde →" })).toBeVisible();
  deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-otp-advance-interest"];
  });
  expect(deal.steg).toBe("tilltrade");
  expect(deal.overenskommelse.signerat).toEqual({ kopare: true, saljare: true, hyresvard: true });
});

test("admin's simulated hyresvard-signing action only appears once both köpare and säljare have signed", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-otp-gate-annons",
    titel: "E2E overenskommelse tre parter gate",
    agarUserId: "u_e2e_otp_gate_seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 81" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-otp-gate-interest",
    annonsId: "e2e-otp-gate-annons",
    kKod: "K-e2e-otpg",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_otp_gate",
  });

  // Only köpare has signed so far — the hyresvard action must not appear.
  await seedDeal(page, "e2e-otp-gate-interest", {
    steg: "signering",
    overenskommelse: {
      skapadAt: new Date().toISOString(),
      skickadAt: new Date().toISOString(),
      signerat: { kopare: true, saljare: false, hyresvard: false },
    },
  });
  await page.goto("/admin/affarer/e2e-otp-gate-interest");
  await expect(
    page.getByRole("button", { name: "Hyresvärdens signering (simulerad av TreLink) →" }),
  ).toHaveCount(0);

  // Once säljare has also signed, the action appears.
  await seedDeal(page, "e2e-otp-gate-interest", {
    steg: "signering",
    overenskommelse: {
      skapadAt: new Date().toISOString(),
      skickadAt: new Date().toISOString(),
      signerat: { kopare: true, saljare: true, hyresvard: false },
    },
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Hyresvärdens signering (simulerad av TreLink) →" }),
  ).toBeVisible();
});
