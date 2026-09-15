import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal, seedAccount } from "./helpers";

test("the Köpeavtal's Personal section only renders for inkram deals, not overlatelse or aktie", async ({
  page,
}) => {
  await unlockGate(page);

  for (const cat of ["overlatelse", "inkram", "aktie"] as const) {
    const annonsId = `e2e-kopeavtal-personal-${cat}-annons`;
    const interestId = `e2e-kopeavtal-personal-${cat}-interest`;
    await seedAnnons(page, {
      id: annonsId,
      titel: `E2E köpeavtal personal ${cat}`,
      agarUserId: "e2e-seller",
      pris: "1 000 000",
      cat,
      draft: { cat, verksamhet: "Restaurang", adress: "E2E-gatan 40" },
      workflow: { state: "publicerad", timeline: [] },
    });
    await seedBuyerInterest(page, {
      id: interestId,
      annonsId,
      kKod: `K-e2e-kp-${cat}`,
      status: "vill-ga-vidare",
      skapadAt: new Date().toISOString(),
      userId: `u_e2e_kp_${cat}`,
    });
    await seedDeal(page, interestId, { steg: "matchad" });

    await page.goto(`/admin/affarer/${interestId}`);
    await page.getByRole("button", { name: "Skapa köpeavtal →" }).click();

    if (cat === "inkram") {
      await expect(page.getByText("Personal", { exact: true })).toBeVisible();
    } else {
      await expect(page.getByText("Personal", { exact: true })).toHaveCount(0);
    }
  }
});

test("the Köpeavtal's Köpeskilling section computes handpenning and resterande likvid as 10%/90% of pris", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-kopeavtal-belopp-annons",
    titel: "E2E köpeavtal belopp",
    agarUserId: "e2e-seller",
    pris: "1000000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 41" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedAccount(page, {
    id: "e2e-acc-kopeavtal-belopp",
    userId: "u_e2e_kb",
    bankid: { fornamn: "Belopp", efternamn: "Testsson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { bolag: "Belopp Test AB", orgnr: "556000-3333" },
  });
  await seedBuyerInterest(page, {
    id: "e2e-kopeavtal-belopp-interest",
    annonsId: "e2e-kopeavtal-belopp-annons",
    kKod: "K-e2e-kb",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_kb",
  });
  await seedDeal(page, "e2e-kopeavtal-belopp-interest", { steg: "matchad" });

  await page.goto("/admin/affarer/e2e-kopeavtal-belopp-interest");
  await page.getByRole("button", { name: "Skapa köpeavtal →" }).click();

  // pris 1 000 000 → handpenning 10 % = 100 000, resterande likvid 90 % = 900 000.
  await expect(page.getByText("(100 000 kr)")).toBeVisible();
  await expect(page.getByText("(900 000 kr)")).toBeVisible();
});
