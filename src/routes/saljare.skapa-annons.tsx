import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { initialWorkflow, logEntry, canSellerEdit } from "@/lib/annons-workflow";
import {
  type CatId,
  cats,
  type DocState,
  type DocSpec,
  docsByCat,
  VERKSAMHETSTYP_TAGGAR,
  type KontorFalt,
  type ButikFalt,
  type LagerFalt,
  type ServeringFalt,
  type FrisorFalt,
  FALTGRUPP_TYPER,
  type Draft,
} from "@/lib/annons-model";

export const Route = createFileRoute("/saljare/skapa-annons")({
  component: CreateListing,
  validateSearch: (s: Record<string, unknown>) => ({ edit: typeof s.edit === "string" ? s.edit : undefined }),
});



const STORAGE_KEY = "saljare-skapa-annons-draft-v2";
// Sparas av onboardingflödet ("Sätt upp ditt konto") — läses här för att visa en sammanfattning.
const ONBOARDING_SALJARE_KEY = "trelink-onboarding-saljare-uppgifter";

// Förslagstaggar för "Vad säljer objektet in?" — läge/lokal-egenskaper och kundunderlag.
const LAGE_TAGGAR = ["Stora skyltfönster", "Nyrenoverat", "Uteservering möjlig"];
const KUNDUNDERLAG_TAGGAR = ["Stamkunder", "Turister", "Kontorskunder", "Återkommande kunder"];
const LAGET_TAGGAR = ["Nära tunnelbanan", "Nära pendeltåg", "Gångtrafik", "Gatuplan", "Bra skyltläge mot huvudgata", "Nära centrum", "Egen parkering", "Hörnläge", "Bra parkering"];
const UTVECKLING_TAGGAR = ["Lunchservering", "Catering", "Längre öppettider", "E-handel"];
const ANLEDNING_TAGGAR = ["Pension", "Ny satsning", "Flytt", "Utbränd", "Utlandsflytt"];

// Fältgrupp per Verksamhetstyp — lägg till fler typers fältkonfiguration här.
// Kontors gemensamma taggpool, uppdelad efter vilken textrad-kategori de hör till.
const KONTOR_TAGGAR_LAGE = [
  "Trafikerat läge",
  "Hörnlokal",
  "Bakgata",
  "Stenkast från mötesplats",
  "Kollektivtrafik",
  "Parkering",
  "Cykelvägar",
  "Grönområden",
  "Nära gym",
  "Nära restauranger",
  "Nära apotek",
  "Nära livsmedelsbutik",
  "Hiss",
];
const KONTOR_TAGGAR_INTERIOR = [
  "Modernt",
  "Renoveringsbehov",
  "Rustik",
  "Retro",
  "Hög takhöjd",
  "Konferensrum",
  "Tysta rum",
  "Samarbetsytor",
  "Mötesrum",
  "Lounge",
  "Lunchrum",
  "Reglerbart ljus",
  "Naturmaterial",
  "Miljömärkta material",
  "Hyllsystem",
  "Omklädningsrum",
  "Reception",
  "Ljust",
  "Rymligt",
];
const KONTOR_TAGGAR_PLANLOSNING = [
  "Lunchrum",
  "Wc/dusch",
  "Wc",
  "Förråd/lager",
  "Lastkaj",
  "Ritning",
  "Öppen planlösning",
  "Skrivbordsbås",
  "Många indelade rum",
  "Tysta rum",
  "Konferensrum",
  "Lounge",
  "Kundväntrum",
  "Stora fönster",
  "Mycket ljusinsläpp",
  "Typ av kök – pentry",
  "Fullt kök",
  "Inflyttningsklart",
  "Tillgänglighetsanpassad",
  "Co-working yta",
];
const KONTOR_TAGGAR_EKONOMI = ["Förmånlig hyra", "Värme ingår", "Vatten ingår", "Momsbefriad hyra", "Ventilation ingår", "Stabil förening"];
const KONTOR_TAGGAR_TEKNISK_INFO = [
  "Fiberanslutning",
  "OVK godkänt",
  "God ventilation",
  "Larm",
  "Wifi",
  "Mötesteknik",
  "Elladdstation",
  "Serverrum",
];

const emptyKontorFalt: KontorFalt = {
  lage: "",
  interior: "",
  planlosning: "",
  ekonomi: "",
  taggar: "",
  beskrivning: "",
};

