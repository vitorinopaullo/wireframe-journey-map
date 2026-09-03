import { test, expect } from "@playwright/test";
import { unlockGate, seedSession, seedAnnons, seedFavorit, seedBuyerInterest } from "./helpers";

test("two buyer sessions in the same browser only see their own favorites and interests", async ({ context }) => {
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  // sessionStorage is per-tab, but localStorage (where favoriter/intressen live)
  // is shared across both tabs in this same browser context — exactly the
  // real-world scenario this fix protects against.
  await unlockGate(pageA);
  await seedSession(pageA, "19850101-1111", "Anna", "Andersson");
  await seedFavorit(pageA, {
    userId: "u_198501011111",
    annonsId: "buyerA-annons",
    titel: "Annons för köpare A",
    pris: 1000000,
    ort: "Stockholm",
    kategori: "Lokal",
    savedAt: new Date().toISOString(),
  });
  await seedBuyerInterest(pageA, {
    id: "bi-a",
    annonsId: "buyerA-annons",
    kKod: "K-1111",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_198501011111",
  });

  await unlockGate(pageB);
  await seedSession(pageB, "19900202-2222", "Bertil", "Bengtsson");
  await seedFavorit(pageB, {
    userId: "u_199002022222",
    annonsId: "buyerB-annons",
    titel: "Annons för köpare B",
    pris: 2000000,
    ort: "Göteborg",
    kategori: "Inkråm",
    savedAt: new Date().toISOString(),
  });
  await seedBuyerInterest(pageB, {
    id: "bi-b",
    annonsId: "buyerB-annons",
    kKod: "K-2222",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    userId: "u_199002022222",
  });

  await pageA.goto("/kopare/favoriter");
  await expect(pageA.getByText("Annons för köpare A")).toBeVisible();
  await expect(pageA.getByText("Annons för köpare B")).toHaveCount(0);

  await pageB.goto("/kopare/favoriter");
  await expect(pageB.getByText("Annons för köpare B")).toBeVisible();
  await expect(pageB.getByText("Annons för köpare A")).toHaveCount(0);

  // Buyer A cannot open buyer B's affär by guessing/typing its id directly.
  await pageA.goto("/kopare/affarer/bi-b");
  await expect(pageA.getByText("Ärendet hittades inte")).toBeVisible();
});

test("seller A cannot open seller B's ärende by navigating directly to its URL", async ({ context }) => {
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  await unlockGate(pageA);
  await seedSession(pageA, "19850101-3333", "Sven", "Svensson");
  await seedAnnons(pageA, {
    id: "sellerA-annons",
    titel: "Säljare A:s annons",
    agarUserId: "u_198501013333",
    draft: { cat: "overlatelse" },
    workflow: { state: "granskas", timeline: [] },
  });

  await unlockGate(pageB);
  await seedSession(pageB, "19900202-4444", "Britt", "Berg");
  await seedAnnons(pageB, {
    id: "sellerB-annons",
    titel: "Säljare B:s annons",
    agarUserId: "u_199002024444",
    draft: { cat: "overlatelse" },
    workflow: { state: "granskas", timeline: [] },
  });

  // Seller A tries to open seller B's ärende directly by URL.
  await pageA.goto("/saljare/annons/sellerB-annons");
  await expect(pageA.getByText("Ärendet hittades inte")).toBeVisible();

  // Sanity check: seller A can still open their own ärende.
  await pageA.goto("/saljare/annons/sellerA-annons");
  await expect(pageA.getByText("Säljare A:s annons")).toBeVisible();

  // One buyer interest per seller's own annons, so a leaked (unfiltered)
  // count would show 2 instead of 1 for each seller on dashboard.tsx.
  await seedBuyerInterest(pageA, {
    id: "bi-sellerA-lead",
    annonsId: "sellerA-annons",
    kKod: "K-8888",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
  });
  await seedBuyerInterest(pageA, {
    id: "bi-sellerB-lead",
    annonsId: "sellerB-annons",
    kKod: "K-9999",
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
  });

  await pageA.goto("/dashboard?mode=saljare");
  const minaAnnonserCard = pageA.locator("a", { hasText: "Mina annonser" });
  const intresseanmalningarCard = pageA.locator("a", { hasText: "Intresseanmälningar" });
  await expect(minaAnnonserCard.locator(".font-mono.text-3xl")).toHaveText("1");
  await expect(intresseanmalningarCard.locator(".font-mono.text-3xl")).toHaveText("1");
});
