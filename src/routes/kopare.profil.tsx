import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireField, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";

export const Route = createFileRoute("/kopare/profil")({
  component: Profile,
});

type Tab = "uppgifter" | "verifieringar" | "ekonomi" | "fakturor" | "notiser" | "sakerhet";

const verifieringar = [
  { label: "BankID-identitet", state: "done" as const, note: "Anna Andersson · verifierad 12 jun 2026" },
  { label: "E-post bekräftad", state: "done" as const, note: "anna@exempel.se" },
  { label: "Mobil bekräftad", state: "done" as const, note: "+46 70 123 45 67" },
  { label: "UC-kreditkontroll", state: "active" as const, note: "Körs av TreLink vid aktiv affär — du behöver inte göra något" },
  { label: "Företagsuppgifter (frivilligt)", state: "pending" as const, note: "Lägg till org.nr för att snabba upp framtida affärer" },
];

const fakturor = [
  { nr: "INV-2041-H", titel: "Handpenning · Hornstull", belopp: 195_000, datum: "2026-06-19", status: "Betald" },
  { nr: "INV-2041-A", titel: "Trelinks förmedlingsavgift", belopp: 39_000, datum: "Vid tillträde", status: "Kommande" },
];

function Profile() {
  const [tab, setTab] = useState<Tab>("uppgifter");

  const tabs: { id: Tab; label: string }[] = [
    { id: "uppgifter", label: "Uppgifter" },
    { id: "verifieringar", label: "Verifieringar" },
    { id: "ekonomi", label: "Ekonomi" },
    { id: "fakturor", label: "Fakturor" },
    { id: "notiser", label: "Notiser" },
    { id: "sakerhet", label: "Säkerhet" },
  ];

  return (
    <AppLayout mode="kopare">
      <PageHeader
        eyebrow="Köparläge · Profil"
        title="Anna Andersson"
        subtitle="Dina uppgifter delas aldrig med säljare innan signering. TreLink ser endast det som behövs för granskning."
        right={
          <div className="flex flex-col items-end gap-2">
            <WireTag>BankID ✓</WireTag>
            <Annotation>Medlem sedan jan 2026</Annotation>
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-foreground/20">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition ${
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "uppgifter" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WireBox label="Personuppgifter">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <WireField label="Namn" placeholder="Anna Andersson" hint="Hämtat från BankID — ej redigerbart" />
                <WireField label="Personnummer" placeholder="••••••-••••" hint="Maskerat" />
                <WireField label="E-post" placeholder="anna@exempel.se" />
                <WireField label="Telefon" placeholder="+46 70 123 45 67" />
                <WireField label="Adress" placeholder="Storgatan 1, Stockholm" />
                <WireField label="Postnummer" placeholder="113 27" />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <WireBtn variant="ghost">Ångra</WireBtn>
                <WireBtn>Spara ändringar</WireBtn>
              </div>
            </WireBox>
          </div>
          <aside>
            <WireBox label="Företag (frivilligt)" variant="dashed">
              <div className="space-y-3">
                <WireField label="Företagsnamn" placeholder="Anna Restauranger AB" />
                <WireField label="Org.nr" placeholder="556677-8899" />
                <Annotation>
                  <span className="mt-1 block">
                    Lägg till org.nr om du köper via bolag — sparar tid vid nästa affär.
                  </span>
                </Annotation>
              </div>
            </WireBox>
          </aside>
        </div>
      )}

      {tab === "verifieringar" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {verifieringar.map((v) => (
              <WireBox key={v.label} className="flex items-center gap-4">
                <StatusDot state={v.state} />
                <div className="flex-1">
                  <h4 className="font-medium">{v.label}</h4>
                  <p className="mt-0.5 text-sm text-muted-foreground">{v.note}</p>
                </div>
                <WireTag>
                  {v.state === "done" ? "Klar" : v.state === "active" ? "Pågår" : "Frivilligt"}
                </WireTag>
              </WireBox>
            ))}
          </div>
          <aside>
            <WireBox label="Varför verifieringar?" variant="ghost">
              <p className="text-sm text-muted-foreground">
                Verifieringar bygger förtroende med säljare och hyresvärdar. Ju mer verifierat,
                desto snabbare flöde — och högre chans att bli vald.
              </p>
            </WireBox>
          </aside>
        </div>
      )}

      {tab === "ekonomi" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WireBox label="UC-kreditkontroll" variant="dashed">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Annotation>Status</Annotation>
                <p className="mt-1 text-sm">Senaste UC: 13 jun 2026 · <span className="font-medium">Godkänd</span></p>
                <p className="mt-2 text-xs text-muted-foreground">
                  UC körs av TreLink vid varje aktiv affär. Du ser aldrig själva rapporten — endast
                  status. Säljare ser bara "godkänd / ej godkänd".
                </p>
              </div>
              <WireTag>Adminägd</WireTag>
            </div>
          </WireBox>

          <WireBox label="Finansiering">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Lånelöfte</span><span className="font-mono">2 500 000 kr</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-mono">SEB</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Giltigt t.o.m.</span><span className="font-mono">2026-12-31</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <WireBtn variant="secondary">Ladda upp nytt lånelöfte</WireBtn>
              <WireBtn variant="ghost">Ta bort</WireBtn>
            </div>
          </WireBox>
        </div>
      )}

      {tab === "fakturor" && (
        <WireBox label="Fakturahistorik">
          <table className="w-full text-sm">
            <thead className="border-b border-foreground/20 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 text-left">Nr</th>
                <th className="py-2 text-left">Beskrivning</th>
                <th className="py-2 text-right">Belopp</th>
                <th className="py-2 text-left">Datum</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {fakturor.map((f) => (
                <tr key={f.nr} className="border-b border-dashed border-muted-foreground/30">
                  <td className="py-3 font-mono text-xs">{f.nr}</td>
                  <td className="py-3">{f.titel}</td>
                  <td className="py-3 text-right font-mono">{f.belopp.toLocaleString("sv-SE")} kr</td>
                  <td className="py-3 font-mono text-xs">{f.datum}</td>
                  <td className="py-3"><WireTag>{f.status}</WireTag></td>
                  <td className="py-3 text-right">
                    <WireBtn variant="ghost">PDF</WireBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Annotation>
            <span className="mt-3 block">
              Handpenning hålls på klientmedelskonto. Trelinks förmedlingsavgift dras vid tillträde.
            </span>
          </Annotation>
        </WireBox>
      )}

      {tab === "notiser" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WireBox label="Vad vill du få notiser om?">
            <ul className="space-y-3 text-sm">
              {[
                ["Ny annons matchar bevakning", true],
                ["Säljare har valt dig", true],
                ["Hyresvärd har svarat", true],
                ["Faktura/handpenning", true],
                ["Signering redo", true],
                ["Marknadsföringstips", false],
              ].map(([label, on]) => (
                <li key={String(label)} className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-2">
                  <span>{label as string}</span>
                  <input type="checkbox" defaultChecked={Boolean(on)} className="h-4 w-4 accent-foreground" />
                </li>
              ))}
            </ul>
          </WireBox>
          <WireBox label="Kanaler">
            <ul className="space-y-3 text-sm">
              {[["E-post", true], ["SMS", true], ["Push (app)", false]].map(([label, on]) => (
                <li key={String(label)} className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 pb-2">
                  <span>{label as string}</span>
                  <input type="checkbox" defaultChecked={Boolean(on)} className="h-4 w-4 accent-foreground" />
                </li>
              ))}
            </ul>
          </WireBox>
        </div>
      )}

      {tab === "sakerhet" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <WireBox label="Inloggning">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><StatusDot state="done" /> BankID (primär)</li>
              <li className="flex items-center gap-2"><StatusDot state="done" /> 2FA via SMS</li>
            </ul>
            <div className="mt-4">
              <WireBtn variant="secondary">Visa aktiva sessioner</WireBtn>
            </div>
          </WireBox>
          <WireBox label="Dataexport & radering" variant="dashed">
            <p className="text-sm text-muted-foreground">
              Du kan när som helst exportera all data eller begära radering. Pågående affärer måste
              avslutas först.
            </p>
            <div className="mt-4 flex gap-2">
              <WireBtn variant="ghost">Exportera data (JSON)</WireBtn>
              <WireBtn variant="ghost">Begär radering</WireBtn>
            </div>
          </WireBox>
        </div>
      )}
    </AppLayout>
  );
}
