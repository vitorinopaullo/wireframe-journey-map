import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest } from "./helpers";

const ANNONS_ID = "e2e-kopare-avvisa-annons";
const INTEREST_ID = "e2e-kopare-avvisa-interest";

test("admin can reject a lead via Avvisa, which then shows the Ombokning action", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: ANNONS_ID,
    titel: "E2E testlokal — Avvisa",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 2" },
    workflow: { state: "publicerad", timeline: [] },
  });

  await seedBuyerInterest(page, {
    id: INTEREST_ID,
    annonsId: ANNONS_ID,
    kKod: "K-e2e-avvisa",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_kopare_avvisa",
  });

  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/admin/kopare");

  const row = page.locator("tr", { has: page.getByText("K-e2e-avvisa") });
  const avvisaBtn = row.getByRole("button", { name: "Avvisa" });
  const ombokningBtn = row.getByRole("button", { name: "Märk för ombokning" });

  await expect(avvisaBtn).toBeVisible();
  await expect(row.getByText("Avvisat")).toBeHidden();
  await expect(ombokningBtn).toBeHidden();

  await avvisaBtn.click();

  await expect(row.getByText("Avvisat")).toBeVisible();
  await expect(avvisaBtn).toBeHidden();
  await expect(ombokningBtn).toBeVisible();
});
