import { test, expect } from "@playwright/test";
import { unlockGate, seedAccount } from "./helpers";

test("adding a note on the admin account page persists and displays with a timestamp", async ({
  page,
}) => {
  await unlockGate(page);
  await seedAccount(page, {
    id: "e2e-acc-notering",
    userId: "u_e2e_notering",
    bankid: { personnr: "19900101-9103", fornamn: "Note", efternamn: "Ringsson" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    role: "kopare",
    profil: { telefon: "070-1231231", epost: "note-e2e@example.com" },
  });

  await page.goto("/admin/anvandare/e2e-acc-notering");
  await expect(page.getByText("Inga anteckningar än.")).toBeVisible();

  await page
    .getByPlaceholder("T.ex. Ringde 2026-09-11, ville tänka en vecka till")
    .fill("Ringde 2026-09-11, ville tänka en vecka till");
  await page.getByRole("button", { name: "Logga" }).click();

  await expect(page.getByText("Ringde 2026-09-11, ville tänka en vecka till")).toBeVisible();
  await expect(page.getByText("Inga anteckningar än.")).toHaveCount(0);

  const noteringar = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("trelink-admin-noteringar") ?? "[]"),
  );
  expect(noteringar).toHaveLength(1);
  expect(noteringar[0].userId).toBe("u_e2e_notering");
  expect(noteringar[0].ts).toBeTruthy();
});
