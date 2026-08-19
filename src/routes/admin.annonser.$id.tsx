import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { getAnnons, patchAnnons, logEntry, stateLabel, STORAGE_KEY, type WorkflowState } from "@/lib/annons-workflow";
import { readAdminAccounts } from "@/lib/mock-auth";
import { MailPreview, VisaMailLank, type MailData } from "@/components/MailPreview";
import { UppdragsavtalDokument } from "@/components/UppdragsavtalDokument";
import { GRUPP_MAT_TYPER, GRUPP_SKONHET_TYPER } from "@/lib/nyckeltal";
import {
  cats,
  docsByCat,
  FALTGRUPP_TYPER,
  type CatId,
  type DocSpec,
  type DocState,
  type KontorFalt,
  type ButikFalt,
  type LagerFalt,
  type ServeringFalt,
  type FrisorFalt,
} from "@/lib/annons-model";

export const Route = createFileRoute("/admin/annonser/$id")({
  component: AdminAnnonsDetail,
});

const ONBOARDING_SALJARE_KEY = "trelink-onboarding-saljare-uppgifter";

type OnboardingSaljareData = {
  bolagsuppgifter: { bolag: string; orgnr: string; ort: string; adress: string; presentation?: string };
  saljaruppgifter: { fornamn: string; efternamn: string; mobil: string; epost: string };
  firmatecknare: { roll: string; fornamn: string; efternamn: string; mail: string; mobil: string } | null;
};

function readOnboardingSaljare(userId?: string): OnboardingSaljareData | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${ONBOARDING_SALJARE_KEY}:${userId}`);
    return raw ? (JSON.parse(raw) as OnboardingSaljareData) : null;
  } catch {
    return null;
  }
}

const GRUPP_NAMN: Record<string, string> = {
  Kontor: "Kontor",
  Butik: "Butik",
  Lager: "Lager",
  Servering: "Mat och dryck",
  Frisor: "Skönhetssalong",
};

type GruppFalt = { key: string; label: string; isTags?: boolean };

// Måste spegla de fält säljaren faktiskt fyller i per verksamhetstyp
// (KontorFalt/ButikFalt/LagerFalt/ServeringFalt/FrisorFalt i annons-model.ts
// och motsvarande *Faltgrupp-komponenter i saljare.skapa-annons.tsx).
// Om ett fält läggs till i någon av de typerna, måste det läggas till här
// också — annars visas det aldrig för TreLink.
const GRUPP_FALT: Record<string, GruppFalt[]> = {
  Kontor: [
    { key: "lage", label: "Läge", isTags: true },
    { key: "interior", label: "Interiör/stil", isTags: true },
    { key: "planlosning", label: "Planlösning", isTags: true },
    { key: "ekonomi", label: "Ekonomi", isTags: true },
    { key: "taggar", label: "Teknisk info", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Butik: [
    { key: "lage", label: "Läge", isTags: true },
    { key: "interior", label: "Interiör/stil", isTags: true },
    { key: "planlosning", label: "Planlösning", isTags: true },
    { key: "ekonomi", label: "Ekonomi", isTags: true },
    { key: "taggar", label: "Teknisk info", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Lager: [
    { key: "lage", label: "Läge", isTags: true },
    { key: "interior", label: "Interiör/stil", isTags: true },
    { key: "planlosning", label: "Planlösning", isTags: true },
    { key: "ekonomi", label: "Ekonomi", isTags: true },
    { key: "taggar", label: "Teknisk info", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Frisor: [
    { key: "underrubrik", label: "Typ av verksamhet" },
    { key: "lage", label: "Läge", isTags: true },
    { key: "interior", label: "Interiör/stil", isTags: true },
    { key: "planlosning", label: "Planlösning", isTags: true },
    { key: "ekonomi", label: "Ekonomi", isTags: true },
    { key: "antalStolar", label: "Antal stolar" },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Servering: [
    { key: "underrubrik", label: "Typ av verksamhet" },
    { key: "lage", label: "Läge", isTags: true },
    { key: "interior", label: "Interiör och skick", isTags: true },
    { key: "planlosning", label: "Planlösning", isTags: true },
    { key: "ekonomi", label: "Ekonomi", isTags: true },
    { key: "typAvKok", label: "Köksteknik", isTags: true },
    { key: "utvecklingsmojlighet", label: "Utvecklingsmöjlighet", isTags: true },
    { key: "anledningTillForsaljning", label: "Anledning till försäljning", isTags: true },
    { key: "myndighetskrav", label: "Myndighetskrav", isTags: true },
    { key: "ovrigInfo", label: "Övrig info" },
  ],
};

// Kompileringstidsskydd: om ett fält läggs till i någon *Falt-typ i
// annons-model.ts men glöms bort här, misslyckas `satisfies`-kontrollen nedan.
const FALT_TYPE_KEYS: Record<string, string[]> = {
  Kontor: Object.keys(
    { lage: "", interior: "", planlosning: "", ekonomi: "", taggar: "", beskrivning: "" } satisfies KontorFalt,
  ),
  Butik: Object.keys(
    { lage: "", interior: "", planlosning: "", ekonomi: "", taggar: "", beskrivning: "" } satisfies ButikFalt,
  ),
  Lager: Object.keys(
    { lage: "", interior: "", planlosning: "", ekonomi: "", taggar: "", beskrivning: "" } satisfies LagerFalt,
  ),
  Frisor: Object.keys(
    {
      underrubrik: "",
      lage: "",
      interior: "",
      planlosning: "",
      ekonomi: "",
      antalStolar: "",
      taggar: "",
      beskrivning: "",
    } satisfies FrisorFalt,
  ),
  Servering: Object.keys(
    {
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
    } satisfies ServeringFalt,
  ),
};

if (import.meta.env.DEV) {
  for (const [grupp, keys] of Object.entries(FALT_TYPE_KEYS)) {
    const mapped = new Set((GRUPP_FALT[grupp] ?? []).map((f) => f.key));
    const missing = keys.filter((k) => !mapped.has(k));
    if (missing.length > 0) {
      console.warn(
        `[admin.annonser.$id] GRUPP_FALT.${grupp} saknar fält som finns i annons-model.ts men aldrig visas för TreLink: ${missing.join(", ")}`,
      );
    }
  }
}

// Ritning-dokument som säljaren laddar upp per Verksamhetstyp, sparade fristående
// i draft.docs (utanför docsByCat) — se t.ex. KontorFaltgrupp/ServeringFaltgrupp i
// saljare.skapa-annons.tsx. Måste hållas i synk med FALTGRUPP_TYPER — annars
// visas dokumentet aldrig för TreLink.
const RITNING_DOC_BY_GRUPP: Record<string, { name: string; krav: string }> = {
  Kontor: { name: "Ritning (Kontor)", krav: "PDF · planlösning över kontorsytan" },
  Butik: { name: "Ritning (Butik)", krav: "PDF · planlösning över butiksytan" },
  Lager: { name: "Ritning (Lager)", krav: "PDF · planlösning över lagerytan" },
  Servering: { name: "Ritning (Servering)", krav: "PDF · planlösning över lokalen" },
  Frisor: { name: "Ritning (Skönhetssalong)", krav: "PDF · planlösning över salongsytan" },
};

if (import.meta.env.DEV) {
  const missingRitning = Object.keys(FALTGRUPP_TYPER).filter((g) => !RITNING_DOC_BY_GRUPP[g]);
  if (missingRitning.length > 0) {
    console.warn(
      `[admin.annonser.$id] RITNING_DOC_BY_GRUPP saknar Ritning-dokument för: ${missingRitning.join(", ")} — dokumentet visas aldrig för TreLink.`,
    );
  }
}

function groupForTyp(typ: string): string | undefined {
  return Object.keys(FALTGRUPP_TYPER).find((g) => FALTGRUPP_TYPER[g].includes(typ));
}

function EditedMark() {
  return (
    <span
      title="Redigerat av TreLink"
      className="font-mono text-[9px] uppercase tracking-wider text-foreground"
    >
      · TreLink
    </span>
  );
}

function Field({
  k,
  v,
  edited,
  onSave,
}: {
  k: string;
  v?: string;
  edited?: boolean;
  onSave?: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftVal, setDraftVal] = useState(v ?? "");
  const missing = !v;

  useEffect(() => {
    if (!editing) setDraftVal(v ?? "");
  }, [v, editing]);

  if (!onSave) {
    return (
      <div className="border-b border-dashed border-muted-foreground/30 pb-2">
        <Annotation>{k}</Annotation>
        <div className={`mt-1 text-sm tabular-nums ${missing ? "text-amber-700 dark:text-amber-500" : ""}`}>
          {missing ? "⚠️ Ej ifyllt" : v}
        </div>
      </div>
    );
  }

  const commit = () => {
    setEditing(false);
    const next = draftVal.trim();
    if (next !== (v ?? "")) onSave(next);
  };

  return (
    <div className={`border-b pb-2 ${edited ? "border-foreground" : "border-dashed border-muted-foreground/30"}`}>
      <div className="flex items-center gap-1.5">
        <Annotation>{k}</Annotation>
        {edited && <EditedMark />}
      </div>
      {editing ? (
        <input
          autoFocus
          type="text"
          value={draftVal}
          onChange={(e) => setDraftVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraftVal(v ?? "");
              setEditing(false);
            }
          }}
          className="mt-1 h-8 w-full border border-foreground/50 bg-background px-2 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 flex w-full items-center justify-between gap-2 text-left text-sm hover:text-foreground"
        >
          <span className={missing ? "text-amber-700 dark:text-amber-500" : ""}>
            {missing ? "⚠️ Ej ifyllt" : v}
          </span>
          <Pencil className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

function TagsField({
  k,
  v,
  edited,
  onSave,
}: {
  k: string;
  v?: string;
  edited?: boolean;
  onSave: (value: string) => void;
}) {
  const tags = v ? v.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const [custom, setCustom] = useState("");

  const removeTag = (tag: string) => onSave(tags.filter((t) => t !== tag).join(", "));
  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || tags.includes(tag)) return;
    onSave([...tags, tag].join(", "));
  };
  const submitCustom = () => {
    if (!custom.trim()) return;
    addTag(custom);
    setCustom("");
  };

  return (
    <div className={`border-b pb-2 ${edited ? "border-foreground" : "border-dashed border-muted-foreground/30"}`}>
      <div className="flex items-center gap-1.5">
        <Annotation>{k}</Annotation>
        {edited && <EditedMark />}
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {tags.length > 0 ? (
          tags.map((t) => (
            <WireTag key={t} active onClick={() => removeTag(t)}>
              {t} <span aria-hidden className="ml-1">×</span>
            </WireTag>
          ))
        ) : (
          <span className="text-sm text-amber-700 dark:text-amber-500">⚠️ Ej ifyllt</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
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
          placeholder="Egen tagg…"
          className="h-7 flex-1 border border-foreground/15 bg-background px-2 text-xs focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
        />
        <button
          type="button"
          onClick={submitCustom}
          aria-label="Lägg till egen tagg"
          className="flex h-7 w-7 shrink-0 items-center justify-center border border-dashed border-muted-foreground/50 font-mono text-xs hover:border-foreground"
        >
          +
        </button>
      </div>
    </div>
  );
}

const kompletteringsMallar = [
  "Hyresavtalet saknar undertecknad sista sida — ladda upp på nytt med signatursida.",
  "Resultaträkningen är för 2023, vi behöver 2024 års siffror.",
  "Inventarielistan saknar uppskattat värde per post.",
  "Bilderna är för låg upplösning — minst 1600px bredd.",
];

const PROCESS_STEPS: { label: string; states: WorkflowState[] }[] = [
  { label: "Granskning", states: ["granskas", "komplettering"] },
  { label: "Uppdragsavtal", states: ["avtal-vantar-signering"] },
  { label: "Annonstext", states: ["hyresvard-notifiering"] },
  { label: "Publicerad", states: ["publicerad"] },
];

function stepIndexForState(state: WorkflowState | null): number {
  if (!state) return 0;
  const idx = PROCESS_STEPS.findIndex((s) => s.states.includes(state));
  return idx === -1 ? 0 : idx;
}

function StepDot({ status }: { status: "done" | "active" | "pending" }) {
  if (status === "done") {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
        ✓
      </span>
    );
  }
  if (status === "active") {
    return <span className="inline-block h-3 w-3 rounded-full bg-foreground/70 ring-2 ring-foreground/30" />;
  }
  return <span className="inline-block h-3 w-3 rounded-full border border-foreground/40 bg-background" />;
}

function ProcessStepper({ state }: { state: WorkflowState | null }) {
  if (state === "avvisad") {
    return null;
  }
  const currentStep = stepIndexForState(state);
  return (
    <WireBox className="mb-6" variant="dashed">
      <div className="flex flex-wrap items-center gap-3">
        {PROCESS_STEPS.map((s, i) => {
          const status: "done" | "active" | "pending" = i < currentStep ? "done" : i === currentStep ? "active" : "pending";
          return (
            <div key={s.label} className="flex items-center gap-2">
              <StepDot status={status} />
              <span
                className={`text-xs ${
                  status === "active" ? "font-semibold text-foreground" : status === "done" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < PROCESS_STEPS.length - 1 && <span className="text-muted-foreground/40">›</span>}
            </div>
          );
        })}
      </div>
    </WireBox>
  );
}

