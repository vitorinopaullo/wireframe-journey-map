import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, WireTag, StatusDot, Annotation, WireBtn } from "@/components/wire";

export const Route = createFileRoute("/affar/$id")({
  component: DealDetail,
  validateSearch: (s: Record<string, unknown>) => ({
    as: (s.as as "kopare" | "saljare" | undefined) ?? "kopare",
  }),
});

/* ---------- typer ---------- */
type StegState = "done" | "active" | "pending";
type Steg = {
  nyckel: string;
  label: string;
  state: StegState;
  note: string;
  vantar?: "dig" | "george" | "saljare" | "hyresvard";
};

const PRIS = 1_950_000;
const HANDPENNING = Math.round(PRIS * 0.1);

/* ---------- mock-data ---------- */
const baseTimeline: Steg[] = [
  {
    nyckel: "intresse",
    label: "Intresseanmälan mottagen",
    state: "done",
    note: "George granskade & godkände 12 jun",
  },
  {
    nyckel: "uc",
    label: "UC-kontroll & matchning",
    state: "done",
    note: "Godkänd 13 jun · säljaren har valt dig",
  },
  {
    nyckel: "hyresvard",
    label: "Hyresvärdens godkännande",
    state: "done",
    note: "Anonym profil skickad 13 jun · godkänd 18 jun",
  },
  {
    nyckel: "handpenning",
    label: "Handpenning till klientmedel",
    state: "active",
    note: "Betala 195 000 kr inom 48 h",
    vantar: "dig",
  },
  {
    nyckel: "signering",
    label: "Signering (BankID · Signicat)",
    state: "pending",
    note: "Båda parter signerar — kontaktuppgifter avslöjas",
  },
  {
    nyckel: "tilltrade",
    label: "Tillträde & medel frigörs",
    state: "pending",
    note: "Säljaren får betalt · Trelinks avgift dras",
  },
];

/* ---------- små komponenter ---------- */
function ActionPanel({
  steg,
  onAction,
}: {
  steg: Steg;
  onAction: (k: string) => void;
}) {
  if (steg.vantar !== "dig") {
    return (
      <WireBox label="Status" variant="dashed">
        <p className="text-sm">
          Just nu väntar vi på{" "}
          <span className="font-medium">
            {steg.vantar === "george" ? "George" : steg.vantar === "saljare" ? "säljaren" : "hyresvärden"}
          </span>
          . Du behöver inte göra något — vi mejlar när det är din tur.
        </p>
      </WireBox>
    );
  }

  if (steg.nyckel === "handpenning") {
    return (
      <WireBox label="✱ Din tur — handpenning" className="border-2 border-foreground">
        <Annotation>Steg 4 av 6</Annotation>
        <h3 className="mt-1 text-lg font-semibold">Betala handpenning</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          När handpenningen ligger på klientmedelskontot frigörs säljarens kontaktuppgifter och
          signeringen startar.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 border border-dashed border-muted-foreground/40 p-4 md:grid-cols-2">
          <div>
            <Annotation>Belopp</Annotation>
            <p className="mt-1 font-mono text-2xl">{HANDPENNING.toLocaleString("sv-SE")} kr</p>
          </div>
          <div>
            <Annotation>Förfaller</Annotation>
            <p className="mt-1 font-mono text-sm">Om 36 timmar</p>
          </div>
          <div>
            <Annotation>Bankgiro</Annotation>
            <p className="mt-1 font-mono text-sm">5050-1234 (klientmedel)</p>
          </div>
          <div>
            <Annotation>Referens</Annotation>
            <p className="mt-1 font-mono text-sm">AFR-A-2041</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <WireBtn onClick={() => onAction("paid")}>Jag har betalat ✓</WireBtn>
          <WireBtn variant="secondary">Ladda ner faktura (PDF)</WireBtn>
          <WireBtn variant="ghost">Fråga George</WireBtn>
        </div>

        <Annotation>
          <span className="mt-3 block">
            Pengarna ligger säkert hos tredje part tills tillträde är klart. Återbetalas vid avbruten affär.
          </span>
        </Annotation>
      </WireBox>
    );
  }

  if (steg.nyckel === "signering") {
    return (
      <WireBox label="✱ Din tur — signera avtal" className="border-2 border-foreground">
        <Annotation>Steg 5 av 6</Annotation>
        <h3 className="mt-1 text-lg font-semibold">Signera köpeavtalet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Läs igenom avtalet noga. Signering sker med BankID via Signicat. Båda parter måste signera
          inom 7 dagar.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2"><StatusDot state="done" /> Köpeavtal granskat av George</li>
          <li className="flex items-center gap-2"><StatusDot state="active" /> Du signerar</li>
          <li className="flex items-center gap-2"><StatusDot state="pending" /> Säljaren signerar</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <WireBtn onClick={() => onAction("signed")}>Öppna i Signicat →</WireBtn>
          <WireBtn variant="secondary">Förhandsgranska avtal (PDF)</WireBtn>
        </div>
      </WireBox>
    );
  }

  return null;
}

