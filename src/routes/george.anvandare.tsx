import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TreLinkLayout } from "@/components/layouts/TreLinkLayout";
import { WireBox, PageHeader, WireTag, Annotation } from "@/components/wire";
import { readAdminAccounts, type AdminAccountEvent } from "@/lib/mock-auth";

export const Route = createFileRoute("/george/anvandare")({
  component: Users,
});

function Users() {
  const [nya, setNya] = useState<AdminAccountEvent[]>([]);

  useEffect(() => {
    setNya(readAdminAccounts());
    const t = setInterval(() => setNya(readAdminAccounts()), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <TreLinkLayout>
      <PageHeader
        eyebrow="TreLink · adminzon"
        title="Användare & statistik"
        subtitle="Översikt över verifierade konton, aktiva annonser och affärsvolym."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Verifierade konton", String(412 + nya.length)],
          ["Nya (idag)", String(nya.length)],
          ["Aktiva annonser", "87"],
          ["Pågående affärer", "11"],
        ].map(([k, v]) => (
          <WireBox key={k} variant="dashed">
            <Annotation>{k}</Annotation>
            <div className="mt-1 font-mono text-2xl">{v}</div>
          </WireBox>
        ))}
      </div>

      <WireBox label="Nya konton — från BankID + onboarding" className="mb-6">
        {nya.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Inga nya konton ännu. När en användare avslutar onboardingen hamnar den här.
          </p>
        ) : (
          <ul className="divide-y divide-dashed divide-muted-foreground/30">
            {nya.map((a) => (
              <li key={a.id} className="grid grid-cols-1 gap-2 py-3 text-sm md:grid-cols-4">
                <div>
                  <Annotation>Namn & personnr</Annotation>
                  <div className="mt-1">
                    {a.bankid.fornamn} {a.bankid.efternamn}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{a.bankid.personnr}</div>
                </div>
                <div>
                  <Annotation>Roll</Annotation>
                  <div className="mt-1">
                    <WireTag>{a.role === "kopare" ? "Köpare" : a.role === "saljare" ? "Säljare" : "—"}</WireTag>
                  </div>
                </div>
                <div>
                  <Annotation>Kontakt</Annotation>
                  <div className="mt-1 text-xs">{a.profil?.epost || "—"}</div>
                  <div className="font-mono text-xs text-muted-foreground">{a.profil?.telefon || ""}</div>
                </div>
                <div>
                  <Annotation>Bolag</Annotation>
                  <div className="mt-1 text-xs">{a.profil?.bolag || "—"}</div>
                  <div className="font-mono text-xs text-muted-foreground">{a.profil?.orgnr || ""}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </WireBox>

      <WireBox label="Senast verifierade (historik)">
        <ul className="divide-y divide-dashed divide-muted-foreground/30">
          {["U-410 · BankID · 14 jun", "U-409 · BankID · 14 jun", "U-408 · BankID · 13 jun"].map((u) => (
            <li key={u} className="flex items-center justify-between py-3 text-sm">
              <span className="font-mono">{u}</span>
              <WireTag>OK</WireTag>
            </li>
          ))}
        </ul>
      </WireBox>
    </TreLinkLayout>
  );
}
