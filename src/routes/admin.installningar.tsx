import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout, AdminComingSoon } from "@/components/layouts/AdminLayout";
import { PageHeader, WireBox, WireBtn, Annotation } from "@/components/wire";
import { ADMIN_ACCOUNTS_STORAGE_KEY } from "@/lib/mock-auth";
import { STORAGE_KEY as ANNONSER_STORAGE_KEY } from "@/lib/annons-workflow";
import { STORAGE_KEY as KOPARE_STORAGE_KEY } from "@/lib/kopare-workflow";

export const Route = createFileRoute("/admin/installningar")({
  component: AdminInstallningar,
});

function AdminInstallningar() {
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);

  function rensaTestdata() {
    window.localStorage.removeItem(ADMIN_ACCOUNTS_STORAGE_KEY);
    window.localStorage.removeItem(ANNONSER_STORAGE_KEY);
    window.localStorage.removeItem(KOPARE_STORAGE_KEY);
    setConfirming(false);
    setCleared(true);
  }

  return (
    <AdminLayout>
      <PageHeader eyebrow="TreLink Admin" title="Inställningar" />

      <WireBox label="Testdata" variant="dashed" className="mb-6">
        <p className="mb-3 text-sm text-muted-foreground">
          Rensar alla konton (Användare), annonser samt affärer/intresseanmälningar sparade i denna webbläsare, så
          du kan börja om från ett tomt läge vid test.
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
              <WireBtn variant="primary" className="border-destructive bg-destructive text-white" onClick={rensaTestdata}>
                Ja, rensa
              </WireBtn>
              <WireBtn variant="ghost" onClick={() => setConfirming(false)}>
                Avbryt
              </WireBtn>
            </div>
          </div>
        )}

        {cleared && (
          <p className="text-sm font-medium">✓ Testdata rensad. Konton och annonser är nu borttagna.</p>
        )}

        <Annotation>
          <span className="mt-2 block">Prototyp — påverkar bara lokal localStorage i denna webbläsare.</span>
        </Annotation>
      </WireBox>

      <AdminComingSoon />
    </AdminLayout>
  );
}
