import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal } from "./helpers";

const ANNONS_AVBOJT = "e2e-ombokning-avbojt-annons";
const ANNONS_HYRESVARD = "e2e-ombokning-hyresvard-annons";
const INTEREST_AVBOJT = "e2e-ombokning-avbojt-interest";
const INTEREST_HYRESVARD = "e2e-ombokning-hyresvard-interest";

test("Ombokning toggle works for avbojt leads and is absent on hyresvard-nekad rows", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: ANNONS_AVBOJT,
    titel: "E2E avvisad av köpare",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 4" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedAnnons(page, {
    id: ANNONS_HYRESVARD,
    titel: "E2E nekad av hyresvärd",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 5" },
    workflow: { state: "publicerad", timeline: [] },
  });

  await seedBuyerInterest(page, {
    id: INTEREST_AVBOJT,
    annonsId: ANNONS_AVBOJT,
    kKod: "K-e2e-ombokning-avbojt",
    status: "avböjt",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_ombokning_avbojt",
  });
  await seedBuyerInterest(page, {
    id: INTEREST_HYRESVARD,
    annonsId: ANNONS_HYRESVARD,
    kKod: "K-e2e-ombokning-hyresvard",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_ombokning_hyresvard",
  });
  await seedDeal(page, INTEREST_HYRESVARD, { avvisad: true });

  await page.goto("/admin/affarer");

  const avbojtRow = page
    .locator('h3:text-is("E2E avvisad av köpare")')
    .locator('xpath=ancestor::div[contains(@class,"justify-between")][1]');
  const hyresvardRow = page
    .locator('h3:text-is("E2E nekad av hyresvärd")')
    .locator('xpath=ancestor::div[contains(@class,"justify-between")][1]');

  const ombokningBtn = avbojtRow.getByRole("button", { name: "Märk för ombokning" });
  await expect(ombokningBtn).toBeVisible();
  await expect(hyresvardRow.getByRole("button", { name: "Märk för ombokning" })).toHaveCount(0);

  await ombokningBtn.click();

  await expect(avbojtRow.getByText("Märkt")).toBeVisible();
  await expect(ombokningBtn).toBeHidden();
});
