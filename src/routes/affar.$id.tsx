import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { X, Check, CheckCircle2 } from "lucide-react";
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
  { nyckel: "intresse", label: "Intresseanmälan mottagen", state: "done", note: "TreLink granskade & godkände 12 jun" },
  { nyckel: "matchning", label: "Matchning", state: "done", note: "Godkänd 13 jun · säljaren har valt dig" },
  { nyckel: "hyresvard", label: "Hyresvärdens godkännande", state: "done", note: "Anonym profil skickad 13 jun · godkänd 18 jun" },
  { nyckel: "handpenning", label: "Handpenning till klientmedel", state: "done", note: "Inkommit 19 jun · 195 000 kr" },
  { nyckel: "signering", label: "Signering (BankID · Signicat)", state: "active", note: "Båda parter signerar — kontaktuppgifter avslöjas", vantar: "dig" },
  { nyckel: "tilltrade", label: "Tillträde & medel frigörs", state: "pending", note: "Säljaren får betalt · Trelinks avgift dras" },
];

/* ---------- Signicat-modal ---------- */
type SignPhase = "intro" | "review" | "bankid" | "waiting" | "done";

function SignModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<SignPhase>("intro");
  const [accepted, setAccepted] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!open) {
      setPhase("intro");
      setAccepted(false);
      setTick(0);
    }
  }, [open]);

  // simulate BankID polling
  useEffect(() => {
    if (phase !== "bankid") return;
    const t = setInterval(() => setTick((x) => x + 1), 700);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "bankid" && tick >= 5) setPhase("waiting");
    if (phase === "waiting" && tick >= 9) setPhase("done");
  }, [tick, phase]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl border-2 border-foreground bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        {/* topbar */}
        <div className="flex items-center justify-between border-b border-foreground/30 px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-foreground" />
            Signicat · BankID
          </div>
          <button onClick={onClose} className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Stäng <X className="inline-block h-3.5 w-3.5 ml-0.5 align-middle" />
          </button>
        </div>

        <div className="p-6">
          {phase === "intro" && (
            <>
              <Annotation>Steg 1 av 3 — Översikt</Annotation>
              <h2 className="mt-1 text-xl font-semibold">Du ska signera köpeavtal</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Granska avtalet, godkänn villkoren och signera med BankID. Säljaren får sedan en
                förfrågan och signerar i sin tur. När båda signerat frigörs kontaktuppgifter.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 border border-dashed border-muted-foreground/40 p-4 sm:grid-cols-2">
                <div><Annotation>Avtal</Annotation><p className="mt-1 text-sm">Köpeavtal AFR-A-2041</p></div>
                <div><Annotation>Köpesumma</Annotation><p className="mt-1 font-mono text-sm">{PRIS.toLocaleString("sv-SE")} kr</p></div>
                <div><Annotation>Handpenning</Annotation><p className="mt-1 font-mono text-sm">Mottagen <Check className="inline-block h-3.5 w-3.5 ml-0.5 align-middle" /></p></div>
                <div><Annotation>Giltigt t.o.m.</Annotation><p className="mt-1 font-mono text-sm">7 dagar</p></div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <WireBtn variant="ghost" onClick={onClose}>Avbryt</WireBtn>
                <WireBtn onClick={() => setPhase("review")}>Fortsätt →</WireBtn>
              </div>
            </>
          )}

          {phase === "review" && (
            <>
              <Annotation>Steg 2 av 3 — Avtalsvillkor</Annotation>
              <h2 className="mt-1 text-xl font-semibold">Läs igenom & godkänn</h2>

              <div className="mt-4 h-56 overflow-auto border border-dashed border-muted-foreground/40 bg-muted/20 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                §1. Parterna … (säljare/köpare, anonymiserade tills signering). <br />
                §2. Objekt … Restauranglokal Hornstull, inventarier enligt bilaga A. <br />
                §3. Köpesumma {PRIS.toLocaleString("sv-SE")} kr varav handpenning 10 %. <br />
                §4. Tillträdesdag 1 aug 2026. <br />
                §5. Hyreskontrakt övergår enligt hyresvärdens godkännande dat. 18 jun. <br />
                §6. Klientmedel hos Trelink, frigörs vid tillträde. <br />
                §7. Trelinks förmedlingsavgift dras vid frigörande. <br />
                §8. Tvist … allmän domstol, svensk lag. <br />
                — Bilagor: A. Inventarier B. Hyreskontrakt
              </div>

              <label className="mt-4 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
                />
                <span>
                  Jag har läst avtalet och bilagor, och godkänner villkoren.
                </span>
              </label>

              <div className="mt-5 flex justify-between gap-2">
                <WireBtn variant="secondary">Ladda ner avtal (PDF)</WireBtn>
                <div className="flex gap-2">
                  <WireBtn variant="ghost" onClick={() => setPhase("intro")}>← Tillbaka</WireBtn>
                  <button
                    disabled={!accepted}
                    onClick={() => setPhase("bankid")}
                    className={`inline-flex items-center justify-center border px-4 py-2 text-sm font-medium transition ${
                      accepted
                        ? "border-foreground bg-foreground text-background hover:opacity-80"
                        : "cursor-not-allowed border-muted-foreground/30 bg-muted text-muted-foreground"
                    }`}
                  >
                    Signera med BankID →
                  </button>
                </div>
              </div>
            </>
          )}

          {phase === "bankid" && (
            <div className="py-4 text-center">
              <Annotation>Steg 3 av 3 — BankID</Annotation>
              <h2 className="mt-1 text-xl font-semibold">Öppna BankID på din enhet</h2>
              <div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center border-2 border-foreground/40">
                <div className="text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Väntar… {tick}s
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Starta BankID-appen, granska transaktionen och skriv in din säkerhetskod.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <WireBtn variant="ghost" onClick={() => setPhase("review")}>Avbryt</WireBtn>
                <WireBtn variant="secondary">Visa QR-kod</WireBtn>
              </div>
            </div>
          )}

          {phase === "waiting" && (
            <div className="py-4 text-center">
              <Annotation>Slutför</Annotation>
              <h2 className="mt-1 text-xl font-semibold">Du har signerat <CheckCircle2 className="inline-block h-5 w-5 ml-1 align-middle" /></h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Säljaren har fått en förfrågan. Vi mejlar dig så snart säljaren har signerat.
              </p>
              <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm">
                <li className="flex items-center gap-2"><StatusDot state="done" /> Köpeavtal granskat</li>
                <li className="flex items-center gap-2"><StatusDot state="done" /> Du signerade {new Date().toLocaleDateString("sv-SE")}</li>
                <li className="flex items-center gap-2"><StatusDot state="active" /> Väntar på säljaren</li>
              </ul>
              <div className="mt-6 flex justify-center">
                <WireBtn onClick={() => { onComplete(); onClose(); }}>Tillbaka till affären</WireBtn>
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="py-4 text-center">
              <Annotation>Klart</Annotation>
              <h2 className="mt-1 text-xl font-semibold">Båda parter har signerat</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Kontaktuppgifter har frigjorts. Tillträde planeras till 1 aug 2026.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <WireBtn variant="secondary">Ladda ner signerat avtal</WireBtn>
                <WireBtn onClick={() => { onComplete(); onClose(); }}>Stäng</WireBtn>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-foreground/20 px-4 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Krypterat · juridiskt bindande · loggas hos Trelink
        </div>
      </div>
    </div>
  );
}

