import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout, AdminComingSoon } from "@/components/layouts/AdminLayout";
import { PageHeader, WireBox, WireBtn, Annotation } from "@/components/wire";
import { ADMIN_ACCOUNTS_STORAGE_KEY } from "@/lib/mock-auth";
import { STORAGE_KEY as ANNONSER_STORAGE_KEY } from "@/lib/annons-workflow";
import { STORAGE_KEY as KOPARE_STORAGE_KEY } from "@/lib/kopare-workflow";
import { STORAGE_KEY as FAVORITER_STORAGE_KEY } from "@/lib/favoriter";
import { DEALS_KEY as AFFARER_STORAGE_KEY } from "@/lib/affar-workflow";
import { STORAGE_KEY as NOTISER_STORAGE_KEY } from "@/lib/admin-notiser";
import { STORAGE_KEY as SKAPA_ANNONS_DRAFT_KEY } from "@/routes/saljare.skapa-annons";

export const Route = createFileRoute("/admin/installningar")({
  component: AdminInstallningar,
});

// Sparas per användare som "trelink-onboarding-saljare-uppgifter:<userId>"
// (onboarding.tsx m.fl.) — går inte att importera som en enda nyckel eftersom
// den är dynamiskt sammansatt, så vi rensar alla nycklar med denna prefix.
const ONBOARDING_SALJARE_KEY_PREFIX = "trelink-onboarding-saljare-uppgifter:";

function AdminInstallningar() {
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);

  function rensaTestdata() {
    window.localStorage.removeItem(ADMIN_ACCOUNTS_STORAGE_KEY);
    window.localStorage.removeItem(ANNONSER_STORAGE_KEY);
    window.localStorage.removeItem(KOPARE_STORAGE_KEY);
    window.localStorage.removeItem(FAVORITER_STORAGE_KEY);
    window.localStorage.removeItem(AFFARER_STORAGE_KEY);
    window.localStorage.removeItem(NOTISER_STORAGE_KEY);
    window.localStorage.removeItem(SKAPA_ANNONS_DRAFT_KEY);
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(ONBOARDING_SALJARE_KEY_PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
    setConfirming(false);
    setCleared(true);
  }

  return (
    <AdminLayout>
      <PageHeader eyebrow="TreLink Admin" title="Inställningar" />

      <WireBox label="Testdata" variant="dashed" className="mb-6">
        <p className="mb-3 text-sm text-muted-foreground">
          Rensar alla konton (Användare), annonser, intresseanmälningar/favoriter, affärer, notiser
          och sparade utkast i denna webbläsare, så du kan börja om från ett tomt läge vid test.
        </p>

        {!confirming && !cleared && (
          <WireBtn variant="secondary" onClick={() => setConfirming(true)}>
            Rensa testdata
          </WireBtn>
        )}

        {confirming && (
          <div className="rounded-card border border-destructive/40 bg-destructive/5 p-3">
            <p className="mb-3 text-sm">Detta rensar alla konton och annonser — säker?</p>
            <div className="flex gap-2">
              <WireBtn
                variant="primary"
                className="border-destructive bg-destructive text-white"
                onClick={rensaTestdata}
              >
                Ja, rensa
              </WireBtn>
              <WireBtn variant="ghost" onClick={() => setConfirming(false)}>
                Avbryt
              </WireBtn>
            </div>
          </div>
        )}

        {cleared && (
          <p className="text-sm font-medium">
            ✓ Testdata rensad. Konton och annonser är nu borttagna.
          </p>
        )}

        <Annotation>
          <span className="mt-2 block">
            Prototyp — påverkar bara lokal localStorage i denna webbläsare.
          </span>
        </Annotation>
      </WireBox>

      <AdminComingSoon />
    </AdminLayout>
  );
}
