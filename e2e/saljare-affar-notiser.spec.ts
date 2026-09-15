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

test("skickaKopeavtalForSignering fires a saljare-affar badge next to Mina affärer", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-notis-avtal-annons",
    titel: "E2E notis avtal",
    agarUserId: "u_e2e_notis_seller1",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 90" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-notis-avtal-interest",
    annonsId: "e2e-notis-avtal-annons",
    kKod: "K-e2e-na1",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_na1",
  });
  await seedDeal(page, "e2e-notis-avtal-interest", { steg: "matchad" });

  await page.goto("/admin/affarer/e2e-notis-avtal-interest");
  await page.getByRole("button", { name: "Skapa köpeavtal →" }).click();
  await page.getByRole("button", { name: "Skicka till parterna →" }).click();

  await switchToSeller(page, "u_e2e_notis_seller1");
  await page.goto("/dashboard?mode=saljare");
  const minaAffarerLink = page.locator("aside").getByRole("link", { name: "Mina affärer" });
  await expect(minaAffarerLink.getByText("1", { exact: true })).toBeVisible();
});

test("signeraHandpenningKvittens fires a saljare-affar badge next to Mina affärer", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-9020", "Kim", "Kopvis");

  await seedAnnons(page, {
    id: "e2e-notis-hpk-annons",
    titel: "E2E notis handpenning",
    agarUserId: "u_e2e_notis_seller2",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 91" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-notis-hpk-interest",
    annonsId: "e2e-notis-hpk-annons",
    kKod: "K-e2e-na2",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501019020",
  });
  await seedDeal(page, "e2e-notis-hpk-interest", {
    steg: "handpenning",
    handpenning: {
      kvitto: "kvitto.pdf",
      ucUtdrag: "uc.pdf",
      kvittensSkapadAt: new Date().toISOString(),
      kvittensSkickadAt: new Date().toISOString(),
    },
  });

  await page.goto("/kopare/affarer/e2e-notis-hpk-interest");
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Signera kvittens →" }).click();
  await expect(
    page.getByText("Du har signerat kvittensen. Den är skickad till säljaren."),
  ).toBeVisible();

  await switchToSeller(page, "u_e2e_notis_seller2");
  await page.goto("/dashboard?mode=saljare");
  const minaAffarerLink = page.locator("aside").getByRole("link", { name: "Mina affärer" });
  await expect(minaAffarerLink.getByText("1", { exact: true })).toBeVisible();
});

test('hyresvardBesked("godkand") fires a saljare-affar badge next to Mina affärer', async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-notis-hv-annons",
    titel: "E2E notis hyresvard",
    agarUserId: "u_e2e_notis_seller3",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 92" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-notis-hv-interest",
    annonsId: "e2e-notis-hv-annons",
    kKod: "K-e2e-na3",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_na3",
  });
  await seedDeal(page, "e2e-notis-hv-interest", {
    steg: "hyresvard",
    hyresvard: { skickadAt: new Date().toISOString() },
  });

  await page.goto("/admin/affarer/e2e-notis-hv-interest");
  await page.getByRole("button", { name: "Hyresvärd godkände" }).click();

  await switchToSeller(page, "u_e2e_notis_seller3");
  await page.goto("/dashboard?mode=saljare");
  const minaAffarerLink = page.locator("aside").getByRole("link", { name: "Mina affärer" });
  await expect(minaAffarerLink.getByText("1", { exact: true })).toBeVisible();
});

test("lyftArvode fires a saljare-affar badge next to Mina affärer", async ({ page }) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-notis-arvode-annons",
    titel: "E2E notis arvode",
    agarUserId: "u_e2e_notis_seller4",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 93" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-notis-arvode-interest",
    annonsId: "e2e-notis-arvode-annons",
    kKod: "K-e2e-na4",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_na4",
  });
  await seedDeal(page, "e2e-notis-arvode-interest", { steg: "klar" });

  await page.goto("/admin/affarer/e2e-notis-arvode-interest");
  await page.getByRole("button", { name: "Lyft arvode →" }).click();
  await page.getByRole("button", { name: "Bekräfta och skicka till säljaren →" }).click();

  await switchToSeller(page, "u_e2e_notis_seller4");
  await page.goto("/dashboard?mode=saljare");
  const minaAffarerLink = page.locator("aside").getByRole("link", { name: "Mina affärer" });
  await expect(minaAffarerLink.getByText("1", { exact: true })).toBeVisible();
});

test("visiting Mina affärer clears the saljare-affar badge", async ({ page }) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-notis-clear-annons",
    titel: "E2E notis clear",
    agarUserId: "u_e2e_notis_seller5",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 94" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-notis-clear-interest",
    annonsId: "e2e-notis-clear-annons",
    kKod: "K-e2e-na5",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_na5",
  });
  await seedDeal(page, "e2e-notis-clear-interest", { steg: "matchad" });

  await page.goto("/admin/affarer/e2e-notis-clear-interest");
  await page.getByRole("button", { name: "Skapa köpeavtal →" }).click();
  await page.getByRole("button", { name: "Skicka till parterna →" }).click();

  await switchToSeller(page, "u_e2e_notis_seller5");
  await page.goto("/dashboard?mode=saljare");
  const minaAffarerLink = page.locator("aside").getByRole("link", { name: "Mina affärer" });
  await expect(minaAffarerLink.getByText("1", { exact: true })).toBeVisible();

  await minaAffarerLink.click();
  await page.goto("/dashboard?mode=saljare");
  await expect(minaAffarerLink.getByText("1", { exact: true })).toHaveCount(0);
});

test("both dashboard Mina affärer cards show real counts, not hardcoded values", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-notis-count-annons",
    titel: "E2E notis count",
    agarUserId: "u_e2e_notis_seller6",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 95" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-notis-count-interest-1",
    annonsId: "e2e-notis-count-annons",
    kKod: "K-e2e-nc1",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_nc1",
  });
  await seedBuyerInterest(page, {
    id: "e2e-notis-count-interest-2",
    annonsId: "e2e-notis-count-annons",
    kKod: "K-e2e-nc2",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_nc2",
  });
  await seedDeal(page, "e2e-notis-count-interest-1", { steg: "matchad" });
  await seedDeal(page, "e2e-notis-count-interest-2", { steg: "matchad" });

  // Seller's dashboard card shows both (2 interests on their own annons) —
  // scoped to <main> so it can't match the nav sidebar's own "Mina affärer"
  // entry, which for this count-check test is irrelevant either way.
  await switchToSeller(page, "u_e2e_notis_seller6");
  await page.goto("/dashboard?mode=saljare");
  const saljareCard = page.locator("main").getByRole("link", { name: "Mina affärer" });
  await expect(saljareCard.getByText("2", { exact: true })).toBeVisible();

  // One of the buyers sees exactly their own single deal (1, not the
  // seller's 2 and not the old hardcoded "1" for an unrelated buyer).
  await seedSession(page, "19850101-9021", "Buyer", "Nc1");
  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("kopare-intressen") ?? "[]");
    const item = list.find((i: { id: string }) => i.id === "e2e-notis-count-interest-1");
    if (item) item.userId = "u_198501019021";
    localStorage.setItem("kopare-intressen", JSON.stringify(list));
  });
  await page.goto("/dashboard?mode=kopare");
  const kopareCard = page.locator("main").getByRole("link", { name: "Mina affärer" });
  await expect(kopareCard.getByText("1", { exact: true })).toBeVisible();
});