// Butiks gemensamma taggpool, uppdelad efter vilken textrad-kategori de hör till.
const BUTIK_TAGGAR_LAGE = [
  "Trafikerat läge",
  "Hörnlokal",
  "Bakgata",
  "Stenkast från mötesplats",
  "Kollektivtrafik",
  "Parkering",
  "Cykelvägar",
  "Grönområden",
  "Nära gym",
  "Nära restauranger",
  "Nära apotek",
  "Nära livsmedelsbutik",
  "Hiss",
];
const BUTIK_TAGGAR_INTERIOR = [
  "Modernt",
  "Renoveringsbehov",
  "Rustik",
  "Retro",
  "Hög takhöjd",
  "Konferensrum",
  "Tysta rum",
  "Samarbetsytor",
  "Mötesrum",
  "Lounge",
  "Lunchrum",
  "Reglerbart ljus",
  "Naturmaterial",
  "Miljömärkta material",
  "Hyllsystem",
  "Omklädningsrum",
  "Reception",
  "Ljust",
  "Rymligt",
];
const BUTIK_TAGGAR_PLANLOSNING = [
  "Lunchrum",
  "Wc/dusch",
  "Wc",
  "Förråd/lager",
  "Lastkaj",
  "Ritning",
  "Öppen planlösning",
  "Skrivbordsbås",
  "Många indelade rum",
  "Tysta rum",
  "Konferensrum",
  "Lounge",
  "Kundväntrum",
  "Stora fönster",
  "Mycket ljusinsläpp",
  "Typ av kök – pentry",
  "Fullt kök",
  "Inflyttningsklart",
  "Tillgänglighetsanpassad",
  "Co-working yta",
];
const BUTIK_TAGGAR_EKONOMI = ["Förmånlig hyra", "Värme ingår", "Vatten ingår", "Momsbefriad hyra", "Ventilation ingår", "Stabil förening"];
const BUTIK_TAGGAR_TEKNISK_INFO = [
  "Fiberanslutning",
  "OVK godkänt",
  "God ventilation",
  "Larm",
  "Wifi",
  "Mötesteknik",
  "Elladdstation",
  "Serverrum",
];

const emptyButikFalt: ButikFalt = {
  lage: "",
  interior: "",
  planlosning: "",
  ekonomi: "",
  taggar: "",
  beskrivning: "",
};

// Lagers gemensamma taggpool, uppdelad efter vilken textrad-kategori de hör till.
const LAGER_TAGGAR_LAGE = [
  "Trafikerat läge",
  "Hörnlokal",
  "Bakgata",
  "Stenkast från mötesplats",
  "Kollektivtrafik",
  "Parkering",
  "Cykelvägar",
  "Grönområden",
  "Nära gym",
  "Nära restauranger",
  "Nära apotek",
  "Nära livsmedelsbutik",
  "Hiss",
];
const LAGER_TAGGAR_INTERIOR = [
  "Modernt",
  "Renoveringsbehov",
  "Rustik",
  "Retro",
  "Hög takhöjd",
  "Konferensrum",
  "Tysta rum",
  "Samarbetsytor",
  "Mötesrum",
  "Lounge",
  "Lunchrum",
  "Reglerbart ljus",
  "Naturmaterial",
  "Miljömärkta material",
  "Hyllsystem",
  "Omklädningsrum",
  "Reception",
  "Ljust",
  "Rymligt",
];
const LAGER_TAGGAR_PLANLOSNING = [
  "Lunchrum",
  "Wc/dusch",
  "Wc",
  "Förråd/lager",
  "Lastkaj",
  "Ritning",
  "Öppen planlösning",
  "Skrivbordsbås",
  "Många indelade rum",
  "Tysta rum",
  "Konferensrum",
  "Lounge",
  "Kundväntrum",
  "Stora fönster",
  "Mycket ljusinsläpp",
  "Typ av kök – pentry",
  "Fullt kök",
  "Inflyttningsklart",
  "Tillgänglighetsanpassad",
  "Co-working yta",
];
const LAGER_TAGGAR_EKONOMI = ["Förmånlig hyra", "Värme ingår", "Vatten ingår", "Momsbefriad hyra", "Ventilation ingår", "Stabil förening"];
const LAGER_TAGGAR_TEKNISK_INFO = [
  "Fiberanslutning",
  "OVK godkänt",
  "God ventilation",
  "Larm",
  "Wifi",
  "Mötesteknik",
  "Elladdstation",
  "Serverrum",
];

const emptyLagerFalt: LagerFalt = {
  lage: "",
  interior: "",
  planlosning: "",
  ekonomi: "",
  taggar: "",
  beskrivning: "",
};

