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

test('hyresvardBesked("godkand") fires both a saljare-affar and a kopare-affar notification', async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-8101", "Kim", "Kopvis");

  await seedAnnons(page, {
    id: "e2e-kanotis-godkand-annons",
    titel: "E2E kopare-notis godkand",
    agarUserId: "u_e2e_kanotis_seller1",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 95" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-kanotis-godkand-interest",
    annonsId: "e2e-kanotis-godkand-annons",
    kKod: "K-e2e-kag",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501018101",
  });
  await seedDeal(page, "e2e-kanotis-godkand-interest", {
    steg: "hyresvard",
    hyresvard: { skickadAt: new Date().toISOString() },
  });

  await page.goto("/admin/affarer/e2e-kanotis-godkand-interest");
  await page.getByRole("button", { name: "Hyresvärd godkände" }).click();

  const notiser = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("trelink-admin-notiser") ?? "[]"),
  );
  const saljareNotis = notiser.find(
    (n: { lank?: string; kategori?: string }) =>
      n.lank === "/saljare/affarer/e2e-kanotis-godkand-interest" && n.kategori === "saljare-affar",
  );
  const kopareNotis = notiser.find(
    (n: { lank?: string; kategori?: string }) =>
      n.lank === "/kopare/affarer/e2e-kanotis-godkand-interest" && n.kategori === "kopare-affar",
  );
  expect(saljareNotis?.text).toContain("Hyresvärden godkände");
  expect(kopareNotis?.text).toContain("Hyresvärden godkände");

  await page.goto("/dashboard?mode=kopare");
  const minaAffarerLink = page.locator("aside").getByRole("link", { name: "Mina affärer" });
  await expect(minaAffarerLink.getByText("1", { exact: true })).toBeVisible();
});

test('hyresvardBesked("nekad") also fires both a saljare-affar and a kopare-affar notification', async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-8102", "Nina", "Nekad");

  await seedAnnons(page, {
    id: "e2e-kanotis-nekad-annons",
    titel: "E2E kopare-notis nekad",
    agarUserId: "u_e2e_kanotis_seller2",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 96" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-kanotis-nekad-interest",
    annonsId: "e2e-kanotis-nekad-annons",
    kKod: "K-e2e-kan",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501018102",
  });
  await seedDeal(page, "e2e-kanotis-nekad-interest", {
    steg: "hyresvard",
    hyresvard: { skickadAt: new Date().toISOString() },
  });

  await page.goto("/admin/affarer/e2e-kanotis-nekad-interest");
  await page.getByRole("button", { name: "Hyresvärd nekade" }).click();

  const notiser = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("trelink-admin-notiser") ?? "[]"),
  );
  const saljareNotis = notiser.find(
    (n: { lank?: string; kategori?: string }) =>
      n.lank === "/saljare/affarer/e2e-kanotis-nekad-interest" && n.kategori === "saljare-affar",
  );
  const kopareNotis = notiser.find(
    (n: { lank?: string; kategori?: string }) =>
      n.lank === "/kopare/affarer/e2e-kanotis-nekad-interest" && n.kategori === "kopare-affar",
  );
  expect(saljareNotis?.text).toContain("Hyresvärden nekade");
  expect(kopareNotis?.text).toContain("Hyresvärden nekade");

  await page.goto("/dashboard?mode=kopare");
  const minaAffarerLink = page.locator("aside").getByRole("link", { name: "Mina affärer" });
  await expect(minaAffarerLink.getByText("1", { exact: true })).toBeVisible();
});

test("the buyer's nav badge appears and clears on visiting Mina affärer, without affecting the seller's badge (and vice versa)", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-8103", "Bea", "Badge");

  await seedAnnons(page, {
    id: "e2e-kanotis-badge-annons",
    titel: "E2E kopare-notis badge",
    agarUserId: "u_e2e_kanotis_seller3",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 97" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-kanotis-badge-interest",
    annonsId: "e2e-kanotis-badge-annons",
    kKod: "K-e2e-kab",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501018103",
  });
  await seedDeal(page, "e2e-kanotis-badge-interest", {
    steg: "hyresvard",
    hyresvard: { skickadAt: new Date().toISOString() },
  });

  await page.goto("/admin/affarer/e2e-kanotis-badge-interest");
  await page.getByRole("button", { name: "Hyresvärd godkände" }).click();

  const minaAffarerLink = page.locator("aside").getByRole("link", { name: "Mina affärer" });

  // Buyer sees the badge.
  await page.goto("/dashboard?mode=kopare");
  await expect(minaAffarerLink.getByText("1", { exact: true })).toBeVisible();

  // Visiting Mina affärer clears the buyer's own badge...
  await page.goto("/kopare/affarer");
  await page.goto("/dashboard?mode=kopare");
  await expect(minaAffarerLink.getByText("1", { exact: true })).toHaveCount(0);

  // ...but the seller's badge for the same event is untouched.
  await switchToSeller(page, "u_e2e_kanotis_seller3");
  await page.goto("/dashboard?mode=saljare");
  await expect(minaAffarerLink.getByText("1", { exact: true })).toBeVisible();

  // Visiting the seller's own Mina affärer clears it too, independently.
  await page.goto("/saljare/affarer");
  await page.goto("/dashboard?mode=saljare");
  await expect(minaAffarerLink.getByText("1", { exact: true })).toHaveCount(0);
});
