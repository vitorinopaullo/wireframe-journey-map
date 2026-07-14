import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TreLinkLayout } from "@/components/layouts/TreLinkLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/hyresvard")({
  component: Landlord,
});

type CaseState = "utkast" | "skickad" | "påmind" | "godkänd" | "avslagen";
type Case = {
  id: string;
  lokal: string;
  hyresvard: string;
  sent?: string;
  lastNudge?: string;
  state: CaseState;
  daysSinceSent: number;
};

const initialCases: Case[] = [
  { id: "A-2041", lokal: "Restauranglokal · Södermalm", hyresvard: "Stenfast AB",    sent: "13 jun", lastNudge: "—",       state: "skickad", daysSinceSent: 2 },
  { id: "A-2042", lokal: "Kontor · Kungsholmen",        hyresvard: "Atrium Ljungberg", sent: "10 jun", lastNudge: "13 jun",  state: "påmind",  daysSinceSent: 5 },
  { id: "A-2038", lokal: "Butikslokal · Vasastan",      hyresvard: "Privat hyresvärd", sent: "8 jun",  lastNudge: "—",       state: "godkänd", daysSinceSent: 7 },
  { id: "A-2045", lokal: "Lagerlokal · Bromma",         hyresvard: "Hemfosa",          state: "utkast", daysSinceSent: 0 },
];

const påminnelseMallar = [
  "Vänlig påminnelse — vi har fortfarande en intresserad köpare som väntar.",
  "Är det något i underlaget som behöver kompletteras för ert beslut?",
  "Vi behöver besked senast {datum} för att kunna gå vidare med köparen.",
];