/* ---------- sida ---------- */
function DealDetail() {
  const { id } = Route.useParams();
  const { as } = Route.useSearch();
  const [overrides, setOverrides] = useState<Record<string, StegState>>({});

  const timeline = useMemo(
    () =>
      baseTimeline.map((s) => (overrides[s.nyckel] ? { ...s, state: overrides[s.nyckel] } : s)),
    [overrides]
  );

  // hitta aktivt steg (det första som inte är done)
  const aktiv = timeline.find((s) => s.state === "active") ?? timeline[timeline.length - 1];
  const klarAndel =
    timeline.filter((s) => s.state === "done").length / timeline.length;

  const onAction = (k: string) => {
    // markera nuvarande active som done, nästa pending som active
    setOverrides((prev) => {
      const next = { ...prev };
      const idx = timeline.findIndex((s) => s.state === "active");
      if (idx >= 0) {
        next[timeline[idx].nyckel] = "done";
        if (timeline[idx + 1]) next[timeline[idx + 1].nyckel] = "active";
      }
      return next;
    });
  };

  return (
    <PublicLayout>
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to={as === "kopare" ? "/kopare/affarer" : "/saljare/affarer"} className="hover:underline">
          ← Tillbaka till mina affärer
        </Link>
        <span>·</span>
        <span>Affär #{id}</span>
      </div>

      <PageHeader
        eyebrow={`Affär #${id} · Lokal · Stockholm · ${as === "kopare" ? "Köparvy" : "Säljarvy"}`}
        title="Restauranglokal · Hornstull"
        subtitle="Full transparens. Du ser exakt var affären står, vem som blockerar, och vad nästa steg är."
        right={
          <div className="flex flex-col items-end gap-2">
            <WireTag>Pågår · {Math.round(klarAndel * 100)} % klart</WireTag>
            <div className="h-1 w-48 bg-muted">
              <div className="h-1 bg-foreground transition-all" style={{ width: `${klarAndel * 100}%` }} />
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Action panel överst */}
          <ActionPanel steg={aktiv} onAction={onAction} />

          {/* Tidslinje */}
          <WireBox label="Tidslinje">
            <ol className="space-y-5">
              {timeline.map((t, i) => (
                <li key={t.nyckel} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <StatusDot state={t.state} />
                    {i < timeline.length - 1 && <div className="mt-1 h-12 w-px bg-foreground/20" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{t.label}</h4>
                      <WireTag>
                        {t.state === "done" ? "Klar" : t.state === "active" ? "Pågår" : "Kommande"}
                      </WireTag>
                      {t.vantar === "dig" && t.state === "active" && (
                        <WireTag>Din tur</WireTag>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </WireBox>

          {/* Meddelanden */}
          <WireBox label="Meddelanden med George">
            <div className="space-y-3">
              <div className="border-l-2 border-foreground/40 pl-3">
                <Annotation>George · för 2 h sedan</Annotation>
                <p className="mt-1 text-sm">
                  Hej! Hyresvärden godkände er. Faktura för handpenning är på väg — betala inom 48 h
                  så ordnar jag signering direkt.
                </p>
              </div>
              <textarea
                rows={3}
                placeholder="Skriv ett meddelande till George…"
                className="w-full border border-dashed border-muted-foreground/50 bg-background p-3 text-sm focus:border-foreground focus:outline-none"
              />
              <div className="flex justify-end">
                <WireBtn variant="secondary">Skicka</WireBtn>
              </div>
            </div>
          </WireBox>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <WireBox label="Affärssammanfattning">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Pris</span><span className="font-mono">{PRIS.toLocaleString("sv-SE")} kr</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Handpenning</span><span className="font-mono">{HANDPENNING.toLocaleString("sv-SE")} kr</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Trelinks avgift</span><span className="font-mono">vid tillträde</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tillträde (prel.)</span><span className="font-mono">1 aug 2026</span></div>
            </div>
          </WireBox>

          <WireBox label="Parter">
            <div className="space-y-3 text-sm">
              <div>
                <Annotation>Säljare</Annotation>
                <p>Anonym tills signering</p>
              </div>
              <div>
                <Annotation>Köpare</Annotation>
                <p>{as === "kopare" ? "Du" : "Anonym tills signering"}</p>
              </div>
              <div>
                <Annotation>Mäklare</Annotation>
                <p>George · george@trelink.se</p>
              </div>
            </div>
          </WireBox>

          <WireBox label="Dokument" variant="dashed">
            <ul className="space-y-2 text-xs">
              {[
                ["Köpeavtal (utkast)", "Granskas"],
                ["Hyreskontrakt", "Klart"],
                ["Inventarielista", "Klart"],
                ["UC-rapport (köpare)", "Endast George"],
              ].map(([n, s]) => (
                <li key={n} className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 py-1.5">
                  <span>▤ {n}</span>
                  <WireTag>{s}</WireTag>
                </li>
              ))}
            </ul>
          </WireBox>

          <WireBox label="Hyresvärd · anonym profil" variant="ghost">
            <p className="text-xs text-muted-foreground">
              Skickad: ekonomi, UC, verksamhetstyp. Inga personuppgifter.
            </p>
            <WireBtn variant="ghost" className="mt-3 w-full">
              Visa skickad profil
            </WireBtn>
          </WireBox>
        </aside>
      </div>
    </PublicLayout>
  );
}