// Serverings gemensamma taggpool, uppdelad efter vilken textrad-kategori de hör till.
const SERVERING_UNDERRUBRIK = ["Restaurang", "Café", "Bageri", "Bistro", "Pub", "Vinbar"];
const SERVERING_TAGGAR_LAGE = [
  "Trafikerat läge",
  "Stadsmiljö",
  "Hörnlokal",
  "Bakgata",
  "Stenkast från mötesplats",
  "Kollektivtrafik",
  "Parkering",
  "Cykelvägar",
  "Grönområden",
  "Nära gym",
  "Nära restauranger",
  "Nära apotek",
  "Nära livsmedelsbutik",
  "Uteservering",
];
const SERVERING_TAGGAR_INTERIOR = [
  "Modernt",
  "Renoveringsbehov av servering",
  "Rustik",
  "Högt i tak",
  "Retro",
  "Pub-inredning",
  "Ny maskinpark",
  "Gammal maskinpark",
  "Funktionsduglig maskinpark",
  "Renoveringsbehov av kök",
];
const SERVERING_TAGGAR_PLANLOSNING = [
  "Ca 30 sittplatser",
  "Ca 40 sittplatser",
  "Ca 50 sittplatser",
  "Ca 30 uteplatser",
  "Stor uteservering",
  "Omklädningsrum",
  "Personaltoalett",
  "Gästtoalett",
  "Kylrum",
  "Diskrum",
  "Frysrum",
  "Bardel",
  "Lager",
  "Eget soprum",
  "Torrt förråd",
];
const SERVERING_TAGGAR_EKONOMI = [
  "Förmånlig hyra",
  "Värme ingår",
  "Vatten ingår",
  "Momsbefriad hyra",
  "Ventilation ingår",
  "Leasingavtal",
  "Företagslån",
  "Ölleverantör",
  "Kassaavtal",
];
const SERVERING_TAGGAR_TYP_AV_KOK = [
  "Svartplåtskanal",
  "Pizzakanal",
  "Varmluftsugn ok",
  "Cafélokal",
  "Bagerianpassad",
  "Annan ventilation",
];
const SERVERING_TAGGAR_UTVECKLINGSMOJLIGHET = [
  "Byte av koncept",
  "Ny meny",
  "Renovering",
  "Alkoholtillstånd",
  "Utbyte av personal",
  "Nytänk",
  "Sociala medier-annonsering",
];
const SERVERING_TAGGAR_ANLEDNING_FORSALJNING = [
  "Pension",
  "Andra intressen",
  "Går med förlust",
  "Personalproblem",
  "Uppbrytning av partnerskap",
];
const SERVERING_TAGGAR_MYNDIGHETSKRAV = ["Serveringstillstånd", "Uteservering", "Livsmedelsintyg", "Brandskyddsdokumentation"];

// PDF-uppladdningar specifika för Servering — namn + hjälptext, renderas i en lista.
const SERVERING_UPPLADDNINGAR: { namn: string; hint: string }[] = [
  { namn: "Ritning (Servering)", hint: "PDF · planlösning över lokalen" },
  { namn: "OVK (Servering)", hint: "PDF · obligatorisk ventilationskontroll" },
  { namn: "Serveringstillstånd (Servering)", hint: "PDF · tillstånd för alkoholservering" },
  { namn: "Uteserveringsritning (Servering)", hint: "PDF · ritning över uteserveringsyta" },
  { namn: "Miljöförvaltning (Servering)", hint: "PDF · dokument från miljöförvaltningen" },
  { namn: "Brandskyddsdokument (Servering)", hint: "PDF · brandskyddsdokumentation" },
  { namn: "Leasingavtal (Servering)", hint: "PDF · t.ex. kassa-, telefoni- och wifiavtal" },
  { namn: "Inventarielista (Servering)", hint: "PDF · fylls i via mall online" },
];

const emptyServeringFalt: ServeringFalt = {
  underrubrik: "",
  lage: "",
  interior: "",
  planlosning: "",
  ekonomi: "",
  koksutrustning: "",
  alkoholtillstand: "",
  utvecklingsmojlighet: "",
  anledningTillForsaljning: "",
  taggar: "",
  typAvKok: "",
  skickILokal: "",
  myndighetskrav: "",
  ovrigInfo: "",
};

// Skönhetssalongs gemensamma taggpool, uppdelad efter vilken textrad-kategori de hör till.
const FRISOR_UNDERRUBRIK = ["Frisör", "Nagelsalong", "Massage", "Estetisk"];
const FRISOR_TAGGAR_LAGE = [
  "Trafikerat läge",
  "Hörnlokal",
  "Bakgata",
  "Stenkast från mötesplats",
  "Kollektivtrafik",
  "Parkering",
  "Cykelvägar",
  "Grönområden",
  "Nära gym",
  "Nära restauranger",
  "Nära apotek",
  "Nära livsmedelsbutik",
  "Hiss",
];
const FRISOR_TAGGAR_INTERIOR = [
  "Modernt",
  "Renoveringsbehov",
  "Rustik",
  "Retro",
  "Hög takhöjd",
  "Konferensrum",
  "Tysta rum",
  "Samarbetsytor",
  "Mötesrum",
  "Lounge",
  "Lunchrum",
  "Reglerbart ljus",
  "Naturmaterial",
  "Miljömärkta material",
  "Hyllsystem",
  "Omklädningsrum",
  "Reception",
  "Ljust",
  "Rymligt",
];
const FRISOR_TAGGAR_PLANLOSNING = [
  "Lunchrum",
  "Wc/dusch",
  "Wc",
  "Förråd/lager",
  "Lastkaj",
  "Ritning",
  "Öppen planlösning",
  "Skrivbordsbås",
  "Många indelade rum",
  "Tysta rum",
  "Konferensrum",
  "Lounge",
  "Kundväntrum",
  "Stora fönster",
  "Mycket ljusinsläpp",
  "Typ av kök – pentry",
  "Fullt kök",
  "Inflyttningsklart",
  "Tillgänglighetsanpassad",
  "Co-working yta",
];
const FRISOR_TAGGAR_EKONOMI = ["Förmånlig hyra", "Värme ingår", "Vatten ingår", "Momsbefriad hyra", "Ventilation ingår", "Stabil förening"];

