import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { initialWorkflow, logEntry, canSellerEdit } from "@/lib/annons-workflow";

export const Route = createFileRoute("/saljare/skapa-annons")({
  component: CreateListing,
  validateSearch: (s: Record<string, unknown>) => ({ edit: typeof s.edit === "string" ? s.edit : undefined }),
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
// Sparas av onboardingflödet ("Sätt upp ditt konto") — läses här för att visa en sammanfattning.
const ONBOARDING_SALJARE_KEY = "trelink-onboarding-saljare-uppgifter";

// Samma kategorier som TYP-fältet på annonskorten (@/components/ListingCard).
const VERKSAMHETSTYP_TAGGAR = ["Café & bageri", "Restaurang", "Frisör", "Butik", "Kontor", "Lager"];

// Förslagstaggar för "Vad säljer objektet in?" — läge/lokal-egenskaper och kundunderlag.
const LAGE_TAGGAR = ["Stora skyltfönster", "Nyrenoverat", "Uteservering möjlig"];
const KUNDUNDERLAG_TAGGAR = ["Stamkunder", "Turister", "Kontorskunder", "Återkommande kunder"];
const LAGET_TAGGAR = ["Nära tunnelbanan", "Nära pendeltåg", "Gångtrafik", "Gatuplan", "Bra skyltläge mot huvudgata", "Nära centrum", "Egen parkering", "Hörnläge", "Bra parkering"];
const UTVECKLING_TAGGAR = ["Lunchservering", "Catering", "Längre öppettider", "E-handel"];
const ANLEDNING_TAGGAR = ["Pension", "Ny satsning", "Flytt"];

type Draft = {
  cat: CatId;
  ort: string;
  adress: string;
  yta: string;
  verksamhet: string;
  orgnr: string;
  // Hyresvärd & BRF
  hyresvardNamn: string;
  hyresvardEmail: string;
  hyresvardTel: string;
  brfKontakt: string;
  // Säljande info till TreLink (används för att skriva annonstexten)
  verksamhetSedan: string;
  oppettider: string;
  anstallda: string;
  omsattning: string;
  resultat: string;
  usp: string;
  kundunderlag: string;
  laget: string;
  inventarier: string;
  anledning: string;
  potential: string;
  premium: boolean;
  docs: Record<string, DocState>;
};

const empty: Draft = {
  cat: "overlatelse",
  ort: "",
  adress: "",
  yta: "",
  verksamhet: "",
  orgnr: "",
  hyresvardNamn: "",
  hyresvardEmail: "",
  hyresvardTel: "",
  brfKontakt: "",
  verksamhetSedan: "",
  oppettider: "",
  anstallda: "",
  omsattning: "",
  resultat: "",
  usp: "",
  kundunderlag: "",
  laget: "",
  inventarier: "",
  anledning: "",
  potential: "",
  premium: false,
  docs: {},
};

const STEPS = ["Paket", "Grunduppgifter", "Underlag", "Granska & skicka"] as const;

function CreateListing() {
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(empty);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (editId) {
        const raw = localStorage.getItem("saljare-annonser");
        if (raw) {
          const list = JSON.parse(raw) as any[];
          const item = list.find((i) => i.id === editId);
          if (item?.draft) {
            // Låst för säljaren om den granskas / avtal / publicerad — skicka till detaljvyn
            const wfState = item?.workflow?.state ?? "granskas";
            if (!canSellerEdit(wfState)) {
              navigate({ to: "/saljare/annons/$id", params: { id: editId }, replace: true });
              return;
            }
            setDraft({ ...empty, ...item.draft });
            setStep(4);
            return;
          }
        }
      }
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
  }, [editId, navigate]);




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
    if (!draft.cat) errs[0].push("Välj paket.");
    if (!draft.yta) errs[1].push("Ange yta i m².");
    if (!draft.verksamhet) errs[1].push("Ange verksamhetstyp.");
    if (draft.cat === "aktie" && !/^\d{6}-?\d{4}$/.test(draft.orgnr))
      errs[1].push("Org.nr i format 556xxx-xxxx.");
    if (!draft.hyresvardEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.hyresvardEmail))
      errs[1].push("Ange hyresvärdens e-postadress.");
    if (!draft.hyresvardTel) errs[1].push("Ange hyresvärdens telefonnummer.");
    if (!draft.usp) errs[1].push("Välj minst en tagg för vad som gör verksamheten unik.");
    if (!draft.kundunderlag) errs[1].push("Välj minst en tagg för kundunderlaget.");
    if (!draft.laget) errs[1].push("Välj minst en tagg för läget.");
    const missingReq = requiredDocs.filter(
      (d) => d.required && (docStatus(d.name) === "saknas" || docStatus(d.name) === "komplettera")
    );
    if (missingReq.length) errs[2].push(`${missingReq.length} obligatoriska dokument saknas.`);
    return errs;
  }, [draft, requiredDocs]);

  const canContinue = (validation[step] ?? []).length === 0;

  const completion = useMemo(() => {
    const req = requiredDocs.filter((d) => d.required);
    const okDocs = req.filter((d) => {
      const s = docStatus(d.name);
      return s === "uppladdad" || s === "granskas" || s === "godkant";
    }).length;
    const fields = [
      draft.yta, draft.verksamhet,
      draft.hyresvardEmail, draft.hyresvardTel, draft.brfKontakt,
      draft.usp, draft.kundunderlag, draft.laget,
    ].filter(Boolean).length;
    return Math.round(((fields / 8) * 0.4 + (okDocs / Math.max(req.length, 1)) * 0.6) * 100);
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
    validation[1].length + validation[2].length + validation[3].length === 0;

  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow={editId ? "Säljarläge · Redigera annons" : "Säljarläge · Skapa annons"}
        title={STEPS[step]}
        subtitle={editId
          ? "Ändringarna skickas till TreLink för ny granskning innan annonsen publiceras igen."
          : "Gratis att annonsera. Paketavgiften tas ut först vid genomförd affär. TreLink granskar innan publicering."}

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
                {String(i + 1).padStart(2, "0")} {isDone ? <Check className="inline-block h-3 w-3 align-middle" /> : null}
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
          <KontoSammanfattning />

          <WireBox label="Hyresvärd & BRF" className="mb-6">
            <p className="text-sm text-muted-foreground">
              TreLink behöver kontaktuppgifter till hyresvärden för att få godkännande av överlåtelse.
              Vid BRF anger du kontaktpersonen i föreningen.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <WireFieldEditable
                label="Hyresvärdens namn"
                value={draft.hyresvardNamn}
                onChange={(v) => set("hyresvardNamn", v)}
                placeholder="Fastighetsbolaget AB"
                hint="Namn på hyresvärd, fastighetsägare eller bostadsrättsförening."
              />
              <WireFieldEditable
                label="Hyresvärdens telefon *"
                value={draft.hyresvardTel}
                onChange={(v) => set("hyresvardTel", v)}
                placeholder="+46 8 123 45 67"
              />
              {(() => {
                const email = draft.hyresvardEmail;
                const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                const showError = email.length === 0 || !emailValid;
                const errorMsg = email.length === 0
                  ? "Hyresvärdens e-postadress krävs för att gå vidare"
                  : "Ange en giltig e-postadress (t.ex. namn@företag.se)";
                return (
                  <label className="block">
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      HYRESVÄRD E-POST <span className="text-red-600">*</span>
                    </span>
                    <input
                      type="email"
                      required
                      aria-required="true"
                      aria-invalid={showError}
                      value={email}
                      onChange={(e) => set("hyresvardEmail", e.target.value)}
                      placeholder="info@fastighetsbolaget.se"
                      className={`block h-10 w-full border border-dashed bg-muted/20 px-3 text-sm focus:outline-none ${
                        showError
                          ? "border-red-600 focus:border-red-700"
                          : "border-muted-foreground/50 focus:border-foreground"
                      }`}
                    />
                    {showError && (
                      <span className="mt-1 block text-[11px] text-red-600">{errorMsg}</span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      Trelink skickar ett informationsmejl till hyresvärden när uppdragsavtalet är signerat. Detta krävs för att processen ska kunna starta.
                    </span>
                  </label>
                );
              })()}
              <WireFieldEditable
                label="BRF-kontaktperson"
                value={draft.brfKontakt}
                onChange={(v) => set("brfKontakt", v)}
                placeholder="För- och efternamn på kontaktperson i föreningen"
                hint="Frivilligt — fylls i om objektet ligger i en bostadsrättsförening"
              />
            </div>
          </WireBox>

          <WireBox label="Objektet" className="mb-6">
            <Annotation>
              TreLink sätter annonsrubrik och pris åt dig — vi kan marknaden och prissätter mot rätt köpargrupp.
              Fyll i grundfakta så vi vet vad vi jobbar med.
            </Annotation>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <WireFieldEditable
                label="Yta (m²) *"
                value={draft.yta}
                onChange={(v) => set("yta", v)}
                placeholder="180"
              />
              <VerksamhetstypSelect
                value={draft.verksamhet}
                onChange={(v) => set("verksamhet", v)}
              />
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

            <div className="mt-6 border-t border-dashed border-muted-foreground/30 pt-4">
              <Annotation>
                Vad säljer objektet in? — korta ord, t.ex. "nära tunnelbanan" eller "stora fönster".
              </Annotation>
              <div className="mt-3 grid grid-cols-1 gap-4">
                <TagMultiSelect
                  label="Vad gör verksamheten unik? *"
                  value={draft.usp}
                  onChange={(v) => set("usp", v)}
                  suggestions={LAGE_TAGGAR}
                />
                <TagMultiSelect
                  label="Kundunderlag *"
                  value={draft.kundunderlag}
                  onChange={(v) => set("kundunderlag", v)}
                  suggestions={KUNDUNDERLAG_TAGGAR}
                />
                <TagMultiSelect
                  label="Läget *"
                  value={draft.laget}
                  onChange={(v) => set("laget", v)}
                  suggestions={LAGET_TAGGAR}
                />
                <TagMultiSelect
                  label="Utvecklingsmöjligheter (frivilligt)"
                  value={draft.potential}
                  onChange={(v) => set("potential", v)}
                  suggestions={UTVECKLING_TAGGAR}
                />
                <TagMultiSelect
                  label="Anledning till försäljning (frivilligt)"
                  value={draft.anledning}
                  onChange={(v) => set("anledning", v)}
                  suggestions={ANLEDNING_TAGGAR}
                />
              </div>
            </div>
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

      {/* STEP 3 — Granska & skicka */}
      {step === 3 && (
        <>
          <WireBox label="Sammanfattning" className="mb-6">
            <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Row k="Paket" v={activeCat.name} />
              <Row k="Avgift vid affär" v={activeCat.avgift} />
              <Row k="Ort" v={draft.ort || "—"} />
              <Row k="Adress" v={draft.adress || "—"} />
              <Row k="Yta" v={draft.yta ? `${draft.yta} m²` : "—"} />
              <Row k="Verksamhet" v={draft.verksamhet || "—"} />
              <Row k="Hyresvärd e-post" v={draft.hyresvardEmail || "—"} />
              <Row k="Hyresvärd telefon" v={draft.hyresvardTel || "—"} />
              <Row k="BRF-kontaktperson" v={draft.brfKontakt || "—"} />
              <Row k="Nyckeltal" v="Hämtas från uppladdade dokument" />

              {draft.cat === "aktie" && <Row k="Org.nr" v={draft.orgnr || "—"} />}
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
                <Check className="inline-block h-4 w-4 mr-1 align-middle" /> Allt är ifyllt. Skickar du in nu får du besked från TreLink inom 24h på vardagar.
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
          {step < 3 ? (
            <WireBtn onClick={() => setStep((s) => s + 1)}>
              Nästa: {STEPS[step + 1]} →
            </WireBtn>
          ) : (
            <WireBtn
              onClick={() => {
                let itemId = editId ?? "";
                try {
                  const raw = localStorage.getItem("saljare-annonser") ?? "[]";
                  const list = JSON.parse(raw) as any[];
                  const now = new Date();
                  const base = {
                    titel: `${activeCat.name} · ${draft.verksamhet || "Nytt objekt"} · ${draft.ort || ""}`.trim(),
                    ort: draft.ort,
                    pris: "TreLink sätter pris",
                    cat: draft.cat,
                    status: "Granskas",
                    premium: draft.premium,
                    skickadAt: now.toISOString(),
                    draft,
                  };
                  if (editId) {
                    const idx = list.findIndex((i) => i.id === editId);
                    if (idx >= 0) {
                      const prev = list[idx];
                      const wf = logEntry(
                        prev.workflow ?? initialWorkflow(now),
                        "Säljare",
                        "Uppdaterade underlaget efter komplettering · ärendet är tillbaka på granskning",
                      );
                      list[idx] = { ...prev, ...base, workflow: { ...wf, state: "granskas" } };
                    }
                  } else {
                    itemId = "n" + Date.now();
                    list.unshift({
                      id: itemId,
                      views: 0,
                      intresse: 0,
                      ...base,
                      workflow: initialWorkflow(now),
                    });
                  }
                  localStorage.setItem("saljare-annonser", JSON.stringify(list));
                  if (!editId) localStorage.removeItem(STORAGE_KEY);
                } catch {}
                navigate({
                  to: "/saljare/annons-inskickad",
                  search: { id: itemId || undefined } as any,
                });
              }}
            >
              {editId ? "Skicka uppdaterad annons på granskning →" : "Skicka till TreLink för granskning →"}
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

type OnboardingSaljareData = {
  bolagsuppgifter: { bolag: string; orgnr: string; ort: string; adress: string };
  saljaruppgifter: { fornamn: string; efternamn: string; mobil: string; epost: string };
  firmatecknare: { roll: string; fornamn: string; efternamn: string; mail: string; mobil: string } | null;
};

function KontoSammanfattning() {
  const [data, setData] = useState<OnboardingSaljareData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_SALJARE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  if (!data) return null;

  const { bolagsuppgifter, saljaruppgifter, firmatecknare } = data;

  return (
    <WireBox label="Från kontoinställningen" variant="ghost" className="mb-6">
      <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Row k="Bolag" v={bolagsuppgifter.bolag || "—"} />
        <Row k="Org.nr" v={bolagsuppgifter.orgnr || "—"} />
        <Row k="Ort" v={bolagsuppgifter.ort || "—"} />
        <Row k="Adress" v={bolagsuppgifter.adress || "—"} />
      </dl>

      <div className="mt-6 border-t border-dashed border-muted-foreground/40 pt-6">
        <div className={firmatecknare ? "grid grid-cols-1 gap-6 md:grid-cols-2" : ""}>
          <div>
            <WireTag>Kontaktperson</WireTag>
            <dl className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Row k="Förnamn" v={saljaruppgifter.fornamn || "—"} />
              <Row k="Efternamn" v={saljaruppgifter.efternamn || "—"} />
              <Row k="Mobil" v={saljaruppgifter.mobil || "—"} />
              <Row k="Mail" v={saljaruppgifter.epost || "—"} />
            </dl>
          </div>

          {firmatecknare && (
            <div>
              <WireTag>Firmatecknare</WireTag>
              <dl className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Row k="Roll" v={firmatecknare.roll || "—"} />
                <Row k="Förnamn" v={firmatecknare.fornamn || "—"} />
                <Row k="Efternamn" v={firmatecknare.efternamn || "—"} />
                <Row k="Mail" v={firmatecknare.mail || "—"} />
                <Row k="Mobil" v={firmatecknare.mobil || "—"} />
              </dl>
            </div>
          )}
        </div>
      </div>
    </WireBox>
  );
}

function VerksamhetstypSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  function toggle(tag: string) {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag];
    onChange(next.join(", "));
  }

  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Verksamhetstyp *
      </span>
      <div className="flex flex-wrap gap-2 border border-dashed border-muted-foreground/50 bg-muted/20 p-3">
        {VERKSAMHETSTYP_TAGGAR.map((tag) => (
          <WireTag key={tag} active={selected.includes(tag)} onClick={() => toggle(tag)}>
            {tag}
          </WireTag>
        ))}
      </div>
      <span className="mt-1 block font-mono text-[10px] text-muted-foreground/70">
        Välj en eller flera kategorier som beskriver verksamheten.
      </span>
    </label>
  );
}

function TagMultiSelect({
  label,
  value,
  onChange,
  suggestions,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
}) {
  const [custom, setCustom] = useState("");
  const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || selected.includes(tag)) return;
    onChange([...selected, tag].join(", "));
  }

  function removeTag(tag: string) {
    onChange(selected.filter((t) => t !== tag).join(", "));
  }

  function submitCustom() {
    if (!custom.trim()) return;
    addTag(custom);
    setCustom("");
  }

  return (
    <div>
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="border border-dashed border-muted-foreground/50 bg-muted/20 p-3">
        {selected.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selected.map((tag) => (
              <WireTag key={tag} active onClick={() => removeTag(tag)}>
                {tag} <span aria-hidden="true" className="ml-1">×</span>
              </WireTag>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {suggestions
            .filter((tag) => !selected.includes(tag))
            .map((tag) => (
              <WireTag key={tag} onClick={() => addTag(tag)}>
                {tag}
              </WireTag>
            ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value.slice(0, 40))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitCustom();
              }
            }}
            placeholder="Egen tagg (ett par ord)…"
            className="h-8 flex-1 border border-dashed border-muted-foreground/50 bg-background px-2 text-sm focus:border-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={submitCustom}
            aria-label="Lägg till egen tagg"
            className="flex h-8 w-8 shrink-0 items-center justify-center border border-dashed border-muted-foreground/50 font-mono text-sm hover:border-foreground"
          >
            +
          </button>
        </div>
      </div>
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

function WireArea({
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="block w-full border border-dashed border-muted-foreground/50 bg-muted/20 p-3 text-sm focus:border-foreground focus:outline-none"
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
