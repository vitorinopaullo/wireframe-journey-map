import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireField, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/saljare/skapa-annons")({
  component: CreateListing,
});

type CatId = "lokal" | "inkram" | "bolag";

const cats: {
  id: CatId;
  name: string;
  one: string;
  avgift: string;
  tid: string;
  george: string;
  who: string;
}[] = [
  {
    id: "lokal",
    name: "Lokal",
    one: "Du säljer rätten till en hyreslokal — inget bolag, ingen verksamhet byter ägare.",
    avgift: "29 500 kr vid genomförd affär",
    tid: "Typiskt 3–6 veckor",
    george: "George granskar hyresavtal & inventarier. Hyresvärden måste godkänna köparen.",
    who: "Bäst för: restauranger, butiker, salonger som vill släppa lokalen vidare.",
  },
  {
    id: "inkram",
    name: "Inkråm",
    one: "Tillgångar och verksamhet säljs till köparens bolag — du behåller ditt AB.",
    avgift: "49 500 kr vid genomförd affär",
    tid: "Typiskt 6–10 veckor",
    george: "George granskar varje dokument: tillgångar, avtal, personal, ekonomi.",
    who: "Bäst för: när du vill sälja verksamheten men behålla bolagsmanteln.",
  },
  {
    id: "bolag",
    name: "Aktiebolag",
    one: "Hela bolaget byter ägare. Alla avtal, anställda och historik följer med.",
    avgift: "79 500 kr vid genomförd affär",
    tid: "Typiskt 8–14 veckor",
    george: "George kör full DD: AML, verklig huvudman, årsredovisningar, avtal.",
    who: "Bäst för: lönsamma bolag med substans där köparen vill ta över allt.",
  },
];

type DocState = "saknas" | "uppladdad" | "granskas" | "godkant" | "komplettera";

const docsByCat: Record<CatId, { name: string; krav: string; comment?: string; init?: DocState }[]> = {
  lokal: [
    { name: "Hyreskontrakt", krav: "PDF · alla sidor · signerat" },
    { name: "Senaste hyresavi", krav: "PDF · max 3 mån gammal" },
    { name: "Inventarielista", krav: "PDF/XLSX · med uppskattat värde" },
    { name: "Bilder på lokalen", krav: "JPG/PNG · minst 6 st · dagsljus" },
  ],
  inkram: [
    { name: "Tillgångslista", krav: "XLSX · maskiner, inventarier, varulager" },
    { name: "Resultaträkning 2024", krav: "PDF från bokföring" },
    { name: "Balansräkning", krav: "PDF · senaste perioden" },
    { name: "Anställningsavtal", krav: "PDF per anställd · personuppgifter maskas av George" },
    { name: "Kundavtal (top 5)", krav: "PDF · vi prickar av överlåtbarhet" },
  ],
  bolag: [
    { name: "Registreringsbevis", krav: "PDF · max 1 mån gammalt" },
    { name: "Senaste årsredovisning", krav: "PDF · signerad" },
    { name: "Aktiebok", krav: "PDF/bild · aktuell" },
    { name: "Aktieägaravtal", krav: "PDF · om det finns" },
    { name: "Verklig huvudman", krav: "PDF från Bolagsverket" },
    { name: "Skuld- & pantbrevsregister", krav: "PDF · George beställer om du saknar" },
  ],
};

const STORAGE_KEY = "saljare-skapa-annons-draft";

type Draft = {
  cat: CatId;
  rubrik: string;
  ort: string;
  pris: string;
  storlek: string;
  verksamhet: string;
  orgnr: string;
  beskrivning: string;
  premium: boolean;
  docs: Record<string, DocState>;
};

const empty: Draft = {
  cat: "lokal",
  rubrik: "",
  ort: "",
  pris: "",
  storlek: "",
  verksamhet: "",
  orgnr: "",
  beskrivning: "",
  premium: false,
  docs: {},
};

const STEPS = ["Kategori", "Grunduppgifter", "Underlag", "Granska & skicka"] as const;

