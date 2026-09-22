import { test, expect } from "@playwright/test";
import { unlockGate, seedSession } from "./helpers";

test("Rensa testdata clears sparhistorik, admin-noteringar and the current session", async ({
  page,
}) => {
  await unlockGate(page);
  await seedSession(page, "19850101-9999", "Reset", "Testsson", "kopare");

  await page.evaluate(() => {
    localStorage.setItem(
      "trelink-sparade-historik",
      JSON.stringify([
        {
          id: "h1",
          userId: "u_198501019999",
          annonsId: "annons-x",
          ts: new Date().toISOString(),
          handelse: "sparad",
        },
      ]),
    );
    localStorage.setItem(
      "trelink-admin-noteringar",
      JSON.stringify([
        {
          id: "n1",
          userId: "u_198501019999",
          ts: new Date().toISOString(),
          text: "Testanteckning",
        },
      ]),
    );
  });

  await page.goto("/admin/installningar");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Rensa testdata" }).click();
  await page.getByRole("button", { name: "Ja, rensa" }).click();

  await expect(page.getByText("Testdata rensad.")).toBeVisible();
  await expect(page.getByText("du är utloggad")).toBeVisible();

  const remaining = await page.evaluate(() => ({
    historik: localStorage.getItem("trelink-sparade-historik"),
    noteringar: localStorage.getItem("trelink-admin-noteringar"),
    session: sessionStorage.getItem("trelink-session"),
  }));
  expect(remaining.historik).toBeNull();
  expect(remaining.noteringar).toBeNull();
  expect(remaining.session).toBeNull();

  // A page that reads the session directly reflects the logged-out state.
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Logga in" })).toBeVisible();
});
