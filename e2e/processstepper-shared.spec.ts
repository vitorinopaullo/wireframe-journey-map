import { test, expect, type Page } from "@playwright/test";
import { unlockGate, seedSession, seedAnnons } from "./helpers";

// The step label also appears as a <select><option> in the dev-only step
// switcher, and "Granskning"/"Publicerad" collide with admin sidebar nav
// links — scope to the <span> ProcessStepper actually renders its labels
// as, so these locators unambiguously target the stepper itself.
function stepLabel(page: Page, label: string) {
  return page.locator("span", { hasText: new RegExp(`^${label}$`) });
}

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

  // Only one ProcessStepper should render on this page (the old local
  // Flödesindikator has been removed) — "Publicerad" as a step-label span
  // appears once.
  await expect(stepLabel(page, "Publicerad")).toHaveCount(1);

  const hyresvard = stepLabel(page, "Hyresvärd");
  await expect(hyresvard).toBeVisible();
  await expect(hyresvard).not.toHaveClass(/font-semibold/);
  await expect(hyresvard).toHaveClass(/text-muted-foreground/);
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

  const hyresvard = stepLabel(page, "Hyresvärd");
  await expect(hyresvard).toBeVisible();
  await expect(hyresvard).toHaveClass(/font-semibold/);
});

test("ProcessStepper shows distinct komplettering styling and stays a single stepper on the seller's view", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-8003", "Kim", "Processon");
  await seedAnnons(page, {
    id: "e2e-stepper-komplettering-annons",
    titel: "E2E stepper komplettering",
    agarUserId: "u_198501018003",
    draft: { cat: "overlatelse", adress: "E2E-gatan 62", ort: "Stockholm" },
    workflow: { state: "komplettering", timeline: [] },
  });

  await page.goto("/saljare/annons/e2e-stepper-komplettering-annons");

  // Only one stepper renders — "Granskning" (step 0's label) appears once.
  const granskning = stepLabel(page, "Granskning");
  await expect(granskning).toHaveCount(1);
  await expect(granskning).toHaveClass(/text-amber-700/);
  await expect(
    page.getByText("Komplettering begärd — åtgärda och skicka in på nytt"),
  ).toBeVisible();
});

test("ProcessStepper shows distinct muted avvisad styling (not the old return-nothing behavior) on the seller's view", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-8004", "Nils", "Processon");
  await seedAnnons(page, {
    id: "e2e-stepper-avvisad-annons",
    titel: "E2E stepper avvisad",
    agarUserId: "u_198501018004",
    draft: { cat: "overlatelse", adress: "E2E-gatan 63", ort: "Stockholm" },
    workflow: {
      state: "avvisad",
      timeline: [],
      avvisadReason: { at: new Date().toISOString(), orsak: "Test" },
    },
  });

  await page.goto("/saljare/annons/e2e-stepper-avvisad-annons");
  await expect(page.getByText("Din annons har avvisats.")).toBeVisible();

  // Exactly one "Granskning" — the stepper now renders (no longer returns
  // null for avvisad) — with the muted treatment, and its own
  // "ärendet är stängt" explanation isn't repeated by the stepper itself
  // (that stays the seller's pre-existing avvisad-status section's job).
  const granskning = stepLabel(page, "Granskning");
  await expect(granskning).toHaveCount(1);
  await expect(granskning).toHaveClass(/text-foreground\/70/);

  // The seller's own pre-existing avvisad-status section already says
  // "ärendet är stängt" twice (status line + "Vad kan du göra?" box) —
  // confirm the stepper itself doesn't add a third occurrence.
  await expect(page.getByText("ärendet är stängt", { exact: false })).toHaveCount(2);
});

test("ProcessStepper shows distinct komplettering and avvisad styling on the admin view too", async ({
  page,
}) => {
  await unlockGate(page);
  await seedAnnons(page, {
    id: "e2e-stepper-admin-annons",
    titel: "E2E stepper admin",
    agarUserId: "e2e-seller",
    draft: { cat: "overlatelse", adress: "E2E-gatan 64", ort: "Stockholm" },
    workflow: { state: "komplettering", timeline: [] },
  });

  await page.goto("/admin/annonser/e2e-stepper-admin-annons");
  await expect(stepLabel(page, "Granskning")).toHaveClass(/text-amber-700/);
  await expect(
    page.getByText("Komplettering begärd — åtgärda och skicka in på nytt"),
  ).toBeVisible();

  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("saljare-annonser") ?? "[]");
    const item = list.find((a: { id: string }) => a.id === "e2e-stepper-admin-annons");
    item.workflow.state = "avvisad";
    item.workflow.avvisadReason = { at: new Date().toISOString(), orsak: "Test-orsak" };
    localStorage.setItem("saljare-annonser", JSON.stringify(list));
  });
  await page.reload();

  // RejectedBanner still carries the "ärendet är stängt" explanation
  // exactly once — the stepper's own avvisad row stays muted-label-only,
  // so admin doesn't see it said twice in two different visual styles.
  await expect(stepLabel(page, "Granskning")).toHaveClass(/text-foreground\/70/);
  await expect(page.getByText("Avvisad — ärendet är stängt", { exact: false })).toHaveCount(1);
});
