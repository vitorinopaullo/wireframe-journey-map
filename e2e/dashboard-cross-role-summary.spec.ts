import { test, expect } from "@playwright/test";
import {
  unlockGate,
  seedSession,
  seedAnnons,
  seedBuyerInterest,
  seedDeal,
  seedFavorit,
} from "./helpers";

test("seller's dashboard shows inviting copy in Som köpare when the seller has no buyer-side activity", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6101", "Sara", "Saljare", "saljare");

  await page.goto("/dashboard?mode=saljare");
  const box = page.locator("main").getByText("Som köpare").locator("..");
  await expect(box.getByText("Vill du också köpa en verksamhet?")).toBeVisible();
  await expect(box.getByText("pågående affärer")).toHaveCount(0);
});

test("seller's dashboard shows real buyer-side counts in Som köpare when the seller also has buyer activity", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6102", "Bo", "Saljare", "saljare");
  const userId = "u_198501016102";

  await seedAnnons(page, {
    id: "e2e-crs-annons-1",
    titel: "E2E cross-role summary 1",
    agarUserId: "u_e2e_other_seller_crs1",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 400" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-crs-interest-1",
    annonsId: "e2e-crs-annons-1",
    kKod: "K-e2e-crs1",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId,
  });
  await seedDeal(page, "e2e-crs-interest-1", { steg: "matchad" });
  await seedFavorit(page, {
    userId,
    annonsId: "e2e-crs-annons-1",
    titel: "E2E cross-role summary 1",
    pris: 1000000,
    ort: "Stockholm",
    kategori: "overlatelse",
    savedAt: new Date().toISOString(),
  });

  await page.goto("/dashboard?mode=saljare");
  const box = page.locator("main").getByText("Som köpare").locator("..");
  await expect(box.getByText("1 pågående affärer · 1 sparade objekt")).toBeVisible();

  await box.getByRole("link", { name: "Byt till köparläge" }).click();
  await expect(page).toHaveURL(/\/dashboard\?mode=kopare/);
});

test("buyer's dashboard shows inviting copy in Som säljare when the buyer has no seller-side activity", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19900202-6103", "Kim", "Kopare", "kopare");

  await page.goto("/dashboard?mode=kopare");
  const box = page.locator("main").getByText("Som säljare").locator("..");
  await expect(box.getByText("Vill du också sälja en verksamhet?")).toBeVisible();
  await expect(box.getByText("pågående affärer")).toHaveCount(0);
});

test("buyer's dashboard shows real seller-side counts in Som säljare when the buyer also has seller activity", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19900202-6104", "Alex", "Kopare", "kopare");
  const userId = "u_199002026104";

  await seedAnnons(page, {
    id: "e2e-crs-annons-2",
    titel: "E2E cross-role summary 2",
    agarUserId: userId,
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 401" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-crs-interest-2",
    annonsId: "e2e-crs-annons-2",
    kKod: "K-e2e-crs2",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_other_buyer_crs2",
  });
  await seedDeal(page, "e2e-crs-interest-2", { steg: "matchad" });

  await page.goto("/dashboard?mode=kopare");
  const box = page.locator("main").getByText("Som säljare").locator("..");
  await expect(box.getByText("1 annonser · 1 pågående affärer")).toBeVisible();

  await box.getByRole("link", { name: "Byt till säljarläge" }).click();
  await expect(page).toHaveURL(/\/dashboard\?mode=saljare/);
});
