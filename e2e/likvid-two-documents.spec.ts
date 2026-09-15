import { test, expect } from "@playwright/test";
import { unlockGate, seedSession, seedAnnons, seedBuyerInterest, seedDeal } from "./helpers";

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

test("skickaLikvidKvittens fires notifications to both kopare-affar and saljare-affar", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-likvid2doc-notis-annons",
    titel: "E2E likvid two documents notis",
    agarUserId: "u_e2e_likvid2doc_seller1",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 60" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-likvid2doc-notis-interest",
    annonsId: "e2e-likvid2doc-notis-annons",
    kKod: "K-e2e-l2dn",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_likvid2doc_notis",
  });
  await seedDeal(page, "e2e-likvid2doc-notis-interest", {
    steg: "likvid",
    likvid: {
      begartAt: new Date().toISOString(),
      belopp: 900000,
      inlamnadAt: new Date().toISOString(),
      verifieratAt: new Date().toISOString(),
    },
  });

  await page.goto("/admin/affarer/e2e-likvid2doc-notis-interest");
  await page.getByRole("button", { name: "Skapa kvittens →" }).click();
  await page.getByRole("button", { name: "Skicka till köparen (mejl) →" }).click();

  const notiser = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("trelink-admin-notiser") ?? "[]"),
  );
  const kopareNotis = notiser.find(
    (n: { lank?: string; kategori?: string }) =>
      n.lank === "/kopare/affarer/e2e-likvid2doc-notis-interest" && n.kategori === "kopare-affar",
  );
  const saljareNotis = notiser.find(
    (n: { lank?: string; kategori?: string }) =>
      n.lank === "/saljare/affarer/e2e-likvid2doc-notis-interest" && n.kategori === "saljare-affar",
  );
  expect(kopareNotis?.text).toContain("Kvittens för likvid mejlad");
  expect(saljareNotis?.text).toContain("Avräkning för likvid mejlad");
});

test("the seller's Avräkning shows the correct wording and the same computed amount as the buyer's Kvittens", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-8301", "Kalle", "Kopvis");

  await seedAnnons(page, {
    id: "e2e-likvid2doc-amount-annons",
    titel: "E2E likvid two documents amount",
    agarUserId: "u_e2e_likvid2doc_seller2",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 61" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-likvid2doc-amount-interest",
    annonsId: "e2e-likvid2doc-amount-annons",
    kKod: "K-e2e-l2da",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501018301",
  });
  await seedDeal(page, "e2e-likvid2doc-amount-interest", {
    steg: "signering",
    likvid: {
      begartAt: new Date().toISOString(),
      belopp: 900000,
      inlamnadAt: new Date().toISOString(),
      verifieratAt: new Date().toISOString(),
      kvittensSkapadAt: new Date().toISOString(),
      kvittensSkickadAt: new Date().toISOString(),
    },
  });

  // Buyer sees "Kvittens" framing, "Betalt av", and the 90%-of-pris amount.
  await page.goto("/kopare/affarer/e2e-likvid2doc-amount-interest");
  await expect(page.getByText("Kvittens — TreLink", { exact: true })).toBeVisible();
  await expect(page.getByText("Betalt av", { exact: true })).toBeVisible();
  await expect(page.getByText("900 000 kr").first()).toBeVisible();

  // Seller sees "Avräkning" framing, "Mottaget för", and the same amount.
  await switchToSeller(page, "u_e2e_likvid2doc_seller2");
  await page.goto("/saljare/affarer/e2e-likvid2doc-amount-interest");
  await expect(page.getByText("Avräkning — TreLink", { exact: true })).toBeVisible();
  await expect(page.getByText("Mottaget för", { exact: true })).toBeVisible();
  await expect(page.getByText("900 000 kr").first()).toBeVisible();
});