function Landlord() {
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [reminderOpen, setReminderOpen] = useState<string | null>(null);
  const [reminderText, setReminderText] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const sendReminder = (id: string) => {
    if (!reminderText.trim()) return;
    setCases((p) =>
      p.map((c) => (c.id === id ? { ...c, state: "påmind", lastNudge: "idag" } : c)),
    );
    setReminderOpen(null);
    setReminderText("");
    alert("Påminnelse skickad (wireframe-demo). Logg uppdaterad.");
  };

  const registerResponse = (id: string, godkänd: boolean) => {
    setCases((p) => p.map((c) => (c.id === id ? { ...c, state: godkänd ? "godkänd" : "avslagen" } : c)));
  };

  const overdue = cases.filter((c) => c.state !== "godkänd" && c.state !== "avslagen" && c.daysSinceSent >= 3).length;

  return (
    <TreLinkLayout>
      <PageHeader
        eyebrow="TreLink · adminzon · endast lokal"
        title="Hyresvärdsgodkännande"
        subtitle="Anonym profil till hyresvärd · all kommunikation går via TreLink för att skydda säljaren mot disintermediering."
        right={
          overdue > 0 ? (
            <span className="border border-foreground bg-foreground text-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
              ⚠ {overdue} obesvarade &gt; 3d
            </span>
          ) : (
            <WireTag>Allt under SLA</WireTag>
          )
        }
      />

      {/* Vad hyresvärden ser */}
      <div className="mb-6 flex items-start justify-between gap-3 border border-dashed border-muted-foreground/40 bg-muted/20 p-4">
        <div>
          <Annotation>Vad hyresvärden faktiskt ser</Annotation>
          <p className="mt-2 text-sm">
            Endast: <span className="font-mono">[omsättning · soliditet · UC-score · planerad bransch]</span>. <br />
            <span className="font-mono text-[11px] text-muted-foreground">INGET namn · INGEN telefon · INGEN mejl.</span>
          </p>
        </div>
        <WireBtn variant="ghost" onClick={() => setPreviewOpen((v) => !v)}>
          {previewOpen ? "Dölj förhandsvisning" : "Förhandsvisa profil"}
        </WireBtn>
      </div>

      {previewOpen && (
        <WireBox label="Förhandsvisning — så ser PDF:en ut för hyresvärden" className="mb-6">
          <div className="grid gap-3 md:grid-cols-2">
            <Field k="Ekonomi" v="Omsättning: 4.2 MSEK · Soliditet 38%" />
            <Field k="UC-score" v="A · mycket god kreditvärdighet" />
            <Field k="Verksamhet" v="Restaurang · oförändrad bransch" />
            <Field k="Övriga lokaler" v="0 hyresavtal med betalningsanmärkningar" />
          </div>
          <Annotation>
            <span className="mt-3 block">↳ PDF genereras automatiskt. Hyresvärden svarar via en länk som loggas hos TreLink.</span>
          </Annotation>
        </WireBox>
      )}

      {/* Ärenden */}
      <div className="space-y-3">
        {cases.map((c) => (
          <WireBox key={c.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <StateBadge state={c.state} />
                  {c.state !== "godkänd" && c.state !== "avslagen" && c.daysSinceSent >= 3 && (
                    <span className="border border-foreground bg-foreground text-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                      ⏱ {c.daysSinceSent}d utan svar
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground">#{c.id} · {c.hyresvard}</span>
                </div>
                <h3 className="font-medium">{c.lokal}</h3>
                <div className="mt-1 grid gap-x-4 gap-y-0.5 font-mono text-[11px] text-muted-foreground md:grid-cols-3">
                  <span>Skickad: {c.sent ?? "—"}</span>
                  <span>Senaste påm: {c.lastNudge ?? "—"}</span>
                  <span>Status: {c.state}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {c.state === "utkast" ? (
                  <WireBtn>Skicka anonym profil →</WireBtn>
                ) : c.state === "godkänd" || c.state === "avslagen" ? (
                  <WireBtn variant="ghost">Visa kommunikation</WireBtn>
                ) : (
                  <>
                    <WireBtn variant="ghost" onClick={() => setReminderOpen(reminderOpen === c.id ? null : c.id)}>
                      Skicka påminnelse
                    </WireBtn>
                    <WireBtn variant="secondary" onClick={() => registerResponse(c.id, true)}>Registrera ✓</WireBtn>
                    <WireBtn variant="secondary" onClick={() => registerResponse(c.id, false)}>Registrera ✕</WireBtn>
                  </>
                )}
              </div>
            </div>

            {reminderOpen === c.id && (
              <div className="mt-4 border-t border-dashed border-muted-foreground/40 pt-3">
                <Annotation>Snabbmallar</Annotation>
                <div className="mt-2 mb-3 flex flex-wrap gap-2">
                  {påminnelseMallar.map((m) => (
                    <button
                      key={m}
                      onClick={() => setReminderText(m)}
                      className="border border-dashed border-muted-foreground/50 px-2 py-1 text-left font-mono text-[10px] text-muted-foreground hover:border-foreground hover:text-foreground"
                    >
                      + {m.slice(0, 40)}…
                    </button>
                  ))}
                </div>
                <textarea
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  rows={3}
                  className="w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
                  placeholder="Text till hyresvärden — loggas och syns för säljaren."
                />
                <div className="mt-2 flex justify-end gap-2">
                  <WireBtn variant="ghost" onClick={() => { setReminderOpen(null); setReminderText(""); }}>Avbryt</WireBtn>
                  <button
                    onClick={() => sendReminder(c.id)}
                    disabled={!reminderText.trim()}
                    className={`border px-4 py-2 text-sm font-medium ${
                      reminderText.trim() ? "border-foreground bg-foreground text-background hover:opacity-80" : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    Skicka påminnelse →
                  </button>
                </div>
              </div>
            )}
          </WireBox>
        ))}
      </div>
    </TreLinkLayout>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-muted-foreground/30 bg-background p-3">
      <Annotation>{k}</Annotation>
      <div className="mt-1 text-sm">{v}</div>
    </div>
  );
}

function StateBadge({ state }: { state: CaseState }) {
  const map: Record<CaseState, { label: string; filled: boolean }> = {
    "utkast":   { label: "UTKAST",       filled: false },
    "skickad":  { label: "VÄNTAR SVAR",  filled: false },
    "påmind":   { label: "PÅMIND",       filled: false },
    "godkänd":  { label: "✓ GODKÄND",    filled: true  },
    "avslagen": { label: "✕ AVSLAGEN",   filled: true  },
  };
  const m = map[state];
  return (
    <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
      m.filled ? "border-foreground bg-foreground text-background" : "border-foreground/50"
    }`}>
      {m.label}
    </span>
  );
}
