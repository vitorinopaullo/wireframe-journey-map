import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons } from "./helpers";

const ANNONS_ID = "e2e-publicerat-nav";

test("Publicerat tab lists published ads and links to the public listing", async ({ page }) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: ANNONS_ID,
    titel: "E2E publicerad annons",
    agarUserId: "e2e-seller",
    pris: "1200000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", ort: "Stockholm", verksamhet: "Kontor" },
    workflow: {
      state: "publicerad",
      timeline: [],
      publiceradAt: new Date().toISOString(),
    },
  });

  await page.goto("/admin/publicerat");

  const row = page.getByText("E2E publicerad annons");
  await expect(row).toBeVisible();

  await row.click();

  const publicUrl = new RegExp(`/annons/${ANNONS_ID}/?$`);
  await page.waitForURL(publicUrl);
  expect(page.url()).not.toContain("/admin/annonser/");
  expect(page.url()).toMatch(publicUrl);
});
