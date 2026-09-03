import { test, expect } from "@playwright/test";
import { unlockGate, seedSession } from "./helpers";

test("invalid email blocks Fortsätt, valid email (non-.se TLD) re-enables it", async ({ page }) => {
  await unlockGate(page);
  await seedSession(page, "19900101-1234", "Test", "Testsson");

  // role=kopare auto-advances the form straight to Steg 2 (see onboarding.tsx's
  // roleParam effect), landing on Köparuppgifter with Telefon/E-post fields.
  await page.goto("/onboarding?role=kopare");

  const telefonField = page.getByPlaceholder("076 12 34 56");
  const epostField = page.locator('input[type="email"]');
  const submitBtn = page.getByRole("button", { name: "Spara & skicka till TreLink →" });

  await telefonField.fill("0701234567");

  await epostField.fill("annaexempel");
  await epostField.blur();

  await expect(page.getByText("Ogiltig e-postadress")).toBeVisible();
  await expect(submitBtn).toBeDisabled();

  await epostField.fill("anna@exempel.io");
  await epostField.blur();

  await expect(page.getByText("Ogiltig e-postadress")).toBeHidden();
  await expect(submitBtn).toBeEnabled();
});
