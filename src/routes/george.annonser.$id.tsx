import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GeorgeLayout } from "@/components/layouts/GeorgeLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/annonser/$id")({
  component: ReviewDetail,
});

type DocState = "väntar-granskning" | "godkänt" | "komplettering-begärd" | "avvisat";

type Doc = {
  id: string;
  namn: string;
  typ: string; // tex "PDF · 2.3MB"
  obligatorisk: boolean;
  state: DocState;
  motivering?: string;
};

type LogEntry = {
  ts: string;
  vem: "Säljare" | "George" | "System";
  text: string;
};

const initialDocs: Doc[] = [
  { id: "d1", namn: "Registreringsbevis Bolagsverket", typ: "PDF · 412 KB", obligatorisk: true,  state: "väntar-granskning" },
  { id: "d2", namn: "Resultaträkning 2024",            typ: "PDF · 1.1 MB", obligatorisk: true,  state: "väntar-granskning" },
  { id: "d3", namn: "Hyresavtal lokal",                typ: "PDF · 880 KB", obligatorisk: true,  state: "väntar-granskning" },
  { id: "d4", namn: "Inventarielista",                 typ: "XLSX · 64 KB", obligatorisk: true,  state: "väntar-granskning" },
  { id: "d5", namn: "Bilder (8 st)",                   typ: "JPG-paket",    obligatorisk: false, state: "väntar-granskning" },
];

const initialLog: LogEntry[] = [
  { ts: "2025-06-14 09:12", vem: "Säljare", text: "Skickade annonsen för granskning" },
  { ts: "2025-06-14 09:12", vem: "System",  text: "Tilldelad George-kön · SLA 24h" },
];

const kompletteringsMallar = [
  "Hyresavtalet saknar undertecknad sista sida — ladda upp på nytt med signatursida.",
  "Resultaträkningen är för 2023, vi behöver 2024 års siffror.",
  "Inventarielistan saknar uppskattat värde per post.",
  "Bilderna är för låg upplösning — minst 1600px bredd.",
];

const avvisningsOrsaker = [
  "Annonsen strider mot våra publiceringsregler",
  "Dubblettannons — finns redan publicerad",
  "Säljaren saknar rätt att överlåta verksamheten",
  "Bristfälligt underlag trots komplettering",
];

