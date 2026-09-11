import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest } from "./helpers";

const ANNONS_WAITING = "e2e-intressenter-waiting-annons";
const ANNONS_WANTS = "e2e-intressenter-wants-annons";
const ANNONS_DECLINED = "e2e-intressenter-declined-annons";

test("Intressenter page only ever shows vantar-pdf leads and has no Avvisa button", async ({
  page,
}) => {
  await unlockGate(page);

  for (const [id, titel] of [
    [ANNONS_WAITING, "E2E väntande lokal"],
    [ANNONS_WANTS, "E2E vill-köpa lokal"],
    [ANNONS_DECLINED, "E2E avvisad lokal"],
  ] as const) {
    await seedAnnons(page, {
      id,
      titel,
      agarUserId: "e2e-seller",
      pris: "",
      cat: "overlatelse",
      draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 3" },
      workflow: { state: "publicerad", timeline: [] },
    });
  }

  await seedBuyerInterest(page, {
    id: "e2e-interest-waiting",
    annonsId: ANNONS_WAITING,
    kKod: "K-e2e-waiting",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_waiting",
  });
  await seedBuyerInterest(page, {
    id: "e2e-interest-wants",
    annonsId: ANNONS_WANTS,
    kKod: "K-e2e-wants",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_wants",
  });
  await seedBuyerInterest(page, {
    id: "e2e-interest-declined",
    annonsId: ANNONS_DECLINED,
    kKod: "K-e2e-declined",
    status: "avböjt",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_declined",
  });

  await page.goto("/admin/kopare");

  await expect(page.getByText("K-e2e-waiting")).toBeVisible();
  await expect(page.getByText("K-e2e-wants")).toBeHidden();
  await expect(page.getByText("K-e2e-declined")).toBeHidden();
  await expect(page.getByRole("button", { name: "Avvisa" })).toHaveCount(0);
});
