import { test, expect } from "@playwright/test";
import { unlockGate, seedSession, seedAnnons } from "./helpers";

test("ProcessStepper on saljare.annons.$id.tsx highlights the correct step for avtal-vantar-signering", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-8001", "Petra", "Processon");
  await seedAnnons(page, {
    id: "e2e-stepper-avtal-annons",
    titel: "E2E stepper avtal",
    agarUserId: "u_198501018001",
    draft: { cat: "overlatelse", adress: "E2E-gatan 60", ort: "Stockholm" },
    workflow: { state: "avtal-vantar-signering", timeline: [] },
  });

  await page.goto("/saljare/annons/e2e-stepper-avtal-annons");
  await expect(page.getByText("Uppdragsavtal — väntar på signering").first()).toBeVisible();

  // "Annonstext" is a label unique to ProcessStepper (the pre-existing
  // Flödesindikator further down the page uses "Hyresvärd" instead), so it
  // unambiguously identifies the new component regardless of which other
  // step labels are duplicated elsewhere on the page.
  const annonstext = page.getByText("Annonstext", { exact: true });
  await expect(annonstext).toBeVisible();
  await expect(annonstext).not.toHaveClass(/font-semibold/);
  await expect(annonstext).toHaveClass(/text-muted-foreground/);
});

test("ProcessStepper on saljare.annons.$id.tsx highlights the correct step for hyresvard-notifiering", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-8002", "Bo", "Processon");
  await seedAnnons(page, {
    id: "e2e-stepper-hyresvard-annons",
    titel: "E2E stepper hyresvard",
    agarUserId: "u_198501018002",
    draft: { cat: "overlatelse", adress: "E2E-gatan 61", ort: "Stockholm" },
    workflow: { state: "hyresvard-notifiering", timeline: [] },
  });

  await page.goto("/saljare/annons/e2e-stepper-hyresvard-annons");
  await expect(page.getByText("TreLink kontaktar hyresvärden").first()).toBeVisible();

  const annonstext = page.getByText("Annonstext", { exact: true });
  await expect(annonstext).toBeVisible();
  await expect(annonstext).toHaveClass(/font-semibold/);
});

test("ProcessStepper on saljare.annons.$id.tsx renders nothing for avvisad", async ({ page }) => {
  await unlockGate(page);
  await seedSession(page, "19850101-8003", "Kim", "Processon");
  await seedAnnons(page, {
    id: "e2e-stepper-avvisad-annons",
    titel: "E2E stepper avvisad",
    agarUserId: "u_198501018003",
    draft: { cat: "overlatelse", adress: "E2E-gatan 62", ort: "Stockholm" },
    workflow: {
      state: "avvisad",
      timeline: [],
      avvisadReason: { at: new Date().toISOString(), orsak: "Test" },
    },
  });

  await page.goto("/saljare/annons/e2e-stepper-avvisad-annons");
  await expect(page.getByText("Din annons har avvisats.")).toBeVisible();
  await expect(page.getByText("Annonstext", { exact: true })).toHaveCount(0);
});
