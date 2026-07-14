import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/saljare/skapa-annons")({
  component: CreateListing,
});

type CatId = "overlatelse" | "inkram" | "aktie";

const cats: {
  id: CatId;
  name: string;
  one: string;
  avgift: string;
  tid: string;
  trelink: string;
  who: string;
}[] = [
  {
    id: "overlatelse",
    name: "Överlåtelse",
    one: "Du överlåter rätten till en hyreslokal — inget bolag, ingen verksamhet byter ägare.",
    avgift: "29 900 kr vid genomförd affär",
    tid: "Typiskt 3–6 veckor",
    trelink: "TreLink granskar hyresavtal & inventarier. Hyresvärden måste godkänna köparen.",
    who: "Bäst för: restauranger, butiker, salonger som vill släppa lokalen vidare.",
  },
  {
    id: "inkram",
    name: "Inkråm",
    one: "Tillgångar och verksamhet säljs till köparens bolag — du behåller ditt AB.",
    avgift: "39 900 kr vid genomförd affär",
    tid: "Typiskt 6–10 veckor",
    trelink: "TreLink granskar dokument: tillgångar, ekonomi, avtal.",
    who: "Bäst för: när du vill sälja verksamheten men behålla bolagsmanteln.",
  },
  {
    id: "aktie",
    name: "Aktieöverlåtelse",
    one: "Hela bolaget byter ägare. Alla avtal, anställda och historik följer med.",
    avgift: "79 900 kr vid genomförd affär",
    tid: "Typiskt 8–14 veckor",
    trelink: "TreLink kör full DD: AML, verklig huvudman, årsredovisningar, avtal.",
    who: "Bäst för: lönsamma bolag med substans där köparen vill ta över allt.",
  },
];

type DocState = "saknas" | "uppladdad" | "granskas" | "godkant" | "komplettera";

type DocSpec = { name: string; krav: string; required: boolean };

const docsByCat: Record<CatId, DocSpec[]> = {
  overlatelse: [
    { name: "Överlåtelseavtal", krav: "PDF · signerat av båda parter (mall finns hos TreLink)", required: true },
    { name: "Hyresavtal", krav: "PDF · alla sidor · signerat", required: true },
    { name: "Hyresavi", krav: "PDF · senaste, max 3 mån gammal", required: true },
    { name: "Bilder på lokalen", krav: "JPG/PNG · minst 6 st · dagsljus", required: true },
  ],
  inkram: [
    { name: "Hyresavtal", krav: "PDF · alla sidor · signerat", required: true },
    { name: "Hyresavi", krav: "PDF · senaste, max 3 mån gammal", required: true },
    { name: "Rörelseresultat", krav: "PDF från bokföring · senaste perioden", required: true },
    { name: "Bilder på verksamheten", krav: "JPG/PNG · minst 6 st · dagsljus", required: true },
    { name: "Balansräkning", krav: "PDF · senaste perioden", required: false },
    { name: "Årsredovisning", krav: "PDF · signerad", required: false },
  ],
  aktie: [
    { name: "Köpeavtal / aktieöverlåtelseavtal", krav: "PDF · mall finns hos TreLink", required: true },
    { name: "Hyresavtal", krav: "PDF · alla sidor · signerat", required: true },
    { name: "Hyresavi", krav: "PDF · senaste, max 3 mån gammal", required: true },
    { name: "Rörelseresultat", krav: "PDF från bokföring", required: true },
    { name: "Bilder", krav: "JPG/PNG · minst 6 st · dagsljus", required: true },
    { name: "Balansräkning", krav: "PDF · senaste perioden", required: false },
    { name: "Årsredovisning", krav: "PDF · signerad", required: false },
    { name: "Registreringsbevis", krav: "PDF · max 1 mån gammalt", required: false },
    { name: "Bolagsordning", krav: "PDF · aktuell", required: false },
    { name: "Aktiebrev / aktiebok", krav: "PDF/bild · aktuell", required: false },
    { name: "Bolagspärm", krav: "PDF · protokoll m.m.", required: false },
    { name: "Företagsinteckning", krav: "PDF · om det finns", required: false },
    { name: "Anställningsavtal", krav: "PDF per anställd · personuppgifter maskas av TreLink", required: false },
    { name: "Sociala medier", krav: "Länkar/handles till konton som följer med", required: false },
  ],
};

const STORAGE_KEY = "saljare-skapa-annons-draft-v2";

