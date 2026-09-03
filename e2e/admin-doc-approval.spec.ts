import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons } from "./helpers";

const ANNONS_ID = "e2e-doc-approval";

test("Godkänn stays disabled until the document row has been opened", async ({ page }) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: ANNONS_ID,
    titel: "E2E testlokal",
    agarUserId: "e2e-seller",
    pris: "",
    cat: "overlatelse",
    draft: {
      cat: "overlatelse",
      verksamhet: "Restaurang",
      adress: "E2E-gatan 1",
      yta: "80",
      hyra: "15000",
    },
    workflow: {
      state: "granskas",
      timeline: [
        {
          ts: new Date().toISOString(),
          vem: "Säljare/Överlåtare",
          text: "Skickade in underlag för granskning",
        },
      ],
    },
  });

  await page.goto(`/admin/annonser/${ANNONS_ID}`);

  // The doc row is the shared flex wrapper around both the clickable
  // name/krav button and the action buttons (Godkänn, etc.) — see the
  // `justify-between` row div in admin.annonser.$id.tsx.
  const docRow = page
    .locator('h4:text-is("Hyresavtal")')
    .locator('xpath=ancestor::div[contains(@class,"justify-between")][1]');
  const godkannBtn = docRow.getByRole("button", { name: "Godkänn" });

  await expect(godkannBtn).toBeDisabled();
  await expect(docRow.getByText("Öppna dokumentet först")).toBeVisible();

  await docRow.getByRole("button", { name: /Hyresavtal/ }).click();

  await expect(page.getByText("Dokumentvy · Hyresavtal")).toBeVisible();
  await page.getByRole("button", { name: "Stäng" }).click();
  await expect(page.getByText("Dokumentvy · Hyresavtal")).toBeHidden();

  await expect(godkannBtn).toBeEnabled();
  await expect(docRow.getByText("Öppna dokumentet först")).toBeHidden();
});