const emptyFrisorFalt: FrisorFalt = {
  underrubrik: "",
  lage: "",
  interior: "",
  planlosning: "",
  ekonomi: "",
  antalStolar: "",
  taggar: "",
  beskrivning: "",
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
  typFalt: {
    Kontor: emptyKontorFalt,
    Butik: emptyButikFalt,
    Lager: emptyLagerFalt,
    Servering: emptyServeringFalt,
    Frisor: emptyFrisorFalt,
  },
};

const STEPS = ["Typ av lokal", "Grunduppgifter", "Underlag", "Granska & skicka"] as const;

// Slår ihop sparad typFalt med standardvärden per typ (inte bara per nyckel), så ett utkast som sparades
// innan en typs fältgrupp fick nya/ändrade fält inte kraschar eller tappar bort de fält som fortfarande finns.
function mergeTypFalt(saved: Partial<Draft["typFalt"]> | undefined): Draft["typFalt"] {
  const merged = { ...empty.typFalt };
  for (const typ of Object.keys(merged) as Array<keyof Draft["typFalt"]>) {
    merged[typ] = { ...empty.typFalt[typ], ...(saved?.[typ] ?? {}) } as any;
  }
  return merged;
}

function CreateListing() {
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(empty);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [uppdragsavtalOpen, setUppdragsavtalOpen] = useState(false);

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
            setDraft({
              ...empty,
              ...item.draft,
              typFalt: mergeTypFalt(item.draft.typFalt),
            });
            setStep(4);
            return;
          }
        }
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { draft: Draft; step: number; savedAt: string };
        setDraft({
          ...empty,
          ...parsed.draft,
          typFalt: mergeTypFalt(parsed.draft.typFalt),
        });
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

  const setTypFalt = <T extends keyof Draft["typFalt"], K extends keyof Draft["typFalt"][T]>(
    typ: T,
    key: K,
    v: Draft["typFalt"][T][K],
  ) =>
    setDraft((d) => ({
      ...d,
      typFalt: { ...d.typFalt, [typ]: { ...d.typFalt[typ], [key]: v } },
    }));

  const requiredDocs = docsByCat[draft.cat];
  const docStatus = (name: string): DocState => draft.docs[name] ?? "saknas";

  const valdaTyper = draft.verksamhet ? draft.verksamhet.split(",").map((s) => s.trim()).filter(Boolean) : [];

  // Mappning typ → fältgrupp. Lägg till fler nycklar här när fler typers fältgrupper byggs.
  const TYP_FALTGRUPPER: Record<string, () => ReactNode> = {
    Kontor: () => (
      <KontorFaltgrupp
        falt={draft.typFalt.Kontor}
        onChange={(key, v) => setTypFalt("Kontor", key, v)}
        docStatus={docStatus}
        setDoc={setDoc}
      />
    ),
    Butik: () => (
      <ButikFaltgrupp
        falt={draft.typFalt.Butik}
        onChange={(key, v) => setTypFalt("Butik", key, v)}
        docStatus={docStatus}
        setDoc={setDoc}
      />
    ),
    Lager: () => (
      <LagerFaltgrupp
        falt={draft.typFalt.Lager}
        onChange={(key, v) => setTypFalt("Lager", key, v)}
        docStatus={docStatus}
        setDoc={setDoc}
      />
    ),
    Servering: () => (
      <ServeringFaltgrupp
        falt={draft.typFalt.Servering}
        onChange={(key, v) => setTypFalt("Servering", key, v)}
        docStatus={docStatus}
        setDoc={setDoc}
      />
    ),
    Frisor: () => (
      <FrisorFaltgrupp
        falt={draft.typFalt.Frisor}
        onChange={(key, v) => setTypFalt("Frisor", key, v)}
        docStatus={docStatus}
        setDoc={setDoc}
      />
    ),
  };

  const grupperAttVisa = Object.keys(FALTGRUPP_TYPER)
    .filter((grupp) => FALTGRUPP_TYPER[grupp].some((typ) => valdaTyper.includes(typ)) && TYP_FALTGRUPPER[grupp])
    .sort(
      (a, b) =>
        Math.min(...FALTGRUPP_TYPER[a].map((typ) => VERKSAMHETSTYP_TAGGAR.indexOf(typ))) -
        Math.min(...FALTGRUPP_TYPER[b].map((typ) => VERKSAMHETSTYP_TAGGAR.indexOf(typ))),
    );

  const validation = useMemo(() => {
    const errs: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [] };
    if (!draft.cat) errs[0].push("Välj paket.");
    if (!draft.yta) errs[1].push("Ange yta i m².");
    if (!draft.verksamhet) errs[1].push("Ange verksamhetstyp.");
    if (draft.cat === "aktie" && !/^\d{6}-?\d{4}$/.test(draft.orgnr))
      errs[1].push("Org.nr i format 556xxx-xxxx.");
    if (!draft.hyresvardEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.hyresvardEmail))
      errs[2].push("Ange hyresvärdens e-postadress.");
    if (!draft.hyresvardTel) errs[2].push("Ange hyresvärdens telefonnummer.");
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
    ].filter(Boolean).length;
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
    validation[1].length + validation[2].length + validation[3].length === 0;

  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow={editId ? "Säljarläge · Redigera annons" : "Säljarläge · Skapa annons"}
        title={STEPS[step]}
        subtitle={editId
          ? "Ändringarna skickas till TreLink för ny granskning innan annonsen publiceras igen."
          : "På denna plattform så hjälper vi dig att förmedla din lokal, ifrån att annonsera (hitta köpare), köpeavtal, presentation till hyresvärden till avslut och kvittenser. Här har du en plattform som agerar som din mäklare/fastighetskonsult och är med dig i hela processen till avslutat affär. Ingen debitering sker förrän affären är klar och då lyfts en förmedlingsprovision ut ur klientmedelskontot för sedan betala ut resten."}

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
          <button
            type="button"
            onClick={() => setUppdragsavtalOpen(true)}
            className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground underline decoration-dashed hover:text-foreground"
          >
            Se hur ett uppdragsavtal kan se ut →
          </button>
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

      <UppdragsavtalPreviewModal
        open={uppdragsavtalOpen}
        onClose={() => setUppdragsavtalOpen(false)}
        activeCat={activeCat}
        premium={draft.premium}
      />

      {/* STEP 1 — Grunduppgifter */}
      {step === 1 && (
        <>
          <KontoSammanfattning />

          <WireBox label="Objektet" className="mb-6">
            <p className="text-base font-semibold text-foreground">Vad är det vi förmedlar?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Med hjälp av er och oss kan vi tillsammans formulera en annonstext med hjälp av AI. Hjälp oss att
              komma igång och fyll i så utförligt som möjligt nedan. Om annonsen är tydlig och informativ har vi
              större chans att förmedla detta objekt. Klicka på objektstyp så kan vi sätta igång.
            </p>
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

            {grupperAttVisa.map((grupp) => (
              <div key={grupp} className="mt-6 border-t border-dashed border-muted-foreground/30 pt-4">
                {TYP_FALTGRUPPER[grupp]()}
              </div>
            ))}
          </WireBox>
        </>
      )}



      {/* STEP 2 — Underlag */}
      {step === 2 && (
        <>
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
        </>
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

function UppdragsavtalPreviewModal({
  open,
  onClose,
  activeCat,
  premium,
}: {
  open: boolean;
  onClose: () => void;
  activeCat: (typeof cats)[number];
  premium: boolean;
}) {
  const [bolagsnamn, setBolagsnamn] = useState("[Bolagsnamn]");

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(ONBOARDING_SALJARE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as OnboardingSaljareData;
        setBolagsnamn(data.bolagsuppgifter?.bolag || "[Bolagsnamn]");
      }
    } catch {
      /* noop */
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const avgift = premium ? `${activeCat.avgift} + 2 500 kr (premium-tillägg)` : activeCat.avgift;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-foreground bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-foreground/30 px-4 py-3">
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Förhandsvisning · Uppdragsavtal
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Stäng <X className="inline-block h-3.5 w-3.5 ml-0.5 align-middle" />
          </button>
        </div>

        <div className="border-l-2 border-amber-500/70 bg-amber-50/60 px-4 py-3 dark:bg-amber-500/5">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-500">
            Utkast — exempel, ej bindande
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <h2 className="text-xl font-semibold">Uppdragsavtal — TreLink</h2>
            <Annotation>Exempeldokument · faktiskt avtal upprättas digitalt av TreLink</Annotation>
          </div>

          <div className="border-t border-dashed border-muted-foreground/30 pt-4">
            <Annotation>Parter</Annotation>
            <p className="mt-1 text-sm">
              TreLink AB (nedan "TreLink") och {bolagsnamn} (nedan "Uppdragsgivaren"), avseende
              förmedling enligt paketet {activeCat.name}.
            </p>
          </div>

          <div className="border-t border-dashed border-muted-foreground/30 pt-4">
            <Annotation>Avgift</Annotation>
            <p className="mt-1 text-sm">{avgift}. Avgiften utgår endast vid genomförd affär.</p>
          </div>

          <div className="border-t border-dashed border-muted-foreground/30 pt-4">
            <Annotation>Villkor i korthet</Annotation>
            <ul className="mt-2 space-y-2 text-sm">
              <li>· TreLink skriver annonstexten och sätter priset — Uppdragsgivaren redigerar inte publicerat innehåll.</li>
              <li>· Köpare är anonyma under processen (K-koder). Ingen direktkontakt sker mellan köpare och säljare.</li>
              <li>· UC-kontroll på köparen genomförs först efter signerat köpeavtal och inbetald handpenning.</li>
              <li>· TreLink granskar inkommet underlag inom 24 timmar på vardagar.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerksamhetstypSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  function select(tag: string) {
    onChange(value === tag ? "" : tag);
  }

  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Verksamhetstyp *
      </span>
      <div className="flex flex-wrap gap-2 border border-dashed border-muted-foreground/50 bg-muted/20 p-3">
        {VERKSAMHETSTYP_TAGGAR.map((tag) => (
          <WireTag key={tag} active={value === tag} onClick={() => select(tag)}>
            {tag}
          </WireTag>
        ))}
      </div>
      <span className="mt-1 block font-mono text-[10px] text-muted-foreground/70">
        Välj den kategori som bäst beskriver verksamheten.
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

function FaltgruppRubrik({ children }: { children: ReactNode }) {
  return <h4 className="text-sm font-semibold text-foreground">{children}</h4>;
}

function YesNoToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex gap-2">
        <WireBtn variant={value === true ? "primary" : "secondary"} onClick={() => onChange(true)}>
          Ja
        </WireBtn>
        <WireBtn variant={value === false ? "primary" : "secondary"} onClick={() => onChange(false)}>
          Nej
        </WireBtn>
      </div>
    </div>
  );
}

function TagToggleGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

  function toggle(tag: string) {
    const next = selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag];
    onChange(next.join(", "));
  }

  return (
    <div>
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-2 border border-dashed border-muted-foreground/50 bg-muted/20 p-3">
        {options.map((tag) => (
          <WireTag key={tag} active={selected.includes(tag)} onClick={() => toggle(tag)}>
            {tag}
          </WireTag>
        ))}
      </div>
    </div>
  );
}

function SingleTagSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-2 border border-dashed border-muted-foreground/50 bg-muted/20 p-3">
        {options.map((tag) => (
          <WireTag key={tag} active={value === tag} onClick={() => onChange(value === tag ? "" : tag)}>
            {tag}
          </WireTag>
        ))}
      </div>
    </div>
  );
}

function KontorFaltgrupp({
  falt,
  onChange,
  docStatus,
  setDoc,
}: {
  falt: KontorFalt;
  onChange: <K extends keyof KontorFalt>(key: K, v: KontorFalt[K]) => void;
  docStatus: (name: string) => DocState;
  setDoc: (name: string, s: DocState) => void;
}) {
  const ritningNamn = "Ritning (Kontor)";
  const ritningStatus = docStatus(ritningNamn);

  return (
    <>
      <Annotation>Kontor — fält specifika för kontorslokaler.</Annotation>
      <div className="mt-4 space-y-5">
        <div>
          <FaltgruppRubrik>Läge</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={KONTOR_TAGGAR_LAGE}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Interiör/stil</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={KONTOR_TAGGAR_INTERIOR}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Planlösning</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={KONTOR_TAGGAR_PLANLOSNING}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Ekonomi</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={KONTOR_TAGGAR_EKONOMI}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Teknisk info</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={KONTOR_TAGGAR_TEKNISK_INFO}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <WireArea
            label="Övrig info"
            value={falt.beskrivning}
            onChange={(v) => onChange("beskrivning", v)}
            placeholder="T.ex. vilken våning, gatuparkering, garage, yta, antal arbetsplatser."
            maxLength={140}
          />
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <div className="flex flex-col gap-3 border border-dashed border-muted-foreground/40 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <DocStatusDot state={ritningStatus} />
              <div>
                <div className="text-sm font-medium">Ritning</div>
                <Annotation>PDF · planlösning över kontorsytan</Annotation>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DocStatusTag state={ritningStatus} />
              {ritningStatus === "saknas" || ritningStatus === "komplettera" ? (
                <WireBtn variant="secondary" onClick={() => setDoc(ritningNamn, "uppladdad")}>
                  Ladda upp
                </WireBtn>
              ) : (
                <WireBtn variant="ghost" onClick={() => setDoc(ritningNamn, "saknas")}>
                  Byt fil
                </WireBtn>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ButikFaltgrupp({
  falt,
  onChange,
  docStatus,
  setDoc,
}: {
  falt: ButikFalt;
  onChange: <K extends keyof ButikFalt>(key: K, v: ButikFalt[K]) => void;
  docStatus: (name: string) => DocState;
  setDoc: (name: string, s: DocState) => void;
}) {
  const ritningNamn = "Ritning (Butik)";
  const ritningStatus = docStatus(ritningNamn);

  return (
    <>
      <Annotation>Butik — fält specifika för butikslokaler.</Annotation>
      <div className="mt-4 space-y-5">
        <div>
          <FaltgruppRubrik>Läge</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={BUTIK_TAGGAR_LAGE}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Interiör/stil</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={BUTIK_TAGGAR_INTERIOR}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Planlösning</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={BUTIK_TAGGAR_PLANLOSNING}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Ekonomi</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={BUTIK_TAGGAR_EKONOMI}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Teknisk info</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={BUTIK_TAGGAR_TEKNISK_INFO}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <WireArea
            label="Övrig info"
            value={falt.beskrivning}
            onChange={(v) => onChange("beskrivning", v)}
            placeholder="T.ex. vilken våning, gatuparkering, garage, yta, antal arbetsplatser."
            maxLength={140}
          />
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <div className="flex flex-col gap-3 border border-dashed border-muted-foreground/40 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <DocStatusDot state={ritningStatus} />
              <div>
                <div className="text-sm font-medium">Ritning</div>
                <Annotation>PDF · planlösning över butiksytan</Annotation>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DocStatusTag state={ritningStatus} />
              {ritningStatus === "saknas" || ritningStatus === "komplettera" ? (
                <WireBtn variant="secondary" onClick={() => setDoc(ritningNamn, "uppladdad")}>
                  Ladda upp
                </WireBtn>
              ) : (
                <WireBtn variant="ghost" onClick={() => setDoc(ritningNamn, "saknas")}>
                  Byt fil
                </WireBtn>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LagerFaltgrupp({
  falt,
  onChange,
  docStatus,
  setDoc,
}: {
  falt: LagerFalt;
  onChange: <K extends keyof LagerFalt>(key: K, v: LagerFalt[K]) => void;
  docStatus: (name: string) => DocState;
  setDoc: (name: string, s: DocState) => void;
}) {
  const ritningNamn = "Ritning (Lager)";
  const ritningStatus = docStatus(ritningNamn);

  return (
    <>
      <Annotation>Lager — fält specifika för lager/industrilokaler.</Annotation>
      <div className="mt-4 space-y-5">
        <div>
          <FaltgruppRubrik>Läge</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={LAGER_TAGGAR_LAGE}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Interiör/stil</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={LAGER_TAGGAR_INTERIOR}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Planlösning</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={LAGER_TAGGAR_PLANLOSNING}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Ekonomi</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={LAGER_TAGGAR_EKONOMI}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Teknisk info</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={LAGER_TAGGAR_TEKNISK_INFO}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <WireArea
            label="Övrig info"
            value={falt.beskrivning}
            onChange={(v) => onChange("beskrivning", v)}
            placeholder="T.ex. vilken våning, gatuparkering, garage, yta, antal arbetsplatser."
            maxLength={140}
          />
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <div className="flex flex-col gap-3 border border-dashed border-muted-foreground/40 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <DocStatusDot state={ritningStatus} />
              <div>
                <div className="text-sm font-medium">Ritning</div>
                <Annotation>PDF · planlösning över lagerytan</Annotation>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DocStatusTag state={ritningStatus} />
              {ritningStatus === "saknas" || ritningStatus === "komplettera" ? (
                <WireBtn variant="secondary" onClick={() => setDoc(ritningNamn, "uppladdad")}>
                  Ladda upp
                </WireBtn>
              ) : (
                <WireBtn variant="ghost" onClick={() => setDoc(ritningNamn, "saknas")}>
                  Byt fil
                </WireBtn>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DocUploadRad({
  namn,
  hint,
  docStatus,
  setDoc,
}: {
  namn: string;
  hint: string;
  docStatus: (name: string) => DocState;
  setDoc: (name: string, s: DocState) => void;
}) {
  const status = docStatus(namn);
  return (
    <div className="flex flex-col gap-3 border border-dashed border-muted-foreground/40 p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <DocStatusDot state={status} />
        <div>
          <div className="text-sm font-medium">{namn}</div>
          <Annotation>{hint}</Annotation>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DocStatusTag state={status} />
        {status === "saknas" || status === "komplettera" ? (
          <WireBtn variant="secondary" onClick={() => setDoc(namn, "uppladdad")}>
            Ladda upp
          </WireBtn>
        ) : (
          <WireBtn variant="ghost" onClick={() => setDoc(namn, "saknas")}>
            Byt fil
          </WireBtn>
        )}
      </div>
    </div>
  );
}

function ServeringFaltgrupp({
  falt,
  onChange,
  docStatus,
  setDoc,
}: {
  falt: ServeringFalt;
  onChange: <K extends keyof ServeringFalt>(key: K, v: ServeringFalt[K]) => void;
  docStatus: (name: string) => DocState;
  setDoc: (name: string, s: DocState) => void;
}) {
  return (
    <>
      <Annotation>Mat och dryck — fält specifika för restaurang, café, bageri och pub.</Annotation>
      <div className="mt-4 space-y-5">
        <div>
          <FaltgruppRubrik>Typ av verksamhet</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <SingleTagSelect
              label="Välj den som stämmer bäst"
              options={SERVERING_UNDERRUBRIK}
              value={falt.underrubrik}
              onChange={(v) => onChange("underrubrik", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Läge</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={SERVERING_TAGGAR_LAGE}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Interiör och skick</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={SERVERING_TAGGAR_INTERIOR}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Planlösning</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={SERVERING_TAGGAR_PLANLOSNING}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Ekonomi</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={SERVERING_TAGGAR_EKONOMI}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Köksteknik</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={SERVERING_TAGGAR_TYP_AV_KOK}
              value={falt.typAvKok}
              onChange={(v) => onChange("typAvKok", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Utvecklingsmöjlighet</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={SERVERING_TAGGAR_UTVECKLINGSMOJLIGHET}
              value={falt.utvecklingsmojlighet}
              onChange={(v) => onChange("utvecklingsmojlighet", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Anledning till försäljning</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={SERVERING_TAGGAR_ANLEDNING_FORSALJNING}
              value={falt.anledningTillForsaljning}
              onChange={(v) => onChange("anledningTillForsaljning", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Myndighetskrav</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={SERVERING_TAGGAR_MYNDIGHETSKRAV}
              value={falt.myndighetskrav}
              onChange={(v) => onChange("myndighetskrav", v)}
            />
            <DocUploadRad
              namn="Myndighetsdokument (Servering)"
              hint="JPG/PDF · bifoga tillstånd/protokoll som styrker taggarna ovan"
              docStatus={docStatus}
              setDoc={setDoc}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <WireArea
            label="Övrig info"
            value={falt.ovrigInfo}
            onChange={(v) => onChange("ovrigInfo", v)}
            placeholder="Berätta mer om din restaurang och vad du tycker är viktigt att veta som köpare."
            maxLength={140}
          />
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Dokument</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            {SERVERING_UPPLADDNINGAR.map((doc) => (
              <DocUploadRad key={doc.namn} namn={doc.namn} hint={doc.hint} docStatus={docStatus} setDoc={setDoc} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function FrisorFaltgrupp({
  falt,
  onChange,
  docStatus,
  setDoc,
}: {
  falt: FrisorFalt;
  onChange: <K extends keyof FrisorFalt>(key: K, v: FrisorFalt[K]) => void;
  docStatus: (name: string) => DocState;
  setDoc: (name: string, s: DocState) => void;
}) {
  const ritningNamn = "Ritning (Skönhetssalong)";
  const ritningStatus = docStatus(ritningNamn);

  return (
    <>
      <Annotation>Skönhetssalong — fält specifika för skönhetssalonger.</Annotation>
      <div className="mt-4 space-y-5">
        <div>
          <FaltgruppRubrik>Typ av verksamhet</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <SingleTagSelect
              label="Välj den som stämmer bäst"
              options={FRISOR_UNDERRUBRIK}
              value={falt.underrubrik}
              onChange={(v) => onChange("underrubrik", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Läge</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={FRISOR_TAGGAR_LAGE}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Interiör/stil</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={FRISOR_TAGGAR_INTERIOR}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Planlösning</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={FRISOR_TAGGAR_PLANLOSNING}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <FaltgruppRubrik>Ekonomi</FaltgruppRubrik>
          <div className="mt-2 space-y-3">
            <TagToggleGroup
              label="Taggar"
              options={FRISOR_TAGGAR_EKONOMI}
              value={falt.taggar}
              onChange={(v) => onChange("taggar", v)}
            />
          </div>
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <WireArea
            label="Övrig info"
            value={falt.beskrivning}
            onChange={(v) => onChange("beskrivning", v)}
            placeholder="T.ex. antal stolar/arbetsplatser, om man kan hyra ut en stol/rum."
            maxLength={140}
          />
        </div>

        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <div className="flex flex-col gap-3 border border-dashed border-muted-foreground/40 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <DocStatusDot state={ritningStatus} />
              <div>
                <div className="text-sm font-medium">Ritning</div>
                <Annotation>PDF · planlösning över salongsytan</Annotation>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DocStatusTag state={ritningStatus} />
              {ritningStatus === "saknas" || ritningStatus === "komplettera" ? (
                <WireBtn variant="secondary" onClick={() => setDoc(ritningNamn, "uppladdad")}>
                  Ladda upp
                </WireBtn>
              ) : (
                <WireBtn variant="ghost" onClick={() => setDoc(ritningNamn, "saknas")}>
                  Byt fil
                </WireBtn>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
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
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={maxLength}
        className="block w-full border border-dashed border-muted-foreground/50 bg-muted/20 p-3 text-sm focus:border-foreground focus:outline-none"
      />
      {maxLength ? (
        <span className="mt-1 block font-mono text-[10px] text-muted-foreground/70">
          {value.length}/{maxLength} tecken
        </span>
      ) : (
        hint && <span className="mt-1 block font-mono text-[10px] text-muted-foreground/70">{hint}</span>
      )}
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