function ReviewDetail() {
  const { id } = Route.useParams();
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [log, setLog] = useState<LogEntry[]>(initialLog);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [kompletteringText, setKompletteringText] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  const stats = useMemo(() => {
    const ob = docs.filter((d) => d.obligatorisk);
    return {
      total: docs.length,
      ok: docs.filter((d) => d.state === "godkänt").length,
      vantar: docs.filter((d) => d.state === "väntar-granskning").length,
      kompl: docs.filter((d) => d.state === "komplettering-begärd").length,
      avvis: docs.filter((d) => d.state === "avvisat").length,
      obligatoriskaOk: ob.filter((d) => d.state === "godkänt").length,
      obligatoriskaTotal: ob.length,
    };
  }, [docs]);

  const canPublish = stats.obligatoriskaOk === stats.obligatoriskaTotal && stats.kompl === 0 && stats.avvis === 0;

  const stamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");

  const updateDoc = (docId: string, patch: Partial<Doc>, logText: string) => {
    setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, ...patch } : d)));
    setLog((prev) => [{ ts: stamp(), vem: "George", text: logText }, ...prev]);
  };

  const approve = (d: Doc) => updateDoc(d.id, { state: "godkänt", motivering: undefined }, `Godkände dokument: ${d.namn}`);

  const requestKomplettering = (d: Doc) => {
    if (!kompletteringText.trim()) return;
    updateDoc(d.id, { state: "komplettering-begärd", motivering: kompletteringText }, `Begärde komplettering på ${d.namn}: "${kompletteringText.slice(0, 60)}${kompletteringText.length > 60 ? "…" : ""}"`);
    setKompletteringText("");
    setActiveDoc(null);
  };

  const publish = () => {
    if (!canPublish) return;
    setLog((prev) => [{ ts: stamp(), vem: "George", text: "Publicerade annonsen · synlig för köpare" }, ...prev]);
    alert("Annons #" + id + " publicerad (wireframe-demo). Säljaren får notis.");
  };

  const reject = () => {
    if (!rejectReason) return;
    setLog((prev) => [{ ts: stamp(), vem: "George", text: `Avvisade annonsen · ${rejectReason}${rejectNote ? ` — "${rejectNote}"` : ""}` }, ...prev]);
    setRejectOpen(false);
    setRejectReason("");
    setRejectNote("");
    alert("Annons avvisad (wireframe-demo). Säljaren får motivering.");
  };

  return (
    <GeorgeLayout>
      <PageHeader
        eyebrow={`George · granskning #${id}`}
        title="Frisörsalong · Vasastan"
        subtitle="Inkråm · säljare S-104 · inkommen 2025-06-14 09:12"
        right={
          <div className="flex items-center gap-2">
            <Link to="/george/annonser" className="text-xs text-muted-foreground underline hover:text-foreground">
              ← Tillbaka till inkorgen
            </Link>
          </div>
        }
      />

      {/* Progress + beslutsknappar */}
      <WireBox className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Granskningsstatus</div>
            <div className="mt-1 text-lg font-semibold">
              {stats.obligatoriskaOk}/{stats.obligatoriskaTotal} obligatoriska godkända
              {stats.kompl > 0 && <span className="ml-3 text-sm text-muted-foreground">· {stats.kompl} väntar på säljare</span>}
              {stats.vantar > 0 && <span className="ml-3 text-sm text-muted-foreground">· {stats.vantar} ogranskade</span>}
            </div>
            <div className="mt-2 h-2 w-full max-w-md border border-foreground/30 bg-background">
              <div className="h-full bg-foreground" style={{ width: `${(stats.obligatoriskaOk / Math.max(stats.obligatoriskaTotal, 1)) * 100}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <WireBtn variant="ghost" onClick={() => setRejectOpen((v) => !v)}>Avvisa annons</WireBtn>
            <button
              disabled={!canPublish}
              onClick={publish}
              className={`border px-4 py-2 text-sm font-medium ${
                canPublish ? "border-foreground bg-foreground text-background hover:opacity-80" : "border-muted-foreground/30 bg-muted/30 text-muted-foreground cursor-not-allowed"
              }`}
            >
              {canPublish ? "Publicera annons →" : "Publicera (lås upp först)"}
            </button>
          </div>
        </div>
        {!canPublish && (
          <Annotation>
            <span className="mt-3 block">
              ↳ För att publicera: alla obligatoriska dokument godkända, inga öppna kompletteringar/avvisningar.
            </span>
          </Annotation>
        )}
      </WireBox>

      {rejectOpen && (
        <WireBox label="Avvisa annons · kräver motivering" className="mb-6">
          <div className="space-y-3">
            <div>
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Orsak</span>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
              >
                <option value="">— välj orsak —</option>
                {avvisningsOrsaker.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Förtydligande till säljaren (valfritt)</span>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                className="w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
                placeholder="Skriv något konstruktivt — säljaren ser detta."
              />
            </div>
            <div className="flex justify-end gap-2">
              <WireBtn variant="ghost" onClick={() => setRejectOpen(false)}>Avbryt</WireBtn>
              <button
                onClick={reject}
                disabled={!rejectReason}
                className={`border px-4 py-2 text-sm font-medium ${rejectReason ? "border-foreground bg-foreground text-background hover:opacity-80" : "border-muted-foreground/30 text-muted-foreground"}`}
              >
                Avvisa & meddela säljare
              </button>
            </div>
          </div>
        </WireBox>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dokumentlistan */}
        <div className="lg:col-span-2 space-y-3">
          <Annotation>Granska varje dokument separat · beslut loggas direkt</Annotation>
          {docs.map((d) => (
            <WireBox key={d.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <DocStateBadge state={d.state} />
                    {d.obligatorisk ? <WireTag>obligatorisk</WireTag> : <span className="font-mono text-[10px] text-muted-foreground">valfri</span>}
                  </div>
                  <h4 className="font-medium">{d.namn}</h4>
                  <Annotation>{d.typ}</Annotation>
                  {d.motivering && (
                    <div className="mt-2 border-l-2 border-foreground/40 bg-muted/40 px-3 py-2 text-sm">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Motivering till säljare:</span>
                      <div>{d.motivering}</div>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <WireBtn variant="ghost" className="text-xs">Förhandsgranska</WireBtn>
                  {d.state !== "godkänt" && (
                    <WireBtn variant="secondary" onClick={() => approve(d)}>Godkänn</WireBtn>
                  )}
                  <WireBtn variant="ghost" onClick={() => setActiveDoc(activeDoc === d.id ? null : d.id)}>
                    Begär komplettering
                  </WireBtn>
                </div>
              </div>

              {activeDoc === d.id && (
                <div className="mt-4 border-t border-dashed border-muted-foreground/40 pt-3">
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Snabbmallar
                  </span>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {kompletteringsMallar.map((m) => (
                      <button
                        key={m}
                        onClick={() => setKompletteringText(m)}
                        className="border border-dashed border-muted-foreground/50 px-2 py-1 text-left font-mono text-[10px] text-muted-foreground hover:border-foreground hover:text-foreground"
                      >
                        + {m.slice(0, 40)}…
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={kompletteringText}
                    onChange={(e) => setKompletteringText(e.target.value)}
                    rows={3}
                    placeholder="Skriv tydligt vad säljaren ska göra. Detta skickas direkt till säljaren."
                    className="w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <WireBtn variant="ghost" onClick={() => { setActiveDoc(null); setKompletteringText(""); }}>Avbryt</WireBtn>
                    <button
                      disabled={!kompletteringText.trim()}
                      onClick={() => requestKomplettering(d)}
                      className={`border px-4 py-2 text-sm font-medium ${kompletteringText.trim() ? "border-foreground bg-foreground text-background hover:opacity-80" : "border-muted-foreground/30 text-muted-foreground"}`}
                    >
                      Skicka begäran →
                    </button>
                  </div>
                </div>
              )}
            </WireBox>
          ))}
        </div>

        {/* Sidopanel: säljare + logg */}
        <div className="space-y-4">
          <WireBox label="Säljare">
            <div className="text-sm">
              <div className="font-medium">S-104 · Anna Lindberg</div>
              <Annotation>Verifierad BankID · medlem sedan 2024</Annotation>
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px] text-muted-foreground">
                <div>Tidigare annonser: 0</div>
                <div>Svarstid: snabb</div>
              </div>
              <div className="mt-3 flex gap-2">
                <WireBtn variant="ghost" className="text-xs">Visa profil</WireBtn>
                <WireBtn variant="ghost" className="text-xs">Skicka meddelande</WireBtn>
              </div>
            </div>
          </WireBox>

          <WireBox label="Beslutslogg · synlig för säljaren">
            <ul className="space-y-3">
              {log.map((l, i) => (
                <li key={i} className="border-l-2 border-foreground/40 pl-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {l.ts} · {l.vem}
                  </div>
                  <div className="text-sm">{l.text}</div>
                </li>
              ))}
            </ul>
            <Annotation>
              <span className="mt-3 block">↳ Inget hemligt här. Säljaren ser exakt samma logg i sin vy.</span>
            </Annotation>
          </WireBox>

          <WireBox label="Tangentbordsgenvägar" variant="dashed">
            <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
              <li><kbd className="border border-muted-foreground/40 px-1">G</kbd> godkänn aktivt dok</li>
              <li><kbd className="border border-muted-foreground/40 px-1">K</kbd> begär komplettering</li>
              <li><kbd className="border border-muted-foreground/40 px-1">J/K</kbd> nästa/föregående</li>
              <li><kbd className="border border-muted-foreground/40 px-1">⌘↵</kbd> publicera</li>
            </ul>
          </WireBox>
        </div>
      </div>
    </GeorgeLayout>
  );
}

function DocStateBadge({ state }: { state: DocState }) {
  const map: Record<DocState, { label: string; filled: boolean }> = {
    "väntar-granskning": { label: "VÄNTAR GRANSKNING", filled: false },
    "godkänt": { label: "✓ GODKÄNT", filled: true },
    "komplettering-begärd": { label: "⏳ KOMPLETTERING BEGÄRD", filled: false },
    "avvisat": { label: "✕ AVVISAT", filled: true },
  };
  const m = map[state];
  return (
    <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${m.filled ? "border-foreground bg-foreground text-background" : "border-foreground/50 text-foreground"}`}>
      {m.label}
    </span>
  );
}
