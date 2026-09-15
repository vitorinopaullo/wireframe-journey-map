import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal, seedSession } from "./helpers";

test("choosing hyllbolag sets bolagKlartAt immediately, starta-bolag requires a separate confirm step", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-6010", "Bo", "Lagsson");

  await seedAnnons(page, {
    id: "e2e-ib-annons",
    titel: "E2E inget bolag",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "inkram",
    draft: { cat: "inkram", verksamhet: "Restaurang", adress: "E2E-gatan 50" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-ib-hyllbolag",
    annonsId: "e2e-ib-annons",
    kKod: "K-e2e-hylla",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501016010",
  });

  await page.goto("/kopare/affarer/e2e-ib-hyllbolag");
  await page.getByRole("radio", { name: "Nej, inte än" }).click();
  await page.getByText("Jag köper ett hyllbolag").click();
  await expect(
    page.getByText("Klart — TreLink har informerats och uppgraderar din ansökan."),
  ).toBeVisible();

  const hyllbolagDeal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-ib-hyllbolag"];
  });
  expect(hyllbolagDeal.granskning.bolagsVal).toBe("hyllbolag");
  expect(hyllbolagDeal.granskning.bolagKlartAt).toBeTruthy();

  // Separate buyer starting a new company instead — bolagKlartAt must NOT
  // be set until they explicitly confirm registration.
  await seedBuyerInterest(page, {
    id: "e2e-ib-startabolag",
    annonsId: "e2e-ib-annons",
    kKod: "K-e2e-starta",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501016010",
  });

  await page.goto("/kopare/affarer/e2e-ib-startabolag");
  await page.getByRole("radio", { name: "Nej, inte än" }).click();
  await page.getByText("Jag startar ett bolag").click();

  let startaDeal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-ib-startabolag"];
  });
  expect(startaDeal.granskning.bolagsVal).toBe("starta-bolag");
  expect(startaDeal.granskning.bolagKlartAt).toBeFalsy();
  await expect(page.getByRole("button", { name: "Bolaget är registrerat →" })).toBeVisible();

  await page.getByRole("button", { name: "Bolaget är registrerat →" }).click();
  startaDeal = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem("trelink-affarer") ?? "{}");
    return all["e2e-ib-startabolag"];
  });
  expect(startaDeal.granskning.bolagKlartAt).toBeTruthy();
});

test("Uppgradera till Aktieöverlåtelse only appears once bolagKlartAt is set, and upgrades cat + requests komplettering in one action", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-uppgrad-annons",
    titel: "E2E uppgradera kategori",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "inkram",
    draft: { cat: "inkram", verksamhet: "Restaurang", adress: "E2E-gatan 51" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-uppgrad-interest",
    annonsId: "e2e-uppgrad-annons",
    kKod: "K-e2e-uppgrad",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_uppgrad",
  });

  // Not yet bolagKlart — no upgrade action, no bolag-status box even.
  await seedDeal(page, "e2e-uppgrad-interest", {
    steg: "granskning",
    granskning: { harBolag: false, bolagsVal: "starta-bolag" },
  });
  await page.goto("/admin/affarer/e2e-uppgrad-interest");
  await expect(
    page.getByRole("button", { name: "Uppgradera till Aktieöverlåtelse →" }),
  ).toHaveCount(0);

  // bolagKlartAt set — action appears.
  await seedDeal(page, "e2e-uppgrad-interest", {
    steg: "granskning",
    granskning: {
      harBolag: false,
      bolagsVal: "starta-bolag",
      bolagKlartAt: new Date().toISOString(),
    },
  });
  await page.reload();
  await page.getByRole("button", { name: "Uppgradera till Aktieöverlåtelse →" }).click();

  await expect(
    page.getByText("Uppgraderad till Aktieöverlåtelse — komplettering begärd från säljaren."),
  ).toBeVisible();

  const annons = await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("saljare-annonser") ?? "[]");
    return list.find((a: { id: string }) => a.id === "e2e-uppgrad-annons");
  });
  expect(annons.cat).toBe("aktie");
  expect(annons.draft.cat).toBe("aktie");
  expect(annons.workflow.state).toBe("komplettering");
  expect(annons.workflow.komplettering?.message).toContain("registreringsbevis");
});

test("the Matcha köpare checklist substitutes Bolag klart for Firmatecknare when harBolag is false", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-checklist-annons",
    titel: "E2E checklist substitution",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 52" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-checklist-interest",
    annonsId: "e2e-checklist-annons",
    kKod: "K-e2e-checklist",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_checklist",
  });
  await seedDeal(page, "e2e-checklist-interest", {
    steg: "granskning",
    granskning: {
      harBolag: false,
      bolagsVal: "hyllbolag",
      bolagKlartAt: new Date().toISOString(),
      kycDokument: "kyc.pdf",
      foretagspresentation: "pres.pdf",
    },
  });

  await page.goto("/admin/affarer/e2e-checklist-interest");
  await expect(page.getByText("Bolag klart", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Firmatecknare bekräftad")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Matcha köpare →" })).toBeEnabled();
});
