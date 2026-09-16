import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal } from "./helpers";

const STEPPER_SELECTOR = "div.grid.grid-cols-4.gap-1.md\\:grid-cols-7";

test("the Progress stepper renders exactly 7 boxes, not 9", async ({ page }) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-stepper-trim-count-annons",
    titel: "E2E stepper trim count",
    agarUserId: "u_e2e_stepper_trim_count_seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 140" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-stepper-trim-count-interest",
    annonsId: "e2e-stepper-trim-count-annons",
    kKod: "K-e2e-stc",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_stepper_trim_count",
  });
  await seedDeal(page, "e2e-stepper-trim-count-interest", { steg: "matchad" });

  await page.goto("/admin/affarer/e2e-stepper-trim-count-interest");

  const stepper = page.locator(STEPPER_SELECTOR);
  await expect(stepper).toBeVisible();
  await expect(stepper.locator("> div")).toHaveCount(7);
  await expect(stepper.getByText("Tillträde", { exact: true })).toHaveCount(0);
  await expect(stepper.getByText("Klar", { exact: true })).toHaveCount(0);
});

test('a deal at steg "klar" shows Signering as the completed final state in the Progress stepper', async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-stepper-trim-klar-annons",
    titel: "E2E stepper trim klar",
    agarUserId: "u_e2e_stepper_trim_klar_seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 141" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-stepper-trim-klar-interest",
    annonsId: "e2e-stepper-trim-klar-annons",
    kKod: "K-e2e-stk",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_stepper_trim_klar",
  });
  await seedDeal(page, "e2e-stepper-trim-klar-interest", { steg: "klar" });

  await page.goto("/admin/affarer/e2e-stepper-trim-klar-interest");

  const stepper = page.locator(STEPPER_SELECTOR);
  await expect(stepper.locator("> div")).toHaveCount(7);

  const signeringBox = stepper.locator("> div").filter({ hasText: "Signering" });
  await expect(signeringBox).toBeVisible();
  const signeringDot = signeringBox.locator("span").first();
  await expect(signeringDot).toHaveClass(/bg-\[var\(--color-success\)\]/);
});