function CreateListing() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(empty);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { draft: Draft; step: number; savedAt: string };
        setDraft({ ...empty, ...parsed.draft });
        setStep(parsed.step ?? 0);
        setSavedAt(parsed.savedAt ?? null);
      }
    } catch {
      /* noop */
    }
  }, []);

  // Auto-save (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const now = new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, step, savedAt: now }));
      setSavedAt(now);
    }, 600);
    return () => clearTimeout(t);
  }, [draft, step]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const setDoc = (name: string, s: DocState) =>
    setDraft((d) => ({ ...d, docs: { ...d.docs, [name]: s } }));

  const requiredDocs = docsByCat[draft.cat];
  const docStatus = (name: string): DocState => draft.docs[name] ?? "saknas";

  const validation = useMemo(() => {
    const errs: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [] };
    if (!draft.cat) errs[0].push("Välj kategori.");
    if (!draft.rubrik || draft.rubrik.length < 8) errs[1].push("Rubrik behövs (minst 8 tecken).");
    if (!draft.ort) errs[1].push("Ange ort.");
    if (!draft.pris) errs[1].push("Ange pris.");
    if (draft.cat === "lokal" && !draft.storlek) errs[1].push("Ange storlek i m².");
    if (draft.cat === "inkram" && !draft.verksamhet) errs[1].push("Ange verksamhetstyp.");
    if (draft.cat === "bolag" && !/^\d{6}-?\d{4}$/.test(draft.orgnr))
      errs[1].push("Org.nr i format 556xxx-xxxx.");
    if (!draft.beskrivning || draft.beskrivning.length < 40)
      errs[1].push("Skriv en beskrivning (minst 40 tecken).");
    const missing = requiredDocs.filter(
      (d) => docStatus(d.name) === "saknas" || docStatus(d.name) === "komplettera"
    );
    if (missing.length) errs[2].push(`${missing.length} dokument saknas eller behöver kompletteras.`);
    return errs;
  }, [draft, requiredDocs]);

  const canContinue = (validation[step] ?? []).length === 0;

  const completion = useMemo(() => {
    const totalDocs = requiredDocs.length;
    const okDocs = requiredDocs.filter((d) => {
      const s = docStatus(d.name);
      return s === "uppladdad" || s === "granskas" || s === "godkant";
    }).length;
    const fields = [draft.rubrik, draft.ort, draft.pris, draft.beskrivning].filter(Boolean).length;
    return Math.round(((fields / 4) * 0.4 + (okDocs / Math.max(totalDocs, 1)) * 0.6) * 100);
  }, [draft, requiredDocs]);

  const reset = () => {
    if (confirm("Rensa utkast och börja om?")) {
      localStorage.removeItem(STORAGE_KEY);
      setDraft(empty);
      setStep(0);
      setSavedAt(null);
    }
  };

  const activeCat = cats.find((c) => c.id === draft.cat)!;

  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow="Säljarläge · Skapa annons"
        title={STEPS[step]}
        subtitle="Gratis att annonsera. Avgiften tas ut först vid genomförd affär. George granskar innan publicering."
        right={
          <div className="flex flex-col items-end gap-1">
            <WireTag>Steg {step + 1} av {STEPS.length}</WireTag>
            <Annotation>
              {savedAt ? `Utkast sparat ${savedAt}` : "Utkast sparas automatiskt"}
            </Annotation>
          </div>
        }
      />

      {/* Stepper */}
      <div className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => {
          const isDone = i < step;
          const isActive = i === step;
          return (
            <button
              key={label}
              onClick={() => setStep(i)}
              className={`border p-3 text-left transition ${
                isActive
                  ? "border-foreground bg-muted/40"
                  : isDone
                  ? "border-foreground/40"
                  : "border-dashed border-muted-foreground/30"
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {String(i + 1).padStart(2, "0")} {isDone ? "✓" : ""}
              </div>
              <div className="text-sm font-medium">{label}</div>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1 flex-1 bg-muted">
          <div className="h-full bg-foreground transition-all" style={{ width: `${completion}%` }} />
        </div>
        <Annotation>{completion}% komplett</Annotation>
      </div>

      {/* STEP 0 — Kategori */}
      {step === 0 && (
        <WireBox label="Välj kategori — detta styr avgift, dokument och process" className="mb-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {cats.map((c) => {
              const selected = draft.cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => set("cat", c.id)}
                  className={`border p-4 text-left transition ${
                    selected ? "border-foreground bg-muted/40" : "border-dashed border-muted-foreground/40"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">{c.name}</span>
                    {selected && <WireTag>Vald</WireTag>}
                  </div>
                  <p className="mb-3 text-xs">{c.one}</p>
                  <div className="space-y-1 border-t border-dashed border-muted-foreground/30 pt-2">
                    <Annotation>Avgift: {c.avgift}</Annotation>
                    <Annotation>Tid: {c.tid}</Annotation>
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">{c.who}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 border-t border-dashed border-muted-foreground/30 pt-4">
            <Annotation>Vad George gör för dig</Annotation>
            <p className="mt-1 text-sm">{activeCat.george}</p>
          </div>
        </WireBox>
      )}

      {/* STEP 1 — Grunduppgifter */}
      {step === 1 && (
        <>
          <WireBox label="Grunduppgifter" className="mb-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <WireFieldEditable
                label="Annonsrubrik"
                value={draft.rubrik}
                onChange={(v) => set("rubrik", v)}
                placeholder="t.ex. Restauranglokal Södermalm, 180 m²"
                hint="Visas i sökresultat. Var konkret."
              />
              <WireFieldEditable
                label="Ort"
                value={draft.ort}
                onChange={(v) => set("ort", v)}
                placeholder="Stockholm"
              />
              <WireFieldEditable
                label="Pris (kr)"
                value={draft.pris}
                onChange={(v) => set("pris", v.replace(/[^\d]/g, ""))}
                placeholder="1 950 000"
                hint="Köparen ser detta. Du kan justera senare."
              />
              {draft.cat === "lokal" && (
                <WireFieldEditable
                  label="Storlek (m²)"
                  value={draft.storlek}
                  onChange={(v) => set("storlek", v)}
                  placeholder="180"
                />
              )}
              {draft.cat === "inkram" && (
                <WireFieldEditable
                  label="Verksamhetstyp"
                  value={draft.verksamhet}
                  onChange={(v) => set("verksamhet", v)}
                  placeholder="Café & bageri"
                />
              )}
              {draft.cat === "bolag" && (
                <WireFieldEditable
                  label="Org.nr"
                  value={draft.orgnr}
                  onChange={(v) => set("orgnr", v)}
                  placeholder="556123-4567"
                  hint="George hämtar bolagsinfo från Bolagsverket."
                />
              )}
            </div>
          </WireBox>

          <WireBox label="Beskrivning" className="mb-6">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Berätta om verksamheten / lokalen
              </span>
              <textarea
                value={draft.beskrivning}
                onChange={(e) => set("beskrivning", e.target.value)}
                rows={6}
                placeholder="Vad gör verksamheten unik? Vilka är kunderna? Varför säljer du?"
                className="block w-full border border-dashed border-muted-foreground/50 bg-muted/20 p-3 text-sm focus:border-foreground focus:outline-none"
              />
              <Annotation>
                <span className="mt-1 block">{draft.beskrivning.length} tecken · minst 40</span>
              </Annotation>
            </label>
          </WireBox>
        </>
      )}

      {/* STEP 2 — Underlag */}
      {step === 2 && (
        <WireBox label={`Underlag för ${activeCat.name.toLowerCase()}`} className="mb-6">
          <div className="space-y-3">
            {requiredDocs.map((d) => {
              const s = docStatus(d.name);
              return (
                <div
                  key={d.name}
                  className="flex flex-col gap-3 border border-dashed border-muted-foreground/40 p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <DocStatusDot state={s} />
                    <div>
                      <div className="text-sm font-medium">{d.name}</div>
                      <Annotation>{d.krav}</Annotation>
                      {s === "komplettera" && d.comment && (
                        <p className="mt-1 text-[11px] text-foreground">George: {d.comment}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DocStatusTag state={s} />
                    {s === "saknas" || s === "komplettera" ? (
                      <WireBtn variant="secondary" onClick={() => setDoc(d.name, "uppladdad")}>
                        Ladda upp
                      </WireBtn>
                    ) : (
                      <WireBtn variant="ghost" onClick={() => setDoc(d.name, "saknas")}>
                        Byt fil
                      </WireBtn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-dashed border-muted-foreground/30 pt-4">
            <Annotation>Så fungerar granskningen</Annotation>
            <p className="mt-1 text-sm">
              När du skickar in granskar George varje dokument inom <strong>24h på vardagar</strong>.
              Du får mejl om något behöver kompletteras — annonsen publiceras automatiskt när allt är godkänt.
            </p>
          </div>
        </WireBox>
      )}

      {/* STEP 3 — Granska & skicka */}
      {step === 3 && (
        <>
          <WireBox label="Sammanfattning" className="mb-6">
            <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Row k="Kategori" v={activeCat.name} />
              <Row k="Avgift vid affär" v={activeCat.avgift} />
              <Row k="Rubrik" v={draft.rubrik || "—"} />
              <Row k="Ort" v={draft.ort || "—"} />
              <Row k="Pris" v={draft.pris ? `${draft.pris} kr` : "—"} />
              {draft.cat === "lokal" && <Row k="Storlek" v={draft.storlek ? `${draft.storlek} m²` : "—"} />}
              {draft.cat === "inkram" && <Row k="Verksamhet" v={draft.verksamhet || "—"} />}
              {draft.cat === "bolag" && <Row k="Org.nr" v={draft.orgnr || "—"} />}
            </dl>
          </WireBox>

          <WireBox label="Dokumentstatus" className="mb-6">
            <ul className="space-y-2">
              {requiredDocs.map((d) => {
                const s = docStatus(d.name);
                return (
                  <li key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <DocStatusDot state={s} /> {d.name}
                    </span>
                    <DocStatusTag state={s} />
                  </li>
                );
              })}
            </ul>
          </WireBox>

          <WireBox label="Premium (frivilligt)" variant="dashed" className="mb-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={draft.premium}
                onChange={(e) => set("premium", e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-medium">Premium-annons · 2 500 kr</p>
                <Annotation>
                  Extra exponering i topplistan i 30 dagar. Engångsbetalning, dras vid publicering.
                </Annotation>
              </div>
            </label>
          </WireBox>

          {validation[3].length === 0 && validation[2].length === 0 && validation[1].length === 0 ? (
            <WireBox className="mb-6">
              <p className="text-sm">
                ✓ Allt är ifyllt. Skickar du in nu får du besked från George inom 24h på vardagar.
                Inget publiceras innan du har sett och godkänt slutversionen.
              </p>
            </WireBox>
          ) : (
            <WireBox className="mb-6" variant="dashed">
              <Annotation>Innan du kan skicka in</Annotation>
              <ul className="mt-2 list-inside list-disc text-sm">
                {[...validation[1], ...validation[2], ...validation[3]].map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </WireBox>
          )}
        </>
      )}

      {/* Validation hints under content */}
      {step < 3 && validation[step].length > 0 && (
        <WireBox className="mb-6" variant="dashed">
          <Annotation>Komplettera innan nästa steg</Annotation>
          <ul className="mt-2 list-inside list-disc text-sm">
            {validation[step].map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </WireBox>
      )}

      {/* Footer nav */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-foreground/20 bg-background/95 px-4 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <WireBtn variant="ghost" onClick={reset}>
            Rensa utkast
          </WireBtn>
          <Annotation>{savedAt ? `Sparat ${savedAt}` : ""}</Annotation>
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <WireBtn variant="secondary" onClick={() => setStep((s) => s - 1)}>
              ← Tillbaka
            </WireBtn>
          )}
          {step < 3 ? (
            <WireBtn
              onClick={() => canContinue && setStep((s) => s + 1)}
              className={canContinue ? "" : "cursor-not-allowed opacity-40"}
            >
              Nästa: {STEPS[step + 1]} →
            </WireBtn>
          ) : (
            <WireBtn
              onClick={() => alert("Skickad till George för granskning. Du får besked inom 24h på vardagar.")}
              className={
                validation[1].length + validation[2].length + validation[3].length === 0
                  ? ""
                  : "cursor-not-allowed opacity-40"
              }
            >
              Skicka för granskning →
            </WireBtn>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-b border-dashed border-muted-foreground/30 pb-2">
      <Annotation>{k}</Annotation>
      <div className="mt-1 text-sm">{v}</div>
    </div>
  );
}

function WireFieldEditable({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block h-10 w-full border border-dashed border-muted-foreground/50 bg-muted/20 px-3 text-sm focus:border-foreground focus:outline-none"
      />
      {hint && <span className="mt-1 block font-mono text-[10px] text-muted-foreground/70">{hint}</span>}
    </label>
  );
}

const docLabels: Record<DocState, string> = {
  saknas: "Saknas",
  uppladdad: "Uppladdad",
  granskas: "Granskas av George",
  godkant: "Godkänt",
  komplettera: "Behöver kompletteras",
};

function DocStatusTag({ state }: { state: DocState }) {
  return <WireTag>{docLabels[state]}</WireTag>;
}

function DocStatusDot({ state }: { state: DocState }) {
  const cls =
    state === "godkant"
      ? "bg-foreground"
      : state === "granskas"
      ? "bg-foreground/60 ring-2 ring-foreground/20"
      : state === "uppladdad"
      ? "bg-foreground/40"
      : state === "komplettera"
      ? "bg-background border border-foreground"
      : "bg-background border border-dashed border-muted-foreground/60";
  return <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${cls}`} />;
}
