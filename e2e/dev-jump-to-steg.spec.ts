import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal } from "./helpers";

test("dev hoppa till steg on signering backfills kopeavtal, handpenning and hyresvard", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-devjump-signering-annons",
    titel: "E2E devjump signering",
    agarUserId: "e2e-devjump-seller1",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 200" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-devjump-signering-interest",
    annonsId: "e2e-devjump-signering-annons",
    kKod: "K-e2e-djs",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_devjump_signering",
  });
  await seedDeal(page, "e2e-devjump-signering-interest", { steg: "granskning" });

  await page.goto("/admin/affarer/e2e-devjump-signering-interest");
  await page.getByRole("combobox").selectOption("signering");

  await expect(page.getByText("Överenskommelse om överlåtelse", { exact: true })).toBeVisible();

  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-devjump-signering-interest"];
  });

  expect(deal.steg).toBe("signering");
  expect(deal.kopeavtal?.signerat.kopare).toBe(true);
  expect(deal.kopeavtal?.signerat.saljare).toBe(true);
  expect(deal.handpenning?.bekraftadMottagenAt).toBeTruthy();
  expect(deal.handpenning?.kvittensSigneradAt).toBeTruthy();
  expect(deal.hyresvard?.besked).toBe("godkand");
  expect(deal.overenskommelse?.skapadAt).toBeTruthy();
});

test("dev hoppa till steg on matchad only populates kopeavtal, not later steps", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-devjump-matchad-annons",
    titel: "E2E devjump matchad",
    agarUserId: "e2e-devjump-seller2",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 201" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-devjump-matchad-interest",
    annonsId: "e2e-devjump-matchad-annons",
    kKod: "K-e2e-djm",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_devjump_matchad",
  });
  await seedDeal(page, "e2e-devjump-matchad-interest", { steg: "granskning" });

  await page.goto("/admin/affarer/e2e-devjump-matchad-interest");
  await page.getByRole("combobox").selectOption("matchad");

  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-devjump-matchad-interest"];
  });

  expect(deal.steg).toBe("matchad");
  expect(deal.kopeavtal?.signerat.kopare).toBe(true);
  expect(deal.kopeavtal?.signerat.saljare).toBe(true);
  expect(deal.handpenning).toBeUndefined();
  expect(deal.hyresvard).toBeUndefined();
  expect(deal.likvid).toBeUndefined();
  expect(deal.overenskommelse).toBeUndefined();
});
