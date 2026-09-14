import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal, seedSession } from "./helpers";

test("hyresvard godkänd advances to steg likvid, not directly to signering", async ({ page }) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-hv-annons",
    titel: "E2E hyresvärd godkänd",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 40" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-hv-interest",
    annonsId: "e2e-hv-annons",
    kKod: "K-e2e-hv",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_hv",
  });
  await seedDeal(page, "e2e-hv-interest", {
    steg: "hyresvard",
    hyresvard: { skickadAt: new Date().toISOString() },
  });

  await page.goto("/admin/affarer/e2e-hv-interest");
  await page.getByRole("button", { name: "Hyresvärd godkände" }).click();

  await expect(page.getByText("Begär in resterande likvid")).toBeVisible();
  await expect(page.getByText("Överenskommelse om överlåtelse", { exact: true })).toHaveCount(0);

  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-hv-interest"];
  });
  expect(deal.steg).toBe("likvid");
});

test("the full likvid chain ends with steg signering", async ({ page }) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6005", "Liv", "Idsson");

  await seedAnnons(page, {
    id: "e2e-likchain-annons",
    titel: "E2E likvidkedja",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 41" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-likchain-interest",
    annonsId: "e2e-likchain-annons",
    kKod: "K-e2e-likchain",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501016005",
  });
  await seedDeal(page, "e2e-likchain-interest", { steg: "likvid" });

  // begarLikvid
  await page.goto("/admin/affarer/e2e-likchain-interest");
  await page.getByRole("button", { name: "Begär likvid →" }).click();

  // lamnaLikvid (buyer)
  await page.goto("/kopare/affarer/e2e-likchain-interest");
  await page.getByRole("spinbutton").fill("900000");
  await page.getByRole("button", { name: "Skicka in →" }).click();
  await expect(page.getByText("Väntar på att TreLink verifierar beloppet.")).toBeVisible();

  // verifieraLikvid + skapa/skickaLikvidKvittens (admin)
  await page.goto("/admin/affarer/e2e-likchain-interest");
  await expect(page.getByText("900 000 kr").first()).toBeVisible();
  await page.getByRole("button", { name: "Bekräfta rätt belopp →" }).click();
  await page.getByRole("button", { name: "Skapa kvittens →" }).click();
  await page.getByRole("button", { name: "Skicka till köparen (mejl) →" }).click();

  await expect(page.getByText("Överenskommelse om överlåtelse", { exact: true })).toBeVisible();

  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-likchain-interest"];
  });
  expect(deal.steg).toBe("signering");
  expect(deal.likvid.begartAt).toBeTruthy();
  expect(deal.likvid.inlamnadAt).toBeTruthy();
  expect(deal.likvid.verifieratAt).toBeTruthy();
  expect(deal.likvid.kvittensSkapadAt).toBeTruthy();
  expect(deal.likvid.kvittensSkickadAt).toBeTruthy();

  // The buyer should still see the receipt read-only now that steg has moved on.
  await page.goto("/kopare/affarer/e2e-likchain-interest");
  await expect(page.getByText("900 000 kr").first()).toBeVisible();
});

test("lyftArvode computes 10% of pris and is only available once steg is klar", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-arvode-annons",
    titel: "E2E arvode",
    agarUserId: "e2e-seller",
    pris: "3 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 42" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-arvode-interest",
    annonsId: "e2e-arvode-annons",
    kKod: "K-e2e-arvode",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_arvode",
  });

  // Not yet klar — no Arvode action.
  await seedDeal(page, "e2e-arvode-interest", { steg: "tilltrade" });
  await page.goto("/admin/affarer/e2e-arvode-interest");
  await expect(page.getByRole("button", { name: "Lyft arvode →" })).toHaveCount(0);

  // Klar — action appears and computes 10% correctly.
  await seedDeal(page, "e2e-arvode-interest", { steg: "klar" });
  await page.reload();
  await page.getByRole("button", { name: "Lyft arvode →" }).click();
  await expect(page.getByText("300 000 kr").first()).toBeVisible();
  await page.getByRole("button", { name: "Bekräfta och skicka till säljaren →" }).click();

  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-arvode-interest"];
  });
  expect(deal.arvode.belopp).toBe(300000);
  expect(deal.arvode.lyftAt).toBeTruthy();
  expect(deal.arvode.kvittensSkapadAt).toBeTruthy();
});
