import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { getAnnons, patchAnnons, logEntry, stateLabel, STORAGE_KEY, type WorkflowState } from "@/lib/annons-workflow";
import { readAdminAccounts } from "@/lib/mock-auth";
import { MailPreview, VisaMailLank, type MailData } from "@/components/MailPreview";
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

function readOnboardingSaljare(): OnboardingSaljareData | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_SALJARE_KEY);
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

function groupForTyp(typ: string): string | undefined {
  return Object.keys(FALTGRUPP_TYPER).find((g) => FALTGRUPP_TYPER[g].includes(typ));
}

function Field({ k, v }: { k: string; v?: string }) {
  const missing = !v;
  return (
    <div className="border-b border-dashed border-muted-foreground/30 pb-2">
      <Annotation>{k}</Annotation>
      <div className={`mt-1 text-sm ${missing ? "text-amber-700 dark:text-amber-500" : ""}`}>
        {missing ? "⚠️ Ej ifyllt" : v}
      </div>
    </div>
  );
}

function TagsField({ k, v }: { k: string; v?: string }) {
  const tags = v ? v.split(",").map((t) => t.trim()).filter(Boolean) : [];
  return (
    <div className="border-b border-dashed border-muted-foreground/30 pb-2">
      <Annotation>{k}</Annotation>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {tags.length > 0 ? (
          tags.map((t) => <WireTag key={t}>{t}</WireTag>)
        ) : (
          <span className="text-sm text-amber-700 dark:text-amber-500">⚠️ Ej ifyllt</span>
        )}
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
  { label: "Avtal", states: ["avtal-vantar-signering"] },
  { label: "Annonstext", states: ["hyresvard-notifiering", "utkast-till-saljare"] },
  { label: "Godkännande", states: ["utkast-feedback"] },
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
  const [utkastRubrik, setUtkastRubrik] = useState("");
  const [utkastBeskrivning, setUtkastBeskrivning] = useState("");
  const [utkastPris, setUtkastPris] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const refresh = () => setTick((t) => t + 1);

  const draft = item?.draft ?? {};
  const onboarding = readOnboardingSaljare();
  const sellerAccount = item?.sellerPersonnr
    ? readAdminAccounts().find((a) => a.bankid.personnr === item.sellerPersonnr)
    : undefined;
  const catId: CatId | undefined = draft.cat;
  const specs: DocSpec[] = catId ? docsByCat[catId] ?? [] : [];
  const docsState: Record<string, DocState> = draft.docs ?? {};

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
  const canApprove =
    st === "granskas" && stats.obligatoriskaTotal > 0 && stats.obligatoriskaOk === stats.obligatoriskaTotal && stats.kompl === 0;
  const prisValid = prisInput.trim() !== "" && Number(prisInput) > 0;
  const canApproveMedPris = canApprove && prisValid;

  const valdaGrupper = Array.from(
    new Set(
      (draft.verksamhet ? String(draft.verksamhet).split(",") : [])
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((typ: string) => groupForTyp(typ))
        .filter(Boolean) as string[],
    ),
  );

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
  const grundOk = !!(draft.yta && draft.verksamhet);
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

  const approveDoc = (docName: string) => {
    patchAnnons(id, (it) => ({
      ...it,
      draft: { ...it.draft, docs: { ...it.draft?.docs, [docName]: "godkant" } },
      workflow: logEntry(it.workflow, "TreLink", `Godkände dokument: ${docName}`),
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

  const sendDraftToSeller = () => {
    if (!utkastRubrik.trim() || !utkastBeskrivning.trim() || !utkastPris.trim()) return;
    patchAnnons(id, (it) => ({
      ...it,
      workflow: logEntry(
        {
          ...it.workflow,
          state: "utkast-till-saljare",
          utkast: {
            rubrik: utkastRubrik,
            beskrivning: utkastBeskrivning,
            pris: utkastPris,
            sentAt: new Date().toISOString(),
          },
        },
        "TreLink",
        "Annonstextutkast skickat för granskning",
      ),
    }));
    refresh();
  };

  const cat = cats.find((c) => c.id === (item.cat ?? draft.cat));

  const sellerEpost = sellerAccount?.profil?.epost || onboarding?.saljaruppgifter.epost || "—";
  const sellerFornamn = sellerAccount?.bankid.fornamn || onboarding?.saljaruppgifter.fornamn || "";
  const hyresvardEpost = draft.hyresvardEmail || "—";

  // Mappar en loggad tidslinjetext till innehållet i det (simulerade) mail som skickades då.
  function mailForLogEntry(text: string): MailData | null {
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
    if (text === "Annonstextutkast skickat för granskning") {
      return {
        fran: "TreLink <redaktion@trelink.se>",
        till: sellerEpost,
        amne: `Ditt annonsutkast är klart för granskning — ${item.titel}`,
        brodtext: `Hej ${sellerFornamn || "där"},\n\nVi har skrivit annonstexten för "${item.titel}" baserat på ditt underlag. Logga in på TreLink för att förhandsgranska texten som köpare ser den — godkänn eller lämna feedback.\n\nMed vänliga hälsningar,\nTreLink`,
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

      {/* Sticky sammanfattning + huvudåtgärder */}
      <div className="sticky top-0 z-30 mb-6 border border-foreground/30 bg-background px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
            <button
              disabled={!canApproveMedPris}
              onClick={approveAnnons}
              className={`border px-4 py-2 text-sm font-medium ${
                canApproveMedPris
                  ? "border-foreground bg-foreground text-background hover:opacity-80"
                  : "border-muted-foreground/30 bg-muted/30 text-muted-foreground cursor-not-allowed"
              }`}
            >
              {canApproveMedPris ? "Godkänn annons →" : "Godkänn annons (lås upp först)"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-dashed border-foreground/20 pt-3">
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
              className="h-9 w-48 border border-foreground/40 bg-background px-3 text-sm"
            />
          </label>
          <span className="max-w-xs text-xs text-muted-foreground">
            TreLink sätter priset baserat på underlaget — detta blir det pris köpare ser.
          </span>
        </div>
      </div>

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
            <button
              disabled={!komplText.trim()}
              onClick={submitKomplettering}
              className={`border px-4 py-2 text-sm font-medium ${komplText.trim() ? "border-foreground bg-foreground text-background hover:opacity-80" : "border-muted-foreground/30 text-muted-foreground"}`}
            >
              Skicka begäran →
            </button>
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

      {(st === "hyresvard-notifiering" || st === "utkast-feedback") && (
        <WireBox label="Skriv annonstext" className="mb-6">
          {st === "hyresvard-notifiering" && (
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
          )}
          {st === "utkast-feedback" && item.workflow?.saljareFeedback && (
            <div className="mb-4 border-l-2 border-amber-500/70 bg-amber-50/60 px-3 py-2 dark:bg-amber-500/10">
              <Annotation>Säljarens feedback</Annotation>
              <p className="mt-1 text-sm">{item.workflow.saljareFeedback.msg}</p>
            </div>
          )}
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
                className="h-10 w-full border border-foreground/40 bg-background px-3 text-sm"
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
            <button
              disabled={!utkastRubrik.trim() || !utkastBeskrivning.trim() || !utkastPris.trim()}
              onClick={sendDraftToSeller}
              className={`border px-4 py-2 text-sm font-medium ${
                utkastRubrik.trim() && utkastBeskrivning.trim() && utkastPris.trim()
                  ? "border-foreground bg-foreground text-background hover:opacity-80"
                  : "border-muted-foreground/30 bg-muted/30 text-muted-foreground cursor-not-allowed"
              }`}
            >
              Skicka utkast till säljaren →
            </button>
          </div>
        </WireBox>
      )}

      {st === "utkast-till-saljare" && (
        <WireBox label="Väntar på säljarens godkännande" className="mb-6" variant="dashed">
          <p className="text-sm text-muted-foreground">
            Utkastet är skickat — inget krävs av TreLink just nu. Säljaren godkänner eller lämnar feedback.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field k="Skickad rubrik" v={item.workflow?.utkast?.rubrik} />
            <Field k="Skickat pris" v={item.workflow?.utkast?.pris ? `${item.workflow.utkast.pris} kr` : undefined} />
          </div>
        </WireBox>
      )}

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

          <WireBox label="Typ av lokal">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field k="Paket" v={cat?.name} />
            <Field
              k="Avgift"
              v={cat ? `${cat.avgift}${item.premium ? " + 2 500 kr (premium-tillägg)" : ""}` : undefined}
            />
          </div>
        </WireBox>

        <WireBox label="Bolagsuppgifter">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field k="Bolag" v={onboarding?.bolagsuppgifter.bolag} />
            <Field k="Org.nr" v={draft.orgnr || onboarding?.bolagsuppgifter.orgnr} />
            <Field k="Ort" v={onboarding?.bolagsuppgifter.ort} />
            <Field k="Adress" v={onboarding?.bolagsuppgifter.adress} />
            <div className="md:col-span-2">
              <Field k="Företagspresentation" v={onboarding?.bolagsuppgifter.presentation} />
            </div>
          </div>
        </WireBox>

        <WireBox label="Kontaktperson">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              k="Namn"
              v={onboarding ? `${onboarding.saljaruppgifter.fornamn} ${onboarding.saljaruppgifter.efternamn}` : undefined}
            />
            <Field k="Mobil" v={onboarding?.saljaruppgifter.mobil} />
            <Field k="E-post" v={onboarding?.saljaruppgifter.epost} />
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
                <Field k="Roll" v={onboarding.firmatecknare.roll} />
                <Field k="Namn" v={`${onboarding.firmatecknare.fornamn} ${onboarding.firmatecknare.efternamn}`} />
                <Field k="Mail" v={onboarding.firmatecknare.mail} />
                <Field k="Mobil" v={onboarding.firmatecknare.mobil} />
              </div>
            </>
          )}
        </WireBox>

        <WireBox label="Grunduppgifter">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field k="Yta" v={draft.yta ? `${draft.yta} m²` : undefined} />
            <Field k="Verksamhetstyp" v={draft.verksamhet} />
          </div>
        </WireBox>

        {valdaGrupper.length === 0 ? (
          <WireBox label="Verksamhetstypfält" variant="dashed">
            <div className="text-sm text-amber-700 dark:text-amber-500">⚠️ Ingen verksamhetstyp vald ännu — fält kan inte visas.</div>
          </WireBox>
        ) : (
          valdaGrupper.map((grupp) => (
            <WireBox key={grupp} label={`Verksamhetstypfält · ${GRUPP_NAMN[grupp]}`}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {GRUPP_FALT[grupp].map((f) => {
                  const value = draft.typFalt?.[grupp]?.[f.key];
                  return f.isTags ? (
                    <TagsField key={f.key} k={f.label} v={value} />
                  ) : (
                    <Field key={f.key} k={f.label} v={value} />
                  );
                })}
              </div>
            </WireBox>
          ))
        )}

        <WireBox label="Hyresvärd & BRF">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field k="Hyresvärd namn" v={draft.hyresvardNamn} />
            <Field k="Hyresvärd e-post" v={draft.hyresvardEmail} />
            <Field k="Hyresvärd telefon" v={draft.hyresvardTel} />
            <Field k="BRF-kontaktperson" v={draft.brfKontakt} />
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
                        <button
                          disabled={!docKomplText.trim()}
                          onClick={() => requestDocKomplettering(d.name)}
                          className={`border px-4 py-2 text-sm font-medium ${docKomplText.trim() ? "border-foreground bg-foreground text-background hover:opacity-80" : "border-muted-foreground/30 text-muted-foreground"}`}
                        >
                          Skicka begäran →
                        </button>
                      </div>
                    </div>
                  )}
                </WireBox>
              );
            })}
          </div>
          </div>
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

      <MailPreview open={!!mailPreview} mail={mailPreview} onClose={() => setMailPreview(null)} />
    </AdminLayout>
  );
}

function DocStateBadge({ state }: { state: DocState }) {
  const map: Record<DocState, { label: string; filled: boolean }> = {
    "saknas": { label: "⚠️ VÄNTAR PÅ UPPLADDNING", filled: false },
    "uppladdad": { label: "UPPLADDAD · VÄNTAR GRANSKNING", filled: false },
    "granskas": { label: "GRANSKAS", filled: false },
    "godkant": { label: "✓ GODKÄNT", filled: true },
    "komplettera": { label: "⏳ KOMPLETTERING BEGÄRD", filled: false },
  };
  const m = map[state];
  return (
    <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${m.filled ? "border-foreground bg-foreground text-background" : "border-foreground/50 text-foreground"}`}>
      {m.label}
    </span>
  );
}