/* ---------- små komponenter ---------- */
function ActionPanel({
  steg,
  onAction,
  onOpenSign,
}: {
  steg: Steg;
  onAction: (k: string) => void;
  onOpenSign: () => void;
}) {
  if (steg.vantar !== "dig") {
    return (
      <WireBox label="Status" variant="dashed">
        <p className="text-sm">
          Just nu väntar vi på{" "}
          <span className="font-medium">
            {steg.vantar === "george" ? "TreLink" : steg.vantar === "saljare" ? "säljaren" : "hyresvärden"}
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
          <div><Annotation>Belopp</Annotation><p className="mt-1 font-mono text-2xl">{HANDPENNING.toLocaleString("sv-SE")} kr</p></div>
          <div><Annotation>Förfaller</Annotation><p className="mt-1 font-mono text-sm">Om 36 timmar</p></div>
          <div><Annotation>Bankgiro</Annotation><p className="mt-1 font-mono text-sm">5050-1234 (klientmedel)</p></div>
          <div><Annotation>Referens</Annotation><p className="mt-1 font-mono text-sm">AFR-A-2041</p></div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <WireBtn onClick={() => onAction("paid")}>Jag har betalat <Check className="inline-block h-4 w-4 ml-1 align-middle" /></WireBtn>
          <WireBtn variant="secondary">Ladda ner faktura (PDF)</WireBtn>
          <WireBtn variant="ghost">Fråga TreLink</WireBtn>
        </div>
      </WireBox>
    );
  }

  if (steg.nyckel === "signering") {
    return (
      <WireBox label="✱ Din tur — signera avtal" className="border-2 border-foreground">
        <Annotation>Steg 5 av 6</Annotation>
        <h3 className="mt-1 text-lg font-semibold">Signera köpeavtalet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Signering sker med BankID via Signicat. Båda parter måste signera inom 7 dagar.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2"><StatusDot state="done" /> Köpeavtal granskat av TreLink</li>
          <li className="flex items-center gap-2"><StatusDot state="active" /> Du signerar</li>
          <li className="flex items-center gap-2"><StatusDot state="pending" /> Säljaren signerar</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <WireBtn onClick={onOpenSign}>Öppna Signicat →</WireBtn>
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
  const [signOpen, setSignOpen] = useState(false);

  const timeline = useMemo(
    () => baseTimeline.map((s) => (overrides[s.nyckel] ? { ...s, state: overrides[s.nyckel] } : s)),
    [overrides]
  );

  const aktiv = timeline.find((s) => s.state === "active") ?? timeline[timeline.length - 1];
  const klarAndel = timeline.filter((s) => s.state === "done").length / timeline.length;

  const onAction = (_k: string) => {
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
          <ActionPanel steg={aktiv} onAction={onAction} onOpenSign={() => setSignOpen(true)} />

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
                      {t.vantar === "dig" && t.state === "active" && <WireTag>Din tur</WireTag>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </WireBox>

          <WireBox label="Meddelanden med TreLink">
            <div className="space-y-3">
              <div className="border-l-2 border-foreground/40 pl-3">
                <Annotation>TreLink · för 2 h sedan</Annotation>
                <p className="mt-1 text-sm">
                  Handpenning mottagen. Avtalet ligger i Signicat — signera när du är redo.
                </p>
              </div>
              <textarea
                rows={3}
                placeholder="Skriv ett meddelande till TreLink…"
                className="w-full border border-foreground/15 bg-background p-3 text-sm focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
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
              <div><Annotation>Säljare</Annotation><p>Anonym tills signering</p></div>
              <div><Annotation>Köpare</Annotation><p>{as === "kopare" ? "Du" : "Anonym tills signering"}</p></div>
              <div><Annotation>Mäklare</Annotation><p>TreLink · george@trelink.se</p></div>
            </div>
          </WireBox>

          <WireBox label="Dokument" variant="dashed">
            <ul className="space-y-2 text-xs">
              {[
                ["Köpeavtal (utkast)", "I Signicat"],
                ["Hyreskontrakt", "Klart"],
                ["Inventarielista", "Klart"],
              ].map(([n, s]) => (
                <li key={n} className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 py-1.5">
                  <span>▤ {n}</span>
                  <WireTag>{s}</WireTag>
                </li>
              ))}
            </ul>
          </WireBox>
        </aside>
      </div>

      <SignModal open={signOpen} onClose={() => setSignOpen(false)} onComplete={() => onAction("signed")} />
    </PublicLayout>
  );
}
