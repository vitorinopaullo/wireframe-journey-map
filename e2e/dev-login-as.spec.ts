import { test, expect } from "@playwright/test";
import { unlockGate, seedAnnons, seedBuyerInterest, seedDeal, seedAccount } from "./helpers";

test('"Logga in som köparen" on admin.affarer.$id.tsx switches the session to the buyer account', async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-devlogin-buyer-annons",
    titel: "E2E devlogin buyer",
    agarUserId: "u_e2e_devlogin_seller1",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 100" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedAccount(page, {
    id: "e2e-acc-devlogin-buyer",
    userId: "u_e2e_devlogin_buyer1",
    bankid: { personnr: "19850101-9930", fornamn: "Kalle", efternamn: "Devlogin" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: {},
  });
  await seedBuyerInterest(page, {
    id: "e2e-devlogin-buyer-interest",
    annonsId: "e2e-devlogin-buyer-annons",
    kKod: "K-e2e-dlb",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_devlogin_buyer1",
  });
  await seedDeal(page, "e2e-devlogin-buyer-interest", { steg: "granskning" });

  await page.goto("/admin/affarer/e2e-devlogin-buyer-interest");
  await page.getByRole("button", { name: "Logga in som köparen →" }).click();

  await expect(page).toHaveURL(/\/kopare\/affarer\/e2e-devlogin-buyer-interest/);
  const session = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("trelink-session") ?? "null"),
  );
  expect(session.userId).toBe("u_e2e_devlogin_buyer1");
  expect(session.role).toBe("kopare");
  expect(session.bankid.fornamn).toBe("Kalle");
});

test('"Logga in som säljaren" on admin.affarer.$id.tsx switches the session to the seller account', async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-devlogin-seller-annons",
    titel: "E2E devlogin seller",
    agarUserId: "u_e2e_devlogin_seller2",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 101" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedAccount(page, {
    id: "e2e-acc-devlogin-seller",
    userId: "u_e2e_devlogin_seller2",
    bankid: { personnr: "19800101-9931", fornamn: "Sven", efternamn: "Devlogin" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "saljare",
    profil: {},
  });
  await seedBuyerInterest(page, {
    id: "e2e-devlogin-seller-interest",
    annonsId: "e2e-devlogin-seller-annons",
    kKod: "K-e2e-dls",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_devlogin_buyer2",
  });
  await seedDeal(page, "e2e-devlogin-seller-interest", { steg: "granskning" });

  await page.goto("/admin/affarer/e2e-devlogin-seller-interest");
  await page.getByRole("button", { name: "Logga in som säljaren →" }).click();

  await expect(page).toHaveURL(/\/saljare\/affarer\/e2e-devlogin-seller-interest/);
  const session = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("trelink-session") ?? "null"),
  );
  expect(session.userId).toBe("u_e2e_devlogin_seller2");
  expect(session.role).toBe("saljare");
  expect(session.bankid.fornamn).toBe("Sven");
});

test("the dev login shortcut shows an inline message instead of navigating when no real account exists", async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-devlogin-noaccount-annons",
    titel: "E2E devlogin no account",
    agarUserId: "trelink-demo",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 102" },
    workflow: { state: "publicerad", timeline: [] },
  });
  await seedBuyerInterest(page, {
    id: "e2e-devlogin-noaccount-interest",
    annonsId: "e2e-devlogin-noaccount-annons",
    kKod: "K-e2e-dlna",
    status: "vill-ga-vidare",
    skapadAt: new Date().toISOString(),
    userId: "u_e2e_devlogin_noaccount",
  });
  await seedDeal(page, "e2e-devlogin-noaccount-interest", { steg: "granskning" });

  await page.goto("/admin/affarer/e2e-devlogin-noaccount-interest");
  await page.getByRole("button", { name: "Logga in som säljaren →" }).click();

  // No real account for "trelink-demo" — stays on the admin page with an
  // explanatory message, doesn't navigate to an empty seller page.
  await expect(page).toHaveURL(/\/admin\/affarer\/e2e-devlogin-noaccount-interest/);
  await expect(
    page.getByText("Den här affären har inget riktigt inloggningsbart konto för säljaren"),
  ).toBeVisible();
});

test('"Logga in som säljaren" on admin.annonser.$id.tsx switches the session to the seller account', async ({
  page,
}) => {
  await unlockGate(page);

  await seedAnnons(page, {
    id: "e2e-devlogin-annons-seller",
    titel: "E2E devlogin annons seller",
    agarUserId: "u_e2e_devlogin_seller3",
    pris: "1 000 000",
    cat: "overlatelse",
    draft: { cat: "overlatelse", verksamhet: "Restaurang", adress: "E2E-gatan 103" },
    workflow: { state: "granskas", timeline: [] },
  });
  await seedAccount(page, {
    id: "e2e-acc-devlogin-seller3",
    userId: "u_e2e_devlogin_seller3",
    bankid: { personnr: "19800101-9932", fornamn: "Britt", efternamn: "Devlogin" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "saljare",
    profil: {},
  });

  await page.goto("/admin/annonser/e2e-devlogin-annons-seller");
  await page.getByRole("button", { name: "Logga in som säljaren →" }).click();

  await expect(page).toHaveURL(/\/saljare\/annons\/e2e-devlogin-annons-seller/);
  const session = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("trelink-session") ?? "null"),
  );
  expect(session.userId).toBe("u_e2e_devlogin_seller3");
  expect(session.role).toBe("saljare");
  expect(session.bankid.fornamn).toBe("Britt");
});
