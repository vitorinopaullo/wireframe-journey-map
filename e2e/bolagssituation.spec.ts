import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal, seedSession } from "./helpers";

test("choosing Vill göra aktieaffär immediately upgrades the annons's category and requests komplettering", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6010", "Bo", "Lagsson");

  await seedAnnons(page, {
    id: "e2e-aktieaffar-annons",
    titel: "E2E aktieaffär",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "inkram",
    draft: { cat: "inkram", verksamhet: "Restaurang", adress: "E2E-gatan 50" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-aktieaffar-interest",
    annonsId: "e2e-aktieaffar-annons",
    kKod: "K-e2e-aktieaffar",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501016010",
  });

  await page.goto("/kopare/affarer/e2e-aktieaffar-interest");
  await page.getByRole("radio", { name: "Vill göra aktieaffär" }).click();

  await expect(page.getByText("Annonsen har uppgraderats till Aktieöverlåtelse.")).toBeVisible();

  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-aktieaffar-interest"];
  });
  expect(deal.granskning.bolagssituation).toBe("aktieaffar");

  const annons = await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("saljare-annonser") ?? "[]");
    return list.find((a: { id: string }) => a.id === "e2e-aktieaffar-annons");
  });
  expect(annons.cat).toBe("aktie");
  expect(annons.draft.cat).toBe("aktie");
  expect(annons.workflow.state).toBe("komplettering");
  expect(annons.workflow.komplettering?.message).toContain("registreringsbevis");
});

test("choosing Nej, inte än shows the buyer's real BankID personnummer and confirming it satisfies the checklist instead of firmatecknare", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19900202-1212", "Nina", "Persson");

  await seedAnnons(page, {
    id: "e2e-privat-annons",
    titel: "E2E privatperson",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 51" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-privat-interest",
    annonsId: "e2e-privat-annons",
    kKod: "K-e2e-privat",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_199002021212",
  });
  await seedDeal(page, "e2e-privat-interest", {
    steg: "granskning",
    granskning: { kycDokument: "kyc.pdf", foretagspresentation: "pres.pdf" },
  });

  await page.goto("/kopare/affarer/e2e-privat-interest");
  await page.getByRole("radio", { name: "Nej, inte än" }).click();
  await expect(page.getByText("19900202-1212")).toBeVisible();

  await page.getByRole("button", { name: "Bekräfta →" }).click();
  await expect(page.getByText("Bekräftat.")).toBeVisible();

  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-privat-interest"];
  });
  expect(deal.granskning.bolagssituation).toBe("privat");
  expect(deal.granskning.personnummerBekraftat).toBe(true);

  await page.goto("/admin/affarer/e2e-privat-interest");
  await expect(page.getByText("Personnummer bekräftat", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Firmatecknare bekräftad")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Matcha köpare →" })).toBeEnabled();
});

test("choosing Ja, jag har bolag still requires firmatecknare confirmation as before", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19750303-3030", "Erik", "Karlsson");

  await seedAnnons(page, {
    id: "e2e-harbolag-annons",
    titel: "E2E har bolag",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 52" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-harbolag-interest",
    annonsId: "e2e-harbolag-annons",
    kKod: "K-e2e-harbolag",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_197503033030",
  });

  await page.goto("/kopare/affarer/e2e-harbolag-interest");
  await page.getByRole("radio", { name: "Ja, jag har bolag" }).click();
  await expect(page.getByText("Är du firmatecknare för bolaget?")).toBeVisible();

  await page.getByRole("radio", { name: "Ja, jag är firmatecknare" }).click();
  await page.getByRole("button", { name: "Spara uppgifter →" }).click();

  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-harbolag-interest"];
  });
  expect(deal.granskning.bolagssituation).toBe("har-bolag");
  expect(deal.granskning.firmatecknare).toBe(true);

  await seedDeal(page, "e2e-harbolag-interest", {
    ...deal,
    granskning: { ...deal.granskning, kycDokument: "kyc.pdf", foretagspresentation: "pres.pdf" },
  });
  await page.goto("/admin/affarer/e2e-harbolag-interest");
  await expect(page.getByText("Bekräftad av köparen")).toBeVisible();
  await expect(page.getByText("Personnummer", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Matcha köpare →" })).toBeEnabled();
});
