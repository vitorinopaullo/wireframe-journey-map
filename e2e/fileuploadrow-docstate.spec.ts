import { test, expect } from "@playwright/test";
import { unlockGate, seedSession, seedAnnons, seedBuyerInterest, seedDeal } from "./helpers";

const DRAFT_KEY = "saljare-skapa-annons-draft-v2";

async function seedSkapaAnnonsDraft(page: import("@playwright/test").Page, docState: string) {
  await page.evaluate(
    ({ key, docState }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          draft: {
            cat: "overlatelse",
            ort: "Stockholm",
            adress: "Testgatan 1",
            postnr: "",
            yta: "",
            verksamhet: "Kontor",
            docs: { "Ritning (Kontor)": docState },
            bilder: [],
            typFalt: {},
          },
          step: 1,
          savedAt: null,
        }),
      );
    },
    { key: DRAFT_KEY, docState },
  );
}

test("a document row with docState=komplettera shows Ladda upp, and one with docState=godkant shows Byt fil", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-7001", "Sara", "Saljarsson");

  await seedSkapaAnnonsDraft(page, "komplettera");
  await page.goto("/saljare/skapa-annons");

  await expect(page.getByText("Ritning (Kontor)", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ladda upp" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Byt fil" })).toHaveCount(0);

  await seedSkapaAnnonsDraft(page, "godkant");
  await page.reload();

  await expect(page.getByText("Ritning (Kontor)", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Byt fil" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ladda upp" })).toHaveCount(0);
});

test("the buyer's KYC-dokument FileUploadRow at granskning still renders and behaves as the simple binary layout", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-7002", "Karl", "Kopvis");

  await seedAnnons(page, {
    id: "e2e-fur-simple-annons",
    titel: "E2E FileUploadRow simple",
    agarUserId: "e2e-seller",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 50" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-fur-simple-interest",
    annonsId: "e2e-fur-simple-annons",
    kKod: "K-e2e-furs",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_198501017002",
  });
  await seedDeal(page, "e2e-fur-simple-interest", { steg: "granskning" });

  await page.goto("/kopare/affarer/e2e-fur-simple-interest");

  // No docState passed here — the row must stay the plain filename-or-
  // upload-control layout, no status dot/badge/contextual button. The file
  // input itself is intentionally CSS-hidden behind a styled label.
  await expect(page.getByLabel("KYC-dokument")).toBeAttached();
  await expect(page.getByText("Ladda upp fil", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Ladda upp" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Byt fil" })).toHaveCount(0);

  await page.getByLabel("KYC-dokument").setInputFiles({
    name: "kyc.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("e2e test file"),
  });

  await expect(page.getByText("kyc.pdf", { exact: true })).toBeVisible();
});