function RejectedBanner({ item }: { item: any }) {
  return (
    <div className="mb-6 border border-foreground/60 bg-foreground/5 px-4 py-3">
      <div className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
        ✕ Avvisad — ärendet är stängt
      </div>
      {item.workflow?.avvisadReason && (
        <p className="mt-1 text-sm text-muted-foreground">
          {item.workflow.avvisadReason.orsak}
          {item.workflow.avvisadReason.note ? ` — ${item.workflow.avvisadReason.note}` : ""}
        </p>
      )}
    </div>
  );
}

const avvisningsOrsaker = [
  "Annonsen strider mot våra publiceringsregler",
  "Dubblettannons — finns redan publicerad",
  "Säljaren saknar rätt att överlåta verksamheten",
  "Bristfälligt underlag trots komplettering",
];

// Samma platshållarbox som i Fastighetsinfo & prissättning (Granskning-steget).
// Karta utan API-nyckel via Google Maps' publika embed-URL.
function KartaPlaceholder({ adress }: { adress?: string }) {
  if (!adress) {
    return (
      <div className="flex h-24 flex-col items-center justify-center gap-1 border border-dashed border-muted-foreground/40 bg-muted/30 text-center text-xs text-muted-foreground">
        <span>[ Karta ]</span>
        <span>Ingen adress angiven</span>
      </div>
    );
  }
  return (
    <div className="h-24 overflow-hidden border border-dashed border-muted-foreground/40">
      <iframe
        title="Karta"
        src={`https://www.google.com/maps?q=${encodeURIComponent(adress)}&output=embed`}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

// Bildgalleri av de platshållarbilder säljaren laddat upp i Underlag-steget (se
// BildGalleri i saljare.skapa-annons.tsx) — TreLink väljer ut och ordnar vilka
// som ska visas i annonsen. Val + ordning sparas i draft.valdaBilderOrdning.
function BilderOversikt({
  bilder,
  valda,
  onChange,
}: {
  bilder?: string[];
  valda: string[];
  onChange: (next: string[]) => void;
}) {
  const uppladdade = bilder ?? [];
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  if (uppladdade.length === 0) {
    return <div className="text-sm text-amber-700 dark:text-amber-500">⚠️ Inga bilder uppladdade ännu.</div>;
  }

  const maxNadd = valda.length >= 8;

  function toggle(bild: string) {
    if (valda.includes(bild)) {
      onChange(valda.filter((b) => b !== bild));
    } else if (!maxNadd) {
      onChange([...valda, bild]);
    }
  }

  function moveTo(from: number, to: number) {
    if (from === to) return;
    const next = [...valda];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <Annotation>Klicka för att välja bilder till annonsen</Annotation>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {valda.length} av 8 valda
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {uppladdade.map((bild) => {
          const ordning = valda.indexOf(bild);
          const isVald = ordning !== -1;
          const disabled = !isVald && maxNadd;
          return (
            <button
              key={bild}
              type="button"
              onClick={() => toggle(bild)}
              disabled={disabled}
              className={`relative flex h-16 items-center justify-center border text-[10px] ${
                isVald
                  ? "border-foreground bg-foreground/10 text-foreground"
                  : disabled
                  ? "cursor-not-allowed border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground/50"
                  : "border-dashed border-muted-foreground/40 bg-muted/30 text-muted-foreground hover:border-foreground"
              }`}
            >
              {isVald && (
                <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center border border-foreground bg-foreground font-mono text-[9px] text-background">
                  {ordning + 1}
                </span>
              )}
              {bild}
            </button>
          );
        })}
      </div>

      {valda.length > 0 && (
        <div className="mt-3">
          <Annotation>Ordning i annonsen · dra för att ändra</Annotation>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {valda.map((bild, i) => (
              <div
                key={bild}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) moveTo(dragIndex, i);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className="flex cursor-move items-center gap-1 border border-foreground/40 bg-background px-2 py-1 text-[10px]"
              >
                <span className="font-mono text-muted-foreground">{i + 1}</span>
                {bild}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function AdminAnnonsDetail() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<any | null>(null);
  const [tick, setTick] = useState(0);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [docKomplText, setDocKomplText] = useState("");
  const [komplOpen, setKomplOpen] = useState(false);
  const [komplText, setKomplText] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [prisInput, setPrisInput] = useState("");
  const [mailPreview, setMailPreview] = useState<MailData | null>(null);
  const [avtalPreviewOpen, setAvtalPreviewOpen] = useState(false);
  const [utkastRubrik, setUtkastRubrik] = useState("");
  const [utkastBeskrivning, setUtkastBeskrivning] = useState("");
  const [utkastPris, setUtkastPris] = useState("");
  const [valdaBilder, setValdaBilder] = useState<string[]>([]);

  useEffect(() => {
    setItem(getAnnons(id) ?? null);
  }, [id, tick]);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== null && e.key !== STORAGE_KEY) return;
      setItem(getAnnons(id) ?? null);
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [id]);

  useEffect(() => {
    if (!item) return;
    setUtkastRubrik((prev) => prev || item.workflow?.utkast?.rubrik || "");
    setUtkastBeskrivning((prev) => prev || item.workflow?.utkast?.beskrivning || "");
    setUtkastPris((prev) => prev || item.workflow?.utkast?.pris || item.pris || "");
    setValdaBilder(item.draft?.valdaBilderOrdning ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const refresh = () => setTick((t) => t + 1);

  const draft = item?.draft ?? {};
  const onboarding = readOnboardingSaljare(item?.agarUserId);
  const sellerAccount = item?.sellerPersonnr
    ? readAdminAccounts().find((a) => a.bankid.personnr === item.sellerPersonnr)
    : undefined;
  const catId: CatId | undefined = draft.cat;
  const valdaGrupper = Array.from(
    new Set(
      (draft.verksamhet ? String(draft.verksamhet).split(",") : [])
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((typ: string) => groupForTyp(typ))
        .filter(Boolean) as string[],
    ),
  );
  const verksamhetTyper = (draft.verksamhet ? String(draft.verksamhet).split(",") : [])
    .map((s: string) => s.trim())
    .filter(Boolean);
  const visaOmsattning =
    (catId === "aktie" || catId === "inkram") &&
    verksamhetTyper.some((t: string) => GRUPP_MAT_TYPER.includes(t) || GRUPP_SKONHET_TYPER.includes(t));
  const ritningSpecs: DocSpec[] = valdaGrupper
    .map((g) => RITNING_DOC_BY_GRUPP[g])
    .filter(Boolean)
    .map((r) => ({ name: r.name, krav: r.krav, required: false }));
  const specs: DocSpec[] = [...(catId ? docsByCat[catId] ?? [] : []), ...ritningSpecs];
  const docsState: Record<string, DocState> = draft.docs ?? {};

  const ytaNum = Number(draft.yta);
  const hyraNum = Number(draft.hyra);
  const fastighetsskattNum = Number(draft.fastighetsskatt) || 0;
  const kvmPris = ytaNum > 0 && hyraNum > 0 ? Math.round((hyraNum * 12 + fastighetsskattNum) / ytaNum) : null;

  const stats = useMemo(() => {
    const obligatoriska = specs.filter((s) => s.required);
    const stateOf = (name: string): DocState => docsState[name] ?? "saknas";
    return {
      total: specs.length,
      kompl: specs.filter((s) => stateOf(s.name) === "komplettera").length,
      obligatoriskaOk: obligatoriska.filter((s) => stateOf(s.name) === "godkant").length,
      obligatoriskaTotal: obligatoriska.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const st: WorkflowState | null = item?.workflow?.state ?? null;
  // TreLink skriver/reviderar annonstexten — underlaget begränsas till det som
  // faktiskt behövs för att skriva text, resten hörde till Granskning-beslutet.
  const skrivFasen = st === "hyresvard-notifiering";
  const canApprove =
    st === "granskas" && stats.obligatoriskaTotal > 0 && stats.obligatoriskaOk === stats.obligatoriskaTotal && stats.kompl === 0;
  const prisValid = prisInput.trim() !== "" && Number(prisInput) > 0;
  const canApproveMedPris = canApprove && prisValid;

  const bolagOk = !!(
    onboarding?.bolagsuppgifter.bolag &&
    onboarding?.bolagsuppgifter.orgnr &&
    onboarding?.bolagsuppgifter.ort &&
    onboarding?.bolagsuppgifter.adress
  );
  const kontaktOk = !!(onboarding?.saljaruppgifter.mobil && onboarding?.saljaruppgifter.epost);
  const firmatecknareOk =
    !!onboarding &&
    (onboarding.firmatecknare === null ||
      !!(
        onboarding.firmatecknare.roll &&
        onboarding.firmatecknare.fornamn &&
        onboarding.firmatecknare.efternamn &&
        onboarding.firmatecknare.mail &&
        onboarding.firmatecknare.mobil
      ));
  const grundOk = !!(draft.adress && draft.verksamhet);
  const ytaOk = !!(item?.workflow?.utkast?.yta);
  const typFaltOk =
    valdaGrupper.length > 0 &&
    valdaGrupper.every((g) =>
      GRUPP_FALT[g]
        .filter((f) => f.isTags)
        .every((f) => !!draft.typFalt?.[g]?.[f.key]),
    );
  const hyresvardOk = !!(draft.hyresvardNamn && draft.hyresvardEmail && draft.hyresvardTel);
  const paketOk = !!(item?.cat || draft.cat);
  const docsMissing = stats.obligatoriskaTotal - stats.obligatoriskaOk;

  const checklist = [
    { label: "Bolagsuppgifter", ok: bolagOk },
    { label: "Kontaktperson", ok: kontaktOk },
    { label: "Firmatecknare", ok: firmatecknareOk },
    { label: "Grunduppgifter", ok: grundOk },
    { label: "Verksamhetstyp", ok: typFaltOk },
    { label: "Yta", ok: ytaOk },
    { label: docsMissing > 0 ? `${docsMissing} dokument saknas` : "Dokument", ok: docsMissing === 0 },
    { label: "Hyresvärd", ok: hyresvardOk },
    { label: "Paket", ok: paketOk },
  ];

  if (!item) {
    return (
      <AdminLayout>
        <Link to="/admin/annonser" className="mb-4 inline-block text-xs text-muted-foreground underline hover:text-foreground">
          ← Tillbaka till Granskning
        </Link>
        <PageHeader eyebrow="TreLink Admin" title="Annonsen kunde inte hittas" />
      </AdminLayout>
    );
  }

  const setDraftField = (key: string, value: string) => {
    patchAnnons(id, (it) => ({ ...it, draft: { ...it.draft, [key]: value } }));
    refresh();
  };

  // Sparar ett fält TreLink korrigerat och markerar det i trelinkEdits — skiljer
  // TreLinks rättningar från säljarens ursprungliga underlag (se EditedMark).
  const saveDraftField = (key: string, editKey?: string) => (value: string) => {
    patchAnnons(id, (it) => ({
      ...it,
      draft: { ...it.draft, [key]: value },
      trelinkEdits: { ...it.trelinkEdits, [editKey ?? `draft.${key}`]: true },
    }));
    refresh();
  };

  const saveTypFaltField = (grupp: string, key: string) => (value: string) => {
    patchAnnons(id, (it) => ({
      ...it,
      draft: {
        ...it.draft,
        typFalt: { ...it.draft?.typFalt, [grupp]: { ...it.draft?.typFalt?.[grupp], [key]: value } },
      },
      trelinkEdits: { ...it.trelinkEdits, [`typFalt.${grupp}.${key}`]: true },
    }));
    refresh();
  };

  const verksamhetstypfaltBlock =
    valdaGrupper.length === 0 ? (
      <WireBox label="Verksamhetstypfält" variant="dashed">
        <div className="text-sm text-amber-700 dark:text-amber-500">⚠️ Ingen verksamhetstyp vald ännu — fält kan inte visas.</div>
      </WireBox>
    ) : (
      valdaGrupper.map((grupp) => (
        <WireBox key={grupp} label={`Verksamhetstypfält · ${GRUPP_NAMN[grupp]}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {GRUPP_FALT[grupp].map((f) => {
              const value = draft.typFalt?.[grupp]?.[f.key];
              const editKey = `typFalt.${grupp}.${f.key}`;
              return f.isTags ? (
                <TagsField
                  key={f.key}
                  k={f.label}
                  v={value}
                  edited={!!item.trelinkEdits?.[editKey]}
                  onSave={saveTypFaltField(grupp, f.key)}
                />
              ) : (
                <Field
                  key={f.key}
                  k={f.label}
                  v={value}
                  edited={!!item.trelinkEdits?.[editKey]}
                  onSave={saveTypFaltField(grupp, f.key)}
                />
              );
            })}
          </div>
        </WireBox>
      ))
    );

  const saveOnboardingField =
    (editKey: string, apply: (data: OnboardingSaljareData, value: string) => OnboardingSaljareData) =>
    (value: string) => {
      const userId = item?.agarUserId;
      const current = readOnboardingSaljare(userId);
      if (!current || !userId) return;
      localStorage.setItem(`${ONBOARDING_SALJARE_KEY}:${userId}`, JSON.stringify(apply(current, value)));
      patchAnnons(id, (it) => ({ ...it, trelinkEdits: { ...it.trelinkEdits, [editKey]: true } }));
      refresh();
    };

  const splitName = (full: string) => {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    return { fornamn: parts[0] ?? "", efternamn: parts.slice(1).join(" ") };
  };

  const savePaket = (value: string) => {
    const match = cats.find((c) => c.name.toLowerCase() === value.trim().toLowerCase());
    if (!match) return;
    patchAnnons(id, (it) => ({
      ...it,
      cat: match.id,
      draft: { ...it.draft, cat: match.id },
      trelinkEdits: { ...it.trelinkEdits, "draft.cat": true },
    }));
    refresh();
  };

  const approveDoc = (docName: string) => {
    patchAnnons(id, (it) => ({
      ...it,
      draft: { ...it.draft, docs: { ...it.draft?.docs, [docName]: "godkant" } },
      workflow: logEntry(it.workflow, "TreLink", `Godkände dokument: ${docName}`),
    }));
    refresh();
  };

  const markDocNotApplicable = (docName: string) => {
    patchAnnons(id, (it) => ({
      ...it,
      draft: { ...it.draft, docs: { ...it.draft?.docs, [docName]: "ej-aktuell" } },
      workflow: logEntry(it.workflow, "TreLink", `Markerade dokument som ej aktuellt: ${docName}`),
    }));
    refresh();
  };

  const requestDocKomplettering = (docName: string) => {
    if (!docKomplText.trim()) return;
    patchAnnons(id, (it) => ({
      ...it,
      draft: { ...it.draft, docs: { ...it.draft?.docs, [docName]: "komplettera" } },
      workflow: logEntry(
        it.workflow,
        "TreLink",
        `Begärde komplettering på ${docName}: "${docKomplText.slice(0, 60)}${docKomplText.length > 60 ? "…" : ""}"`,
      ),
    }));
    setDocKomplText("");
    setActiveDoc(null);
    refresh();
  };

  const approveAnnons = () => {
    if (!canApproveMedPris) return;
    const prisFormaterat = Number(prisInput).toLocaleString("sv-SE");
    patchAnnons(id, (it) => {
      const now = new Date().toISOString();
      return {
        ...it,
        pris: prisFormaterat,
        workflow: logEntry(
          logEntry(
            { ...it.workflow, state: "avtal-vantar-signering", avtalSentAt: now },
            "TreLink",
            `Godkände annonsen · Pris satt till ${prisFormaterat} kr`,
          ),
          "System",
          "Uppdragsavtal skickat till säljaren via e-post (Signicat-länk)",
        ),
      };
    });
    setAvtalPreviewOpen(false);
    refresh();
  };

  const sendPaminnelse = () => {
    patchAnnons(id, (it) => ({
      ...it,
      workflow: logEntry(
        { ...it.workflow, reminderSentAt: new Date().toISOString() },
        "TreLink",
        "TreLink skickade en påminnelse om uppdragsavtalet till säljaren",
      ),
    }));
    refresh();
  };

  const resendAvtal = () => {
    patchAnnons(id, (it) => {
      const now = new Date().toISOString();
      return {
        ...it,
        workflow: logEntry(
          { ...it.workflow, avtalSentAt: now, reminderSentAt: undefined },
          "TreLink",
          "TreLink skickade om uppdragsavtalet",
        ),
      };
    });
    refresh();
  };

  const submitKomplettering = () => {
    if (!komplText.trim()) return;
    patchAnnons(id, (it) => ({
      ...it,
      workflow: logEntry(
        {
          ...it.workflow,
          state: "komplettering",
          komplettering: { message: komplText, at: new Date().toISOString() },
        },
        "TreLink",
        `Begärde komplettering: "${komplText.slice(0, 80)}${komplText.length > 80 ? "…" : ""}"`,
      ),
    }));
    setKomplText("");
    setKomplOpen(false);
    refresh();
  };

  const reject = () => {
    if (!rejectReason) return;
    patchAnnons(id, (it) => ({
      ...it,
      workflow: logEntry(
        {
          ...it.workflow,
          state: "avvisad",
          avvisadReason: { orsak: rejectReason, note: rejectNote, at: new Date().toISOString() },
        },
        "TreLink",
        `Avvisade ärendet · ${rejectReason}${rejectNote ? ` — ${rejectNote}` : ""}`,
      ),
    }));
    setRejectOpen(false);
    setRejectReason("");
    setRejectNote("");
    refresh();
  };

  const publishAnnons = () => {
    if (!utkastRubrik.trim() || !utkastBeskrivning.trim() || !utkastPris.trim()) return;
    patchAnnons(id, (it) => {
      const now = new Date().toISOString();
      return {
        ...it,
        status: "Publicerad",
        publiceradAt: now,
        draft: { ...it.draft, valdaBilderOrdning: valdaBilder },
        workflow: logEntry(
          logEntry(
            {
              ...it.workflow,
              state: "publicerad",
              publiceradAt: now,
              utkast: {
                rubrik: utkastRubrik,
                beskrivning: utkastBeskrivning,
                yta: it.draft?.yta || "",
                pris: utkastPris,
                sentAt: now,
              },
            },
            "TreLink",
            "TreLink publicerade annonsen",
          ),
          "System",
          "Bekräftelsemejl skickat till säljaren",
        ),
      };
    });
    refresh();
  };

  const cat = cats.find((c) => c.id === (item.cat ?? draft.cat));

  const sellerEpost = sellerAccount?.profil?.epost || onboarding?.saljaruppgifter.epost || "—";
  const sellerFornamn = sellerAccount?.bankid.fornamn || onboarding?.saljaruppgifter.fornamn || "";
  const hyresvardEpost = draft.hyresvardEmail || "—";

  const avtalFirmatecknareNamn = onboarding?.firmatecknare
    ? `${onboarding.firmatecknare.fornamn} ${onboarding.firmatecknare.efternamn}`
    : onboarding
    ? `${onboarding.saljaruppgifter.fornamn} ${onboarding.saljaruppgifter.efternamn}`
    : undefined;
  const avtalFirmatecknareRoll = onboarding?.firmatecknare?.roll || "Firmatecknare";
  const avtalAvgift = cat ? `${cat.avgift}${item.premium ? " + 2 500 kr (premium-tillägg)" : ""}` : undefined;
  const avtalPrisFormaterat = prisInput.trim() ? Number(prisInput).toLocaleString("sv-SE") : undefined;

  const avtalSentAt = item.workflow?.avtalSentAt;
  const daysSinceAvtalSent = avtalSentAt
    ? Math.floor((Date.now() - new Date(avtalSentAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Mappar en loggad tidslinjetext till innehållet i det (simulerade) mail som skickades då.
  function mailForLogEntry(text: string): MailData | null {
    if (text === "TreLink skickade en påminnelse om uppdragsavtalet till säljaren") {
      return {
        fran: "TreLink <avtal@trelink.se>",
        till: sellerEpost,
        amne: `Påminnelse: uppdragsavtal väntar på signering — ${item.titel}`,
        brodtext: `Hej ${sellerFornamn || "där"},\n\nVi ser att uppdragsavtalet för "${item.titel}" ännu inte är signerat. Logga in på TreLink för att granska och signera via Signicat.\n\nMed vänliga hälsningar,\nTreLink`,
      };
    }
    if (text === "TreLink skickade om uppdragsavtalet") {
      return {
        fran: "TreLink <avtal@trelink.se>",
        till: sellerEpost,
        amne: `Uppdragsavtal för signering — ${item.titel}`,
        brodtext: `Hej ${sellerFornamn || "där"},\n\nVi skickar uppdragsavtalet för "${item.titel}" till dig igen. Logga in på TreLink för att granska och signera via Signicat.\n\nGodkänt pris: ${item.pris || "—"} kr\nAvgift: ${cat ? `${cat.avgift}${item.premium ? " + 2 500 kr (premium-tillägg)" : ""}` : "—"}\n\nMed vänliga hälsningar,\nTreLink`,
      };
    }
    if (text === "Uppdragsavtal skickat till säljaren via e-post (Signicat-länk)") {
      return {
        fran: "TreLink <avtal@trelink.se>",
        till: sellerEpost,
        amne: `Uppdragsavtal för signering — ${item.titel}`,
        brodtext: `Hej ${sellerFornamn || "där"},\n\nTreLink har granskat och godkänt ditt objekt "${item.titel}". Uppdragsavtalet väntar på din signatur — logga in på TreLink för att granska och signera via Signicat.\n\nGodkänt pris: ${item.pris || "—"} kr\nAvgift: ${cat ? `${cat.avgift}${item.premium ? " + 2 500 kr (premium-tillägg)" : ""}` : "—"}\n\nMed vänliga hälsningar,\nTreLink`,
      };
    }
    if (text === "Informationsmejl skickat till hyresvärden") {
      return {
        fran: "TreLink <info@trelink.se>",
        till: hyresvardEpost,
        amne: `Information: pågående lokalöverlåtelse — ${item.titel}`,
        brodtext: `Hej,\n\nVi vill informera om att en process för överlåtelse av lokalen "${item.titel}" har påbörjats via TreLink. Ni behöver inte agera i detta skede — vid en eventuell affär återkommer vi för godkännande av ny hyresgäst innan tillträde.\n\nMed vänliga hälsningar,\nTreLink`,
      };
    }
    if (text === "Bekräftelsemejl skickat till säljaren") {
      return {
        fran: "TreLink <no-reply@trelink.se>",
        till: sellerEpost,
        amne: `Din annons är nu publicerad — ${item.titel}`,
        brodtext: `Hej ${sellerFornamn || "där"},\n\nGrattis! Din annons "${item.titel}" är nu live på trelink.se. Du kan följa intresseanmälningar och affärens status direkt i din TreLink-panel.\n\nMed vänliga hälsningar,\nTreLink`,
      };
    }
    return null;
  }

  return (
    <AdminLayout>
      <Link to="/admin/annonser" className="mb-4 inline-block text-xs text-muted-foreground underline hover:text-foreground">
        ← Tillbaka till Granskning
      </Link>

      <PageHeader
        eyebrow={`TreLink Admin · Annons #${id}`}
        title={item.titel ?? "Okänd annons"}
        subtitle={st ? stateLabel[st] : "Status okänd"}
      />

      {st === "avvisad" ? <RejectedBanner item={item} /> : <ProcessStepper state={st} />}

      {sellerAccount ? (
        <Link
          to="/admin/anvandare/$id"
          params={{ id: sellerAccount.id }}
          className="mb-6 inline-flex items-center gap-1.5 border border-dashed border-muted-foreground/40 px-3 py-2 text-sm hover:border-foreground"
        >
          <span className="text-muted-foreground">Inskickad av</span>
          <span className="font-medium">
            {sellerAccount.bankid.fornamn} {sellerAccount.bankid.efternamn}
          </span>
          {sellerAccount.profil?.bolag && (
            <span className="text-muted-foreground">· {sellerAccount.profil.bolag}</span>
          )}
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <div className="mb-6 inline-block border border-dashed border-muted-foreground/40 px-3 py-2 text-sm text-muted-foreground">
          Inskickad av okänt konto — ingen kontokoppling hittades.
        </div>
      )}

      {/* Fast åtgärdsrad längst ned — position:sticky med bottom-0 visade sig inte
          fästa i praktiken (verifierat: ett minimalt, ramverksoberoende sticky-element
          i samma container uppvisade samma problem), så vi använder fixed istället,
          samma mönster som StickyCTA i annons.$id.index.tsx. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-foreground/30 bg-background px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {checklist.map((c) => (
              <span
                key={c.label}
                className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  c.ok
                    ? "border-foreground/30 text-muted-foreground"
                    : "border-amber-500/70 bg-amber-50/60 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500"
                }`}
              >
                {c.ok ? "✅" : "⚠️"} {c.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <WireBtn variant="ghost" onClick={() => setKomplOpen((v) => !v)}>
              Begär komplettering
            </WireBtn>
            <WireBtn variant="ghost" onClick={() => setRejectOpen((v) => !v)}>
              Avvisa annons
            </WireBtn>
            <WireBtn
              variant="primary"
              disabled={!canApproveMedPris}
              onClick={() => setAvtalPreviewOpen(true)}
              className={!canApproveMedPris ? "cursor-not-allowed border-muted-foreground/30 bg-muted/30 text-muted-foreground hover:opacity-100" : ""}
            >
              {canApproveMedPris ? "Skapa uppdragsavtal →" : "Skapa uppdragsavtal (lås upp först)"}
            </WireBtn>
          </div>
        </div>
      </div>

      {(st === "granskas" || st === "komplettering") && (
        <WireBox label="Fastighetsinfo & prissättning" className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Sätt pris (kr)
              </span>
              <input
                type="number"
                min="0"
                value={prisInput}
                onChange={(e) => setPrisInput(e.target.value)}
                placeholder="1 200 000"
                className="h-11 w-full rounded-button border border-foreground/15 bg-background px-3 text-sm transition-colors duration-150 focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
              />
              <span className="mt-1 block text-[11px] text-muted-foreground">
                TreLink sätter priset baserat på underlaget — detta blir det pris köpare ser.
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Yta (m²)
              </span>
              <input
                type="text"
                value={draft.yta || ""}
                onChange={(e) => setDraftField("yta", e.target.value)}
                placeholder="180"
                className="h-11 w-full rounded-button border border-foreground/15 bg-background px-3 text-sm transition-colors duration-150 focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Hyra (kr/mån)
              </span>
              <input
                type="text"
                value={draft.hyra || ""}
                onChange={(e) => setDraftField("hyra", e.target.value)}
                placeholder="45 000"
                className="h-11 w-full rounded-button border border-foreground/15 bg-background px-3 text-sm transition-colors duration-150 focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Fastighetsskatt (kr/år)
              </span>
              <input
                type="text"
                value={draft.fastighetsskatt || ""}
                onChange={(e) => setDraftField("fastighetsskatt", e.target.value)}
                placeholder="12 000"
                className="h-11 w-full rounded-button border border-foreground/15 bg-background px-3 text-sm transition-colors duration-150 focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Fastighetsbeteckning
              </span>
              <input
                type="text"
                value={draft.fastighetsbeteckning || ""}
                onChange={(e) => setDraftField("fastighetsbeteckning", e.target.value)}
                placeholder="Innerstaden 12:34"
                className="h-11 w-full rounded-button border border-foreground/15 bg-background px-3 text-sm transition-colors duration-150 focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
              />
            </label>
            {visaOmsattning && (
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Omsättning
                </span>
                <input
                  type="text"
                  value={draft.omsattning || ""}
                  onChange={(e) => setDraftField("omsattning", e.target.value)}
                  placeholder="1,9 Mkr"
                  className="h-11 w-full rounded-button border border-foreground/15 bg-background px-3 text-sm transition-colors duration-150 focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
                />
              </label>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Kvadratmeterpris (kr/kvm/år)
              </span>
              <div className="flex h-10 items-center border border-dashed border-muted-foreground/40 bg-muted/20 px-3 text-sm tabular-nums text-muted-foreground">
                {kvmPris != null ? `${kvmPris.toLocaleString("sv-SE")} kr/kvm/år` : "—"}
              </div>
            </div>
            <div>
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Karta
              </span>
              <KartaPlaceholder adress={draft.adress} />
            </div>
          </div>
        </WireBox>
      )}

      {komplOpen && (
        <WireBox label="Begär komplettering · hela annonsen" className="mb-6">
          <textarea
            value={komplText}
            onChange={(e) => setKomplText(e.target.value)}
            rows={3}
            placeholder="Vad behöver säljaren komplettera övergripande?"
            className="w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
          />
          <div className="mt-2 flex justify-end gap-2">
            <WireBtn variant="ghost" onClick={() => { setKomplOpen(false); setKomplText(""); }}>
              Avbryt
            </WireBtn>
            <WireBtn
              variant="secondary"
              disabled={!komplText.trim()}
              onClick={submitKomplettering}
              className={!komplText.trim() ? "cursor-not-allowed border-muted-foreground/30 text-muted-foreground hover:opacity-100" : ""}
            >
              Skicka begäran →
            </WireBtn>
          </div>
        </WireBox>
      )}

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
              <WireBtn
                variant="secondary"
                onClick={reject}
                disabled={!rejectReason}
                className={!rejectReason ? "cursor-not-allowed border-muted-foreground/30 text-muted-foreground hover:opacity-100" : ""}
              >
                Avvisa & meddela säljare
              </WireBtn>
            </div>
          </div>
        </WireBox>
      )}

      {st === "avtal-vantar-signering" && (
        <WireBox label="Uppdragsavtal · väntar på signering" className="mb-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                Skickat: {avtalSentAt ? new Date(avtalSentAt).toLocaleDateString("sv-SE") : "—"}
                {daysSinceAvtalSent !== null && ` · ${daysSinceAvtalSent} dagar sedan`}
              </span>
              {(() => {
                const reminderMail = (item.workflow?.timeline ?? []).some(
                  (l: any) => l.text === "TreLink skickade en påminnelse om uppdragsavtalet till säljaren",
                );
                return reminderMail ? (
                  <VisaMailLank
                    onClick={() =>
                      setMailPreview(mailForLogEntry("TreLink skickade en påminnelse om uppdragsavtalet till säljaren"))
                    }
                  />
                ) : null;
              })()}
            </div>

            {daysSinceAvtalSent !== null && daysSinceAvtalSent >= 5 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-amber-500/70 bg-amber-50/60 px-3 py-2 dark:bg-amber-500/10">
                <span className="text-sm font-medium text-amber-700 dark:text-amber-500">
                  ⚠️ Avtalet har inte signerats — 5 dagar har passerat
                </span>
                <div className="flex items-center gap-2">
                  <WireBtn onClick={resendAvtal}>Skicka om avtal →</WireBtn>
                  {(() => {
                    const resendMail = (item.workflow?.timeline ?? []).some(
                      (l: any) => l.text === "TreLink skickade om uppdragsavtalet",
                    );
                    return resendMail ? (
                      <VisaMailLank onClick={() => setMailPreview(mailForLogEntry("TreLink skickade om uppdragsavtalet"))} />
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            {daysSinceAvtalSent !== null &&
              daysSinceAvtalSent >= 3 &&
              daysSinceAvtalSent < 5 &&
              !item.workflow?.reminderSentAt && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-l-2 border-foreground/40 bg-muted/30 px-3 py-2">
                  <span className="text-sm">Påminnelse bör skickas</span>
                  <WireBtn onClick={sendPaminnelse}>Skicka påminnelse →</WireBtn>
                </div>
              )}
          </div>
        </WireBox>
      )}

      {st === "hyresvard-notifiering" && (
        <WireBox label="Skriv annonstext" className="mb-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 border-l-2 border-foreground/40 bg-muted/30 px-3 py-2 text-sm">
            <span>✓ Hyresvärden är automatiskt informerad via Signicat</span>
            {(() => {
              const hyresvardMail = (item.workflow?.timeline ?? []).some(
                (l: any) => l.text === "Informationsmejl skickat till hyresvärden",
              );
              return hyresvardMail ? (
                <VisaMailLank
                  onClick={() => setMailPreview(mailForLogEntry("Informationsmejl skickat till hyresvärden"))}
                />
              ) : null;
            })()}
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Rubrik
              </span>
              <input
                type="text"
                value={utkastRubrik}
                onChange={(e) => setUtkastRubrik(e.target.value)}
                placeholder="T.ex. Välskött café i centrala Stockholm"
                className="h-11 w-full rounded-button border border-foreground/15 bg-background px-3 text-sm transition-colors duration-150 focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Beskrivning
              </span>
              <textarea
                value={utkastBeskrivning}
                onChange={(e) => setUtkastBeskrivning(e.target.value)}
                rows={6}
                placeholder="Skriv annonstexten baserat på säljarens underlag…"
                className="w-full border border-foreground/40 bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Pris (kr)
              </span>
              <input
                type="text"
                value={utkastPris}
                onChange={(e) => setUtkastPris(e.target.value)}
                className="h-10 w-48 border border-foreground/40 bg-background px-3 text-sm"
              />
            </label>
          </div>
          <div className="mt-4">
            <WireBtn
              variant="primary"
              disabled={!utkastRubrik.trim() || !utkastBeskrivning.trim() || !utkastPris.trim()}
              onClick={publishAnnons}
              className={
                !(utkastRubrik.trim() && utkastBeskrivning.trim() && utkastPris.trim())
                  ? "cursor-not-allowed border-muted-foreground/30 bg-muted/30 text-muted-foreground hover:opacity-100"
                  : ""
              }
            >
              Publicera annons →
            </WireBtn>
          </div>
        </WireBox>
      )}

      {skrivFasen && verksamhetstypfaltBlock}

      {st === "publicerad" && (
        <WireBox label="🎉 Annonsen är publicerad" className="mb-6" variant="dashed">
          <p className="text-sm text-muted-foreground">Klart — inget mer krävs. Annonsen är live på trelink.se.</p>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              k="Publicerad"
              v={item.workflow?.publiceradAt ? new Date(item.workflow.publiceradAt).toLocaleString("sv-SE") : undefined}
            />
            <Field k="Slutgiltig rubrik" v={item.workflow?.utkast?.rubrik || item.titel} />
            <Field k="Slutgiltigt pris" v={(item.workflow?.utkast?.pris || item.pris) ? `${item.workflow?.utkast?.pris || item.pris} kr` : undefined} />
          </div>
        </WireBox>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Annonsens underlag — alla sektioner visas alltid, även tomma, i samma ordning som säljaren fyller i dem */}
        <div className="lg:col-span-2 space-y-6">
          <Annotation>Annonsens underlag · alla sektioner visas alltid, även ofullständiga</Annotation>

          {!skrivFasen && (
          <>
          <WireBox label="Typ av lokal">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              k="Paket"
              v={cat?.name}
              edited={!!item.trelinkEdits?.["draft.cat"]}
              onSave={savePaket}
            />
            <Field
              k="Avgift"
              v={cat ? `${cat.avgift}${item.premium ? " + 2 500 kr (premium-tillägg)" : ""}` : undefined}
            />
          </div>
        </WireBox>

        <WireBox label="Bolagsuppgifter">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              k="Bolag"
              v={onboarding?.bolagsuppgifter.bolag}
              edited={!!item.trelinkEdits?.["onboarding.bolag.bolag"]}
              onSave={saveOnboardingField("onboarding.bolag.bolag", (d, v) => ({
                ...d,
                bolagsuppgifter: { ...d.bolagsuppgifter, bolag: v },
              }))}
            />
            <Field
              k="Org.nr"
              v={draft.orgnr || onboarding?.bolagsuppgifter.orgnr}
              edited={!!item.trelinkEdits?.["draft.orgnr"]}
              onSave={saveDraftField("orgnr")}
            />
            <Field
              k="Ort"
              v={onboarding?.bolagsuppgifter.ort}
              edited={!!item.trelinkEdits?.["onboarding.bolag.ort"]}
              onSave={saveOnboardingField("onboarding.bolag.ort", (d, v) => ({
                ...d,
                bolagsuppgifter: { ...d.bolagsuppgifter, ort: v },
              }))}
            />
            <Field
              k="Adress"
              v={onboarding?.bolagsuppgifter.adress}
              edited={!!item.trelinkEdits?.["onboarding.bolag.adress"]}
              onSave={saveOnboardingField("onboarding.bolag.adress", (d, v) => ({
                ...d,
                bolagsuppgifter: { ...d.bolagsuppgifter, adress: v },
              }))}
            />
            <div className="md:col-span-2">
              <Field
                k="Företagspresentation"
                v={onboarding?.bolagsuppgifter.presentation}
                edited={!!item.trelinkEdits?.["onboarding.bolag.presentation"]}
                onSave={saveOnboardingField("onboarding.bolag.presentation", (d, v) => ({
                  ...d,
                  bolagsuppgifter: { ...d.bolagsuppgifter, presentation: v },
                }))}
              />
            </div>
          </div>
        </WireBox>

        <WireBox label="Kontaktperson">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              k="Namn"
              v={onboarding ? `${onboarding.saljaruppgifter.fornamn} ${onboarding.saljaruppgifter.efternamn}` : undefined}
              edited={!!item.trelinkEdits?.["onboarding.kontakt.namn"]}
              onSave={saveOnboardingField("onboarding.kontakt.namn", (d, v) => {
                const { fornamn, efternamn } = splitName(v);
                return { ...d, saljaruppgifter: { ...d.saljaruppgifter, fornamn, efternamn } };
              })}
            />
            <Field
              k="Mobil"
              v={onboarding?.saljaruppgifter.mobil}
              edited={!!item.trelinkEdits?.["onboarding.kontakt.mobil"]}
              onSave={saveOnboardingField("onboarding.kontakt.mobil", (d, v) => ({
                ...d,
                saljaruppgifter: { ...d.saljaruppgifter, mobil: v },
              }))}
            />
            <Field
              k="E-post"
              v={onboarding?.saljaruppgifter.epost}
              edited={!!item.trelinkEdits?.["onboarding.kontakt.epost"]}
              onSave={saveOnboardingField("onboarding.kontakt.epost", (d, v) => ({
                ...d,
                saljaruppgifter: { ...d.saljaruppgifter, epost: v },
              }))}
            />
          </div>
        </WireBox>

        <WireBox label="Firmatecknare">
          {!onboarding ? (
            <Field k="Status" v={undefined} />
          ) : onboarding.firmatecknare === null ? (
            <div className="text-sm">Kontaktpersonen är firmatecknare.</div>
          ) : (
            <>
              <div className="mb-3 text-sm">Kontaktpersonen är inte firmatecknare — se uppgifter nedan.</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  k="Roll"
                  v={onboarding.firmatecknare.roll}
                  edited={!!item.trelinkEdits?.["onboarding.firmatecknare.roll"]}
                  onSave={saveOnboardingField("onboarding.firmatecknare.roll", (d, v) =>
                    d.firmatecknare ? { ...d, firmatecknare: { ...d.firmatecknare, roll: v } } : d,
                  )}
                />
                <Field
                  k="Namn"
                  v={`${onboarding.firmatecknare.fornamn} ${onboarding.firmatecknare.efternamn}`}
                  edited={!!item.trelinkEdits?.["onboarding.firmatecknare.namn"]}
                  onSave={saveOnboardingField("onboarding.firmatecknare.namn", (d, v) => {
                    if (!d.firmatecknare) return d;
                    const { fornamn, efternamn } = splitName(v);
                    return { ...d, firmatecknare: { ...d.firmatecknare, fornamn, efternamn } };
                  })}
                />
                <Field
                  k="Mail"
                  v={onboarding.firmatecknare.mail}
                  edited={!!item.trelinkEdits?.["onboarding.firmatecknare.mail"]}
                  onSave={saveOnboardingField("onboarding.firmatecknare.mail", (d, v) =>
                    d.firmatecknare ? { ...d, firmatecknare: { ...d.firmatecknare, mail: v } } : d,
                  )}
                />
                <Field
                  k="Mobil"
                  v={onboarding.firmatecknare.mobil}
                  edited={!!item.trelinkEdits?.["onboarding.firmatecknare.mobil"]}
                  onSave={saveOnboardingField("onboarding.firmatecknare.mobil", (d, v) =>
                    d.firmatecknare ? { ...d, firmatecknare: { ...d.firmatecknare, mobil: v } } : d,
                  )}
                />
              </div>
            </>
          )}
        </WireBox>
        </>
        )}

        <WireBox label="Grunduppgifter">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              k="Försäljningsadress"
              v={draft.adress}
              edited={!!item.trelinkEdits?.["draft.adress"]}
              onSave={saveDraftField("adress")}
            />
            <Field
              k="Verksamhetstyp"
              v={draft.verksamhet}
              edited={!!item.trelinkEdits?.["draft.verksamhet"]}
              onSave={saveDraftField("verksamhet")}
            />
            {skrivFasen && (
              <>
                <Field k="Hyra" v={draft.hyra ? `${draft.hyra} kr/mån` : undefined} />
                <Field k="Fastighetsskatt" v={draft.fastighetsskatt ? `${draft.fastighetsskatt} kr/år` : undefined} />
                <Field k="Fastighetsbeteckning" v={draft.fastighetsbeteckning} />
                <Field k="Kvadratmeterpris" v={kvmPris != null ? `${kvmPris.toLocaleString("sv-SE")} kr/kvm/år` : undefined} />
              </>
            )}
          </div>
        </WireBox>

        {!skrivFasen && verksamhetstypfaltBlock}

        {!skrivFasen && (
        <>
        <WireBox label="Hyresvärd & BRF">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              k="Hyresvärd namn"
              v={draft.hyresvardNamn}
              edited={!!item.trelinkEdits?.["draft.hyresvardNamn"]}
              onSave={saveDraftField("hyresvardNamn")}
            />
            <Field
              k="Hyresvärd e-post"
              v={draft.hyresvardEmail}
              edited={!!item.trelinkEdits?.["draft.hyresvardEmail"]}
              onSave={saveDraftField("hyresvardEmail")}
            />
            <Field
              k="Hyresvärd telefon"
              v={draft.hyresvardTel}
              edited={!!item.trelinkEdits?.["draft.hyresvardTel"]}
              onSave={saveDraftField("hyresvardTel")}
            />
            <Field
              k="BRF-kontaktperson"
              v={draft.brfKontakt}
              edited={!!item.trelinkEdits?.["draft.brfKontakt"]}
              onSave={saveDraftField("brfKontakt")}
            />
          </div>
        </WireBox>

        <div>
          <Annotation>Granska varje dokument separat · beslut loggas direkt</Annotation>
          <div className="mt-3 space-y-3">
            {specs.length === 0 && (
              <WireBox variant="dashed">
                <Annotation>Inga dokumentkrav hittades för denna annons.</Annotation>
              </WireBox>
            )}
            {specs.map((d) => {
              const state = docsState[d.name] ?? "saknas";
              return (
                <WireBox key={d.name}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <DocStateBadge state={state} />
                        {d.required ? <WireTag>obligatorisk</WireTag> : <span className="font-mono text-[10px] text-muted-foreground">valfri</span>}
                      </div>
                      <h4 className="font-medium">{d.name}</h4>
                      <Annotation>{d.krav}</Annotation>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <WireBtn variant="ghost" className="text-xs">Förhandsgranska</WireBtn>
                      {state !== "godkant" && (
                        <WireBtn variant="secondary" onClick={() => approveDoc(d.name)}>Godkänn</WireBtn>
                      )}
                      <WireBtn variant="ghost" onClick={() => setActiveDoc(activeDoc === d.name ? null : d.name)}>
                        Begär komplettering
                      </WireBtn>
                      {!d.required && state !== "ej-aktuell" && (
                        <WireBtn variant="ghost" onClick={() => markDocNotApplicable(d.name)}>
                          Ej mottagen (N/A)
                        </WireBtn>
                      )}
                    </div>
                  </div>

                  {activeDoc === d.name && (
                    <div className="mt-4 border-t border-dashed border-muted-foreground/40 pt-3">
                      <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Snabbmallar
                      </span>
                      <div className="mb-3 flex flex-wrap gap-2">
                        {kompletteringsMallar.map((m) => (
                          <button
                            key={m}
                            onClick={() => setDocKomplText(m)}
                            className="border border-dashed border-muted-foreground/50 px-2 py-1 text-left font-mono text-[10px] text-muted-foreground hover:border-foreground hover:text-foreground"
                          >
                            + {m.slice(0, 40)}…
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={docKomplText}
                        onChange={(e) => setDocKomplText(e.target.value)}
                        rows={3}
                        placeholder="Skriv tydligt vad säljaren ska göra. Detta skickas direkt till säljaren."
                        className="w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <WireBtn variant="ghost" onClick={() => { setActiveDoc(null); setDocKomplText(""); }}>Avbryt</WireBtn>
                        <WireBtn
                          variant="secondary"
                          disabled={!docKomplText.trim()}
                          onClick={() => requestDocKomplettering(d.name)}
                          className={!docKomplText.trim() ? "cursor-not-allowed border-muted-foreground/30 text-muted-foreground hover:opacity-100" : ""}
                        >
                          Skicka begäran →
                        </WireBtn>
                      </div>
                    </div>
                  )}
                </WireBox>
              );
            })}
          </div>
          </div>
        </>
        )}

        {skrivFasen && (
          <>
            <WireBox label="Bilder">
              <BilderOversikt bilder={draft.bilder} valda={valdaBilder} onChange={setValdaBilder} />
            </WireBox>
            <WireBox label="Karta">
              <KartaPlaceholder adress={draft.adress} />
            </WireBox>
          </>
        )}
        </div>

        {/* Sidopanel: logg */}
        <div className="space-y-4">
          <WireBox label="Beslutslogg · synlig för säljaren" className="sticky top-24">
            <ul className="space-y-3">
              {(item.workflow?.timeline ?? []).map((l: any, i: number) => {
                const mail = mailForLogEntry(l.text);
                return (
                  <li key={i} className="border-l-2 border-foreground/40 pl-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(l.ts).toLocaleString("sv-SE")} · {l.vem}
                    </div>
                    <div className="text-sm">{l.text}</div>
                    {mail && <VisaMailLank onClick={() => setMailPreview(mail)} />}
                  </li>
                );
              })}
            </ul>
            <Annotation>
              <span className="mt-3 block">↳ Inget hemligt här. Säljaren ser exakt samma logg i sin vy.</span>
            </Annotation>
          </WireBox>
        </div>
      </div>

      {avtalPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
          onClick={() => setAvtalPreviewOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-foreground bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-foreground/30 bg-background px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Förhandsgranskning · Uppdragsavtal
              </div>
              <WireBtn variant="ghost" onClick={() => setAvtalPreviewOpen(false)}>
                Stäng
              </WireBtn>
            </div>

            <div className="space-y-4 p-6">
              <div className="inline-flex items-center gap-1 border border-foreground bg-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-background">
                ✓ TreLink-signatur: Förifylld
              </div>

              <UppdragsavtalDokument
                bolag={onboarding?.bolagsuppgifter.bolag}
                orgnr={onboarding?.bolagsuppgifter.orgnr}
                firmatecknareNamn={avtalFirmatecknareNamn}
                firmatecknareRoll={avtalFirmatecknareRoll}
                verksamhet={draft.verksamhet}
                yta={draft.yta}
                adress={draft.adress}
                ort={onboarding?.bolagsuppgifter.ort}
                pris={avtalPrisFormaterat}
                avgift={avtalAvgift}
              />

              <div className="flex flex-wrap justify-end gap-2 border-t border-dashed border-muted-foreground/30 pt-4">
                <WireBtn variant="ghost" onClick={() => setAvtalPreviewOpen(false)}>
                  Redigera
                </WireBtn>
                <WireBtn onClick={approveAnnons}>Skicka till säljaren →</WireBtn>
              </div>
            </div>
          </div>
        </div>
      )}

      <MailPreview open={!!mailPreview} mail={mailPreview} onClose={() => setMailPreview(null)} />

      {/* Reserverar plats så den fasta åtgärdsraden inte täcker sista innehållet. */}
      <div className="h-24" />
    </AdminLayout>
  );
}

function DocStateBadge({ state }: { state: DocState }) {
  const map: Record<DocState, { label: string; tone: "default" | "filled" | "warning" | "neutral" }> = {
    "saknas": { label: "⚠️ VÄNTAR PÅ UPPLADDNING", tone: "warning" },
    "uppladdad": { label: "UPPLADDAD · VÄNTAR GRANSKNING", tone: "default" },
    "granskas": { label: "GRANSKAS", tone: "default" },
    "godkant": { label: "✓ GODKÄNT", tone: "filled" },
    "komplettera": { label: "⏳ KOMPLETTERING BEGÄRD", tone: "default" },
    "ej-aktuell": { label: "N/A · EJ AKTUELLT", tone: "neutral" },
  };
  const m = map[state];
  const toneCls =
    m.tone === "filled"
      ? "border-foreground bg-foreground text-background"
      : m.tone === "warning"
      ? "border-amber-500/70 bg-amber-50/60 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500"
      : m.tone === "neutral"
      ? "border-muted-foreground/40 bg-muted/40 text-muted-foreground"
      : "border-foreground/50 text-foreground";
  return (
    <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${toneCls}`}>
      {m.label}
    </span>
  );
}