type Draft = {
  cat: CatId;
  rubrik: string;
  ort: string;
  pris: string;
  yta: string;
  verksamhet: string;
  orgnr: string;
  beskrivning: string;
  premium: boolean;
  docs: Record<string, DocState>;
  // Övrig info — vem är köparen / firmatecknare
  kopareTyp: "sjalv" | "assistent" | "";
  kopareNamn: string;
  kopareRoll: string;
  kopareTel: string;
  kopareEmail: string;
  signerareNamn: string;
  signerareRoll: string;
  ovrigt: string;
};

const empty: Draft = {
  cat: "overlatelse",
  rubrik: "",
  ort: "",
  pris: "",
  yta: "",
  verksamhet: "",
  orgnr: "",
  beskrivning: "",
  premium: false,
  docs: {},
  kopareTyp: "",
  kopareNamn: "",
  kopareRoll: "",
  kopareTel: "",
  kopareEmail: "",
  signerareNamn: "",
  signerareRoll: "",
  ovrigt: "",
};

const STEPS = ["Paket", "Grunduppgifter", "Underlag", "Övrig info", "Granska & skicka"] as const;

function CreateListing() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(empty);
  const [savedAt, setSavedAt] = useState<string | null>(null);

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
    const errs: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    if (!draft.cat) errs[0].push("Välj paket.");
    if (!draft.rubrik || draft.rubrik.length < 8) errs[1].push("Rubrik behövs (minst 8 tecken).");
    if (!draft.ort) errs[1].push("Ange ort.");
    if (!draft.pris) errs[1].push("Ange pris.");
    if (!draft.yta) errs[1].push("Ange yta i m².");
    if (draft.cat === "inkram" && !draft.verksamhet) errs[1].push("Ange verksamhetstyp.");
    if (draft.cat === "aktie" && !/^\d{6}-?\d{4}$/.test(draft.orgnr))
      errs[1].push("Org.nr i format 556xxx-xxxx.");
    if (!draft.beskrivning || draft.beskrivning.length < 40)
      errs[1].push("Skriv en beskrivning (minst 40 tecken).");
    const missingReq = requiredDocs.filter(
      (d) => d.required && (docStatus(d.name) === "saknas" || docStatus(d.name) === "komplettera")
    );
    if (missingReq.length) errs[2].push(`${missingReq.length} obligatoriska dokument saknas.`);
    if (!draft.signerareNamn) errs[3].push("Ange vem som är firmatecknare/signerare för säljande part.");
    if (!draft.signerareRoll) errs[3].push("Ange roll (VD, styrelseordförande etc.).");
    return errs;
  }, [draft, requiredDocs]);

  const canContinue = (validation[step] ?? []).length === 0;

  const completion = useMemo(() => {
    const req = requiredDocs.filter((d) => d.required);
    const okDocs = req.filter((d) => {
      const s = docStatus(d.name);
      return s === "uppladdad" || s === "granskas" || s === "godkant";
    }).length;
    const fields = [draft.rubrik, draft.ort, draft.pris, draft.beskrivning, draft.signerareNamn].filter(Boolean).length;
    return Math.round(((fields / 5) * 0.4 + (okDocs / Math.max(req.length, 1)) * 0.6) * 100);
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
  const canSubmit =
    validation[1].length + validation[2].length + validation[3].length + validation[4].length === 0;

  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow="Säljarläge · Skapa annons"
        title={STEPS[step]}
        subtitle="Gratis att annonsera. Paketavgiften tas ut först vid genomförd affär. TreLink granskar innan publicering."
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
      <div className="mb-6 grid grid-cols-5 gap-2">
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

      {/* STEP 0 — Paket */}
      {step === 0 && (
        <WireBox label="Välj paket — detta styr avgift, dokument och process" className="mb-6">
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
            <Annotation>Vad TreLink gör för dig</Annotation>
            <p className="mt-1 text-sm">{activeCat.trelink}</p>
          </div>
          <div className="mt-4 border-t border-dashed border-muted-foreground/30 pt-4">
            <Annotation>Dokument som krävs för {activeCat.name}</Annotation>
            <ul className="mt-2 grid grid-cols-1 gap-1 text-xs md:grid-cols-2">
              {docsByCat[draft.cat].map((d) => (
                <li key={d.name}>
                  {d.required ? "•" : "○"} {d.name}
                  {d.required ? <span className="text-muted-foreground"> *</span> : <span className="text-muted-foreground"> (frivilligt)</span>}
                </li>
              ))}
            </ul>
          </div>
        </WireBox>
      )}

      {/* STEP 1 — Grunduppgifter */}
      {step === 1 && (
        <>
          <WireBox label="Grunduppgifter" className="mb-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <WireFieldEditable
                label="Annonsrubrik *"
                value={draft.rubrik}
                onChange={(v) => set("rubrik", v)}
                placeholder="t.ex. Restauranglokal Södermalm, 180 m²"
                hint="Visas i sökresultat. Var konkret."
              />
              <WireFieldEditable
                label="Ort *"
                value={draft.ort}
                onChange={(v) => set("ort", v)}
                placeholder="Stockholm"
              />
              <WireFieldEditable
                label="Pris (kr) *"
                value={draft.pris}
                onChange={(v) => set("pris", v.replace(/[^\d]/g, ""))}
                placeholder="1 950 000"
                hint="Köparen ser detta. Du kan justera senare."
              />
              <WireFieldEditable
                label="Yta (m²) *"
                value={draft.yta}
                onChange={(v) => set("yta", v)}
                placeholder="180"
              />
              {draft.cat === "inkram" && (
                <WireFieldEditable
                  label="Verksamhetstyp *"
                  value={draft.verksamhet}
                  onChange={(v) => set("verksamhet", v)}
                  placeholder="Café & bageri"
                />
              )}
              {draft.cat === "aktie" && (
                <WireFieldEditable
                  label="Org.nr *"
                  value={draft.orgnr}
                  onChange={(v) => set("orgnr", v)}
                  placeholder="556123-4567"
                  hint="TreLink hämtar bolagsinfo från Bolagsverket."
                />
              )}
            </div>
          </WireBox>

          <WireBox label="Beskrivning *" className="mb-6">
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
        <WireBox label={`Underlag för ${activeCat.name}`} className="mb-6">
          <Annotation>* = obligatoriskt för att kunna skicka på granskning. Övriga stärker annonsen men går att komplettera senare.</Annotation>
          <div className="mt-3 space-y-3">
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
                      <div className="text-sm font-medium">
                        {d.name}
                        {d.required ? <span> *</span> : <span className="text-muted-foreground"> (frivilligt)</span>}
                      </div>
                      <Annotation>{d.krav}</Annotation>
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
              När du skickar in granskar TreLink varje dokument inom <strong>24h på vardagar</strong>.
              Du får mejl om något behöver kompletteras — annonsen publiceras automatiskt när allt är godkänt.
            </p>
          </div>
        </WireBox>
      )}

      {/* STEP 3 — Övrig info */}
      {step === 3 && (
        <>
          <WireBox label="Vem representerar säljaren?" className="mb-6">
            <Annotation>
              Ibland är den som lägger upp annonsen inte firmatecknare (t.ex. en assistent eller mäklare).
              TreLink behöver veta vem från styrelsen/VD som faktiskt skriver på kontraktet.
            </Annotation>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                onClick={() => set("kopareTyp", "sjalv")}
                className={`border p-3 text-left ${
                  draft.kopareTyp === "sjalv" ? "border-foreground bg-muted/40" : "border-dashed border-muted-foreground/40"
                }`}
              >
                <div className="text-sm font-medium">Jag är firmatecknare</div>
                <Annotation>Jag skriver på kontraktet själv.</Annotation>
              </button>
              <button
                onClick={() => set("kopareTyp", "assistent")}
                className={`border p-3 text-left ${
                  draft.kopareTyp === "assistent" ? "border-foreground bg-muted/40" : "border-dashed border-muted-foreground/40"
                }`}
              >
                <div className="text-sm font-medium">Jag agerar för någon annan</div>
                <Annotation>Firmatecknaren är en annan person (VD, styrelse, ägare).</Annotation>
              </button>
            </div>
          </WireBox>

          <WireBox label="Firmatecknare / signerare *" className="mb-6">
            <Annotation>Denna person måste vara behörig att teckna säljande bolagets firma.</Annotation>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <WireFieldEditable
                label="Namn *"
                value={draft.signerareNamn}
                onChange={(v) => set("signerareNamn", v)}
                placeholder="För- och efternamn"
              />
              <WireFieldEditable
                label="Roll *"
                value={draft.signerareRoll}
                onChange={(v) => set("signerareRoll", v)}
                placeholder="VD / Styrelseordförande / Ensam ägare"
              />
            </div>
          </WireBox>

          {draft.kopareTyp === "assistent" && (
            <WireBox label="Kontaktperson (den som driver affären åt firmatecknaren)" className="mb-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <WireFieldEditable
                  label="Namn"
                  value={draft.kopareNamn}
                  onChange={(v) => set("kopareNamn", v)}
                  placeholder="För- och efternamn"
                />
                <WireFieldEditable
                  label="Roll"
                  value={draft.kopareRoll}
                  onChange={(v) => set("kopareRoll", v)}
                  placeholder="t.ex. Assistent, mäklare, rådgivare"
                />
                <WireFieldEditable
                  label="Telefon"
                  value={draft.kopareTel}
                  onChange={(v) => set("kopareTel", v)}
                  placeholder="+46 ..."
                />
                <WireFieldEditable
                  label="E-post"
                  value={draft.kopareEmail}
                  onChange={(v) => set("kopareEmail", v)}
                  placeholder="namn@företag.se"
                />
              </div>
            </WireBox>
          )}

          <WireBox label="Övrig information till TreLink (frivilligt)" className="mb-6">
            <textarea
              value={draft.ovrigt}
              onChange={(e) => set("ovrigt", e.target.value)}
              rows={4}
              placeholder="Något TreLink bör veta inför granskningen? Ex. pågående förhandling med hyresvärd, personal ska följa med, m.m."
              className="block w-full border border-dashed border-muted-foreground/50 bg-muted/20 p-3 text-sm focus:border-foreground focus:outline-none"
            />
          </WireBox>
        </>
      )}

      {/* STEP 4 — Granska & skicka */}
      {step === 4 && (
        <>
          <WireBox label="Sammanfattning" className="mb-6">
            <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Row k="Paket" v={activeCat.name} />
              <Row k="Avgift vid affär" v={activeCat.avgift} />
              <Row k="Rubrik" v={draft.rubrik || "—"} />
              <Row k="Ort" v={draft.ort || "—"} />
              <Row k="Pris" v={draft.pris ? `${draft.pris} kr` : "—"} />
              <Row k="Yta" v={draft.yta ? `${draft.yta} m²` : "—"} />
              {draft.cat === "inkram" && <Row k="Verksamhet" v={draft.verksamhet || "—"} />}
              {draft.cat === "aktie" && <Row k="Org.nr" v={draft.orgnr || "—"} />}
              <Row k="Firmatecknare" v={draft.signerareNamn ? `${draft.signerareNamn} (${draft.signerareRoll})` : "—"} />
              {draft.kopareTyp === "assistent" && (
                <Row k="Kontaktperson" v={draft.kopareNamn ? `${draft.kopareNamn} · ${draft.kopareRoll}` : "—"} />
              )}
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
                      {d.required ? <span> *</span> : <span className="text-muted-foreground"> (frivilligt)</span>}
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

          {canSubmit ? (
            <WireBox className="mb-6">
              <p className="text-sm">
                ✓ Allt är ifyllt. Skickar du in nu får du besked från TreLink inom 24h på vardagar.
                Inget publiceras innan du har sett och godkänt slutversionen.
              </p>
            </WireBox>
          ) : (
            <WireBox className="mb-6" variant="dashed">
              <Annotation>Innan du kan skicka in</Annotation>
              <ul className="mt-2 list-inside list-disc text-sm">
                {[...validation[1], ...validation[2], ...validation[3], ...validation[4]].map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </WireBox>
          )}
        </>
      )}

      {/* Validation hints under content */}
      {step < 4 && validation[step].length > 0 && (
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
          <WireBtn
            variant="secondary"
            onClick={() => alert(`Utkast sparat ${savedAt ?? "nu"}. Du kan fortsätta senare från Mina annonser.`)}
          >
            Spara som utkast
          </WireBtn>
          <Annotation>{savedAt ? `Sparat ${savedAt}` : ""}</Annotation>
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <WireBtn variant="secondary" onClick={() => setStep((s) => s - 1)}>
              ← Tillbaka
            </WireBtn>
          )}
          {step < 4 ? (
            <WireBtn onClick={() => setStep((s) => s + 1)}>
              Nästa: {STEPS[step + 1]} →
            </WireBtn>
          ) : (
            <WireBtn
              onClick={() =>
                canSubmit &&
                alert("Skickad till TreLink för granskning. Du får besked inom 24h på vardagar.")
              }
              className={canSubmit ? "" : "cursor-not-allowed opacity-40"}
            >
              Skicka till TreLink för granskning →
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
  granskas: "Granskas av TreLink",
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
