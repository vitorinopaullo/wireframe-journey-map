import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal, seedSession } from "./helpers";

test("both buyer and seller sign the handpenning-kvittens via Signicat, seller's option only appears after the buyer signs", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-hks-annons",
    titel: "E2E handpenning signicat",
    agarUserId: "u_198001017002",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 50" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-hks-interest",
    annonsId: "e2e-hks-annons",
    kKod: "K-e2e-hks",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501017001",
  });
  await seedDeal(page, "e2e-hks-interest", {
    steg: "handpenning",
    handpenning: {
      kvitto: "kvitto.pdf",
      ucUtdrag: "uc.pdf",
      kvittensSkapadAt: new Date().toISOString(),
      kvittensSkickadAt: new Date().toISOString(),
    },
  });

  // Seller sees nothing to sign yet — the buyer hasn't signed.
  await seedSession(page, "19800101-7002", "Bo", "Saljare");
  await page.goto("/saljare/affarer/e2e-hks-interest");
  await expect(page.getByRole("button", { name: "Signera kvittens →" })).toHaveCount(0);
  await expect(page.getByText("Väntar på att köparen betalar handpenningen")).toBeVisible();

  // Buyer signs via the SignicatFlow modal, not a plain button.
  await seedSession(page, "19850101-7001", "Karin", "Kopare");
  await page.goto("/kopare/affarer/e2e-hks-interest");
  await page.getByRole("button", { name: "Signera kvittens →" }).click();
  await page.getByRole("button", { name: "Sign documents" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "Tillbaka till min annons" })).toBeVisible({
    timeout: 5000,
  });
  await page.getByRole("button", { name: "Tillbaka till min annons" }).click();
  await expect(page.getByText("Du har signerat kvittensen.")).toBeVisible();

  // The "väntar på din signering" notification fires when the buyer signs.
  const notiser = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("trelink-admin-notiser") ?? "[]"),
  );
  const handpenningNotis = notiser.find(
    (n: { lank?: string; kategori?: string; text?: string }) =>
      n.lank === "/saljare/affarer/e2e-hks-interest" && n.kategori === "saljare-affar",
  );
  expect(handpenningNotis?.text).toContain("Handpenningskvittens väntar på din signering");

  // The seller now sees the signing option and can sign via their own SignicatFlow.
  await seedSession(page, "19800101-7002", "Bo", "Saljare");
  await page.goto("/saljare/affarer/e2e-hks-interest");
  await expect(page.getByRole("button", { name: "Signera kvittens →" })).toBeVisible();
  await page.getByRole("button", { name: "Signera kvittens →" }).click();
  await page.getByRole("button", { name: "Sign documents" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "Tillbaka till min annons" })).toBeVisible({
    timeout: 5000,
  });
  await page.getByRole("button", { name: "Tillbaka till min annons" }).click();
  await expect(page.getByText("Du har signerat kvittensen.")).toBeVisible();

  const deal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-hks-interest"];
  });
  expect(deal.handpenning.kvittensSignerat.kopare).toBe(true);
  expect(deal.handpenning.kvittensSignerat.saljare).toBe(true);
});
