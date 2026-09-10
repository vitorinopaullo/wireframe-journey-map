import { test, expect } from "@playwright/test";
import { unlockGate, seedSession, seedAnnons, seedBuyerInterest, seedDeal } from "./helpers";

test("seller can unpublish and republish an annons with no active deal", async ({ page }) => {
  await unlockGate(page);
  await seedSession(page, "19850101-5555", "Nils", "Nilsson");
  await seedAnnons(page, {
    id: "annons-no-deal",
    titel: "Annons utan affär",
    agarUserId: "u_198501015555",
    draft: { cat: "overlatelse", adress: "Testgatan 1", ort: "Stockholm" },
    workflow: { state: "publicerad", publiceradAt: new Date().toISOString(), timeline: [] },
  });

  await page.goto("/saljare/annons/annons-no-deal");

  const redigeraBtn = page.getByRole("link", { name: "Redigera" });
  const avpubliceraBtn = page.getByRole("button", { name: "Avpublicera" });
  await expect(redigeraBtn).toBeVisible();
  await expect(avpubliceraBtn).toBeVisible();

  await avpubliceraBtn.click();
  await page.getByRole("button", { name: "Ja, avpublicera" }).click();

  await expect(page.getByText("Annonsen är avpublicerad")).toBeVisible();
  await expect(page.getByText("Annonsen avpublicerad")).toBeVisible(); // Ärendehistorik-posten
  await expect(redigeraBtn).toHaveCount(0);

  await page.getByRole("button", { name: "Publicera igen" }).click();

  await expect(redigeraBtn).toBeVisible();
  await expect(avpubliceraBtn).toBeVisible();
});

test("seller cannot edit or unpublish an annons with an active deal", async ({ page }) => {
  await unlockGate(page);
  await seedSession(page, "19900202-6666", "Eva", "Eriksson");
  await seedAnnons(page, {
    id: "annons-with-deal",
    titel: "Annons med aktiv affär",
    agarUserId: "u_199002026666",
    draft: { cat: "overlatelse", adress: "Testgatan 2", ort: "Göteborg" },
    workflow: { state: "publicerad", publiceradAt: new Date().toISOString(), timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "bi-active-deal",
    annonsId: "annons-with-deal",
    kKod: "K-7777",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
  });
  await seedDeal(page, "bi-active-deal", { interestId: "bi-active-deal", steg: "matchad" });

  await page.goto("/saljare/annons/annons-with-deal");

  await expect(page.getByText("Det finns en pågående affär för denna annons")).toBeVisible();
  await expect(page.getByRole("link", { name: "Redigera" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Avpublicera" })).toHaveCount(0);
});
