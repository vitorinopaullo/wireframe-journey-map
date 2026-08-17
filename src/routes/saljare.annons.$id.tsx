import { createFileRoute, Link } from "@tanstack/react-router";
import { X, Lock, Upload, Paperclip, FileText, Mail, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";
import { SignicatFlow } from "@/components/SignicatFlow";
import { ContractExpiryCountdown } from "@/components/ContractExpiryBanner";
import { MailPreview, VisaMailLank, type MailData } from "@/components/MailPreview";
import { UppdragsavtalDokument } from "@/components/UppdragsavtalDokument";
import {
  getAnnons,
  logEntry,
  patchAnnons,
  stateLabel,
  type WorkflowState,
  type WorkflowData,
} from "@/lib/annons-workflow";
import { cats } from "@/lib/annons-model";
import { getSession } from "@/lib/mock-auth";

const ONBOARDING_SALJARE_KEY = "trelink-onboarding-saljare-uppgifter";

type OnboardingSaljareData = {
  bolagsuppgifter: { bolag: string; orgnr: string; ort: string; adress: string; presentation?: string };
  saljaruppgifter: { fornamn: string; efternamn: string; mobil: string; epost: string };
  firmatecknare: { roll: string; fornamn: string; efternamn: string; mail: string; mobil: string } | null;
};

export const Route = createFileRoute("/saljare/annons/$id")({
  component: SellerAnnonsDetail,
});

const flowSteps: { state: WorkflowState; label: string }[] = [
  { state: "granskas", label: "Granskning" },
  { state: "avtal-vantar-signering", label: "Uppdragsavtal" },
  { state: "hyresvard-notifiering", label: "Hyresvärd" },
  { state: "publicerad", label: "Publicerad" },
];

const stateOrder: Record<WorkflowState, number> = {
  "granskas": 0,
  "komplettering": 0,
  "avvisad": 0,
  "avtal-vantar-signering": 1,
  "hyresvard-notifiering": 2,
  "publicerad": 3,
};

// Timeline texts and WorkflowData fields that are introduced at each step order.
// Used to prune stale entries when the dev-jumper goes backward.
const stepTextsMap: Record<number, string[]> = {
  1: ["Objektet godkänt — uppdragsavtal skickat för signering"],
  2: [
    "Uppdragsavtal signerat av säljaren",
    "Uppdragsavtal signerat",
    "Informationsmejl skickat till hyresvärden",
  ],
  3: [
    "TreLink publicerade annonsen",
    "Annons publicerad på trelink.se",
    "Bekräftelsemejl skickat till säljaren",
  ],
};

const stepFieldsMap: Record<number, (keyof WorkflowData)[]> = {
  1: ["avtalSentAt"],
  2: ["avtalSignedAt", "hyresvardNotifieradAt"],
  3: ["publiceradAt"],
};

function nowSv() {
  return new Date().toLocaleString("sv-SE");
}

function SellerAnnonsDetail() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<any | null>(null);
  const [tick, setTick] = useState(0);
  const [signicatOpen, setSignicatOpen] = useState(false);
  const [showLandlordUpdate, setShowLandlordUpdate] = useState(false);
  const [newLandlordEmail, setNewLandlordEmail] = useState("");
  const [kompletteringFiles, setKompletteringFiles] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingSaljareData | null>(null);
  const [mailPreview, setMailPreview] = useState<MailData | null>(null);

  useEffect(() => {
    try {
      const userId = getSession()?.userId;
      const raw = userId ? localStorage.getItem(`${ONBOARDING_SALJARE_KEY}:${userId}`) : null;
      if (raw) setOnboarding(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);



  useEffect(() => {
    const load = () => setItem(getAnnons(id) ?? null);
    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id, tick]);

  if (!item) {
    return (
      <AppLayout mode="saljare">
        <PageHeader eyebrow="Säljarläge" title="Ärendet hittades inte" />
        <Link to="/saljare/mina-annonser">
          <WireBtn variant="secondary">← Till mina annonser</WireBtn>
        </Link>
      </AppLayout>
    );
  }

  const wf: WorkflowData = item.workflow;
  const st: WorkflowState = wf?.state ?? "granskas";
  const currentStep = stateOrder[st];
  const refresh = () => setTick((t) => t + 1);

  // Dev-only: jump to a specific step and seed timeline entries.
  const jumpTo = (target: WorkflowState) => {
    patchAnnons(id, (it) => {
      const originalOrder = stateOrder[it.workflow.state as WorkflowState] ?? 0;
      const targetOrder = stateOrder[target];
      let nwf: WorkflowData = { ...it.workflow, state: target };

      // When leaving avvisad, remove its specific entry and clear the reason.
      if (it.workflow.state === "avvisad" && target !== "avvisad") {
        nwf.timeline = nwf.timeline.filter((l) => l.text !== "Annonsen avvisad — se motivering");
        delete (nwf as any).avvisadReason;
      }

      // Backward jump: purge timeline entries and reset fields from later steps.
      if (targetOrder < originalOrder) {
        const textsToRemove = new Set<string>();
        for (let ord = targetOrder + 1; ord <= 3; ord++) {
          (stepTextsMap[ord] ?? []).forEach((t) => textsToRemove.add(t));
        }
        nwf.timeline = nwf.timeline.filter(
          (l) =>
            !textsToRemove.has(l.text) &&
            !(targetOrder < 2 && l.text.startsWith("Nytt informationsmejl skickat till")),
        );
        for (let ord = targetOrder + 1; ord <= 3; ord++) {
          for (const field of stepFieldsMap[ord] ?? []) {
            delete (nwf as any)[field];
          }
        }
      }

      // Seed contextual timeline entries per target if not already present.
      const hasText = (t: string) => nwf.timeline.some((l) => l.text === t);

      if (target === "komplettering") {
        const msg = "Komplettering begärd: Vi behöver ytterligare underlag för att kunna godkänna objektet.";
        if (!hasText(msg)) nwf = logEntry(nwf, "TreLink", msg);
        nwf.komplettering = nwf.komplettering ?? { message: msg, at: new Date().toISOString() };
      }
      if (target === "avtal-vantar-signering") {
        const msg = "Objektet godkänt — uppdragsavtal skickat för signering";
        if (!hasText(msg)) nwf = logEntry(nwf, "TreLink", msg);
        nwf.avtalSentAt = nwf.avtalSentAt ?? new Date().toISOString();
      }
      if (target === "hyresvard-notifiering") {
        const m1 = "Uppdragsavtal signerat av säljaren";
        const m1b = "Bekräftelsemejl skickat till dig: Uppdragsavtal signerat";
        const m2 = "Informationsmejl skickat till hyresvärden";
        if (!hasText(m1)) nwf = logEntry(nwf, "System", m1);
        if (!hasText(m1b)) nwf = logEntry(nwf, "System", m1b);
        if (!hasText(m2)) nwf = logEntry(nwf, "TreLink", m2);
        nwf.avtalSignedAt = nwf.avtalSignedAt ?? new Date().toISOString();
        nwf.hyresvardNotifieradAt = nwf.hyresvardNotifieradAt ?? new Date().toISOString();
      }
      if (target === "publicerad") {
        const m1 = "TreLink publicerade annonsen";
        const m2 = "Bekräftelsemejl skickat till säljaren";
        if (!hasText(m1)) nwf = logEntry(nwf, "TreLink", m1);
        if (!hasText(m2)) nwf = logEntry(nwf, "System", m2);
        nwf.publiceradAt = nwf.publiceradAt ?? new Date().toISOString();
      }
      if (target === "avvisad") {
        const msg = "Annonsen avvisad — se motivering";
        if (!hasText(msg)) nwf = logEntry(nwf, "TreLink", msg);
        nwf.avvisadReason = nwf.avvisadReason ?? {
          orsak: "Objektet uppfyller inte kraven för förmedling via Trelink.",
          note: "Vänligen kontakta oss om du vill diskutera ärendet eller ansöka på nytt med ett annat objekt.",
          at: new Date().toISOString(),
        };
      }

      return {
        ...it,
        status:
          target === "publicerad"
            ? "Publicerad"
            : target === "komplettering"
            ? "Komplettering krävs"
            : target === "avvisad"
            ? "Avvisad"
            : "Granskas",
        workflow: nwf,
      };
    });
    refresh();
  };

  const openSignicat = () => setSignicatOpen(true);

  const completeSigning = () => {
    patchAnnons(id, (it) => {
      const now = new Date().toISOString();
      let nwf: WorkflowData = {
        ...it.workflow,
        state: "hyresvard-notifiering",
        avtalSignedAt: now,
        hyresvardNotifieradAt: now,
      };
      nwf = logEntry(nwf, "Säljare", "Uppdragsavtal signerat");
      nwf = logEntry(nwf, "System", "Bekräftelsemejl skickat till dig: Uppdragsavtal signerat");
      nwf = logEntry(nwf, "TreLink", "Informationsmejl skickat till hyresvärden");
      return { ...it, workflow: nwf };
    });
    setSignicatOpen(false);
    toast("Uppdragsavtalet är signerat");
    refresh();
  };


  const submitKomplettering = () => {
    patchAnnons(id, (it) => {
      let nwf: WorkflowData = { ...it.workflow, state: "granskas" };
      nwf = logEntry(nwf, "Säljare", "Komplettering inskickad");
      return { ...it, status: "Granskas", workflow: nwf };
    });
    toast("Kompletteringen har skickats till Trelink");
    setKompletteringFiles([]);
    refresh();
  };

  const avtalCat = cats.find((c) => c.id === (item.cat ?? item.draft?.cat));
  const avtalAvgift = avtalCat
    ? `${avtalCat.avgift}${item.premium ? " + 2 500 kr (premium-tillägg)" : ""}`
    : undefined;
  const avtalFirmatecknareNamn = onboarding?.firmatecknare
    ? `${onboarding.firmatecknare.fornamn} ${onboarding.firmatecknare.efternamn}`
    : onboarding
    ? `${onboarding.saljaruppgifter.fornamn} ${onboarding.saljaruppgifter.efternamn}`
    : undefined;
  const avtalFirmatecknareRoll = onboarding?.firmatecknare?.roll || "Firmatecknare";

  const sellerEpost = onboarding?.saljaruppgifter.epost || "—";
  const sellerFornamn = onboarding?.saljaruppgifter.fornamn || "";
  const hyresvardEpost = item.draft?.hyresvardEmail || "—";

  // Mappar en loggad tidslinjetext till innehållet i det (simulerade) mail som skickades då.
  function mailForLogEntry(text: string): MailData | null {
    if (text === "Bekräftelsemejl skickat till dig: Uppdragsavtal signerat") {
      return {
        fran: "TreLink <avtal@trelink.se>",
        till: sellerEpost,
        amne: `Bekräftelse: uppdragsavtal signerat — ${item.titel}`,
        brodtext: `Hej ${sellerFornamn || "där"},\n\nVi bekräftar att uppdragsavtalet för "${item.titel}" nu är signerat. Nästa steg är att vi kontaktar din hyresvärd med information om den påbörjade processen.\n\nMed vänliga hälsningar,\nTreLink`,
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
    <AppLayout mode="saljare">
      <SignicatFlow
        open={signicatOpen}
        seller={{
          bolag: item.draft?.bolag,
          orgnr: item.draft?.orgnr,
          adress: item.draft?.adress,
          objektAdress: item.draft?.adress,
          utgangspris: item.pris || "Enligt överenskommelse",
        }}
        onCancel={() => setSignicatOpen(false)}
        onSigned={completeSigning}
      />

      <PageHeader
        eyebrow={`Säljarläge · ärende ${id}`}
        title={item.titel}
        subtitle={stateLabel[st]}
        right={
          <div className="flex flex-col items-end gap-2">
            <WireTag>{stateLabel[st]}</WireTag>
            <Link to="/saljare/mina-annonser" className="text-xs text-muted-foreground underline hover:text-foreground">
              ← Mina annonser
            </Link>
          </div>
        }
      />

      {/* Dev-only step switcher */}
      <div className="mb-4 flex items-center gap-2 border border-dashed border-muted-foreground/40 bg-muted/30 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Dev · hoppa till steg
        </span>
        <select
          value={st}
          onChange={(e) => jumpTo(e.target.value as WorkflowState)}
          className="border border-foreground/30 bg-background px-2 py-1 text-xs"
        >
          {flowSteps.map((s) => (
            <option key={s.state} value={s.state}>{s.label}</option>
          ))}
          <option value="komplettering">Komplettering krävs</option>
          <option value="avvisad">Avvisad</option>
        </select>
      </div>

      {/* Flödesindikator */}
      <WireBox className="mb-6" variant="dashed">
        <div className="flex flex-wrap items-center gap-3">
          {flowSteps.map((s, i) => {
            const isKomp = st === "komplettering" && i === 0;
            const isAvvisad = st === "avvisad" && i === 0;
            const dotState = isKomp || isAvvisad
              ? "pending"
              : i < currentStep
              ? "done"
              : i === currentStep
              ? "active"
              : "pending";
            return (
              <div key={s.state} className="flex items-center gap-2">
                <StatusDot state={dotState} />
                <span
                  className={`text-xs ${
                    isKomp
                      ? "font-semibold text-amber-700 dark:text-amber-500"
                      : isAvvisad
                      ? "font-semibold text-foreground/70"
                      : i === currentStep
                      ? "font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {i < flowSteps.length - 1 && <span className="text-muted-foreground/40">›</span>}
              </div>
            );
          })}
        </div>
        {st === "komplettering" && (
          <div className="mt-3 border-t border-dashed border-amber-500/40 pt-2 text-xs font-medium text-amber-700 dark:text-amber-500">
            ↩ Komplettering begärd — åtgärda och skicka in på nytt
          </div>
        )}
        {st === "avvisad" && (
          <div className="mt-3 border-t border-dashed border-foreground/30 pt-2 text-xs font-medium text-foreground/70">
            <X className="inline-block h-3.5 w-3.5 mr-1 align-middle" />Avvisad — ärendet är stängt
          </div>
        )}
      </WireBox>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* STEP 1 · Granskning */}
          {st === "granskas" && (
            <>
              <WireBox label="Status">
                <div className="text-sm"><Lock className="inline-block h-3.5 w-3.5 mr-1 align-middle" />Låst för redigering under granskning.</div>
                <Annotation>
                  <span className="mt-2 block">TRELINK ÅTERKOMMER MED BESKED, KOMPLETTERING ELLER UPPDRAGSAVTAL.</span>
                </Annotation>
              </WireBox>
            </>
          )}

          {/* STEP 1b · Komplettering krävs */}
          {st === "komplettering" && (
            <>
              <WireBox label="Status">
                <div className="text-sm">↩ Komplettering begärd av Trelink.</div>
                <Annotation>
                  <span className="mt-2 block">
                    ÅTGÄRDA NEDANSTÅENDE OCH SKICKA IN PÅ NYTT. DU KAN FORTFARANDE INTE REDIGERA ANNONSTEXTEN.
                  </span>
                </Annotation>
              </WireBox>

              <WireBox label="Meddelande från Trelink">
                <div className="border-l-2 border-amber-500/70 bg-amber-50/60 px-4 py-3 dark:bg-amber-500/5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date().toLocaleDateString("sv-SE")} · TRELINK
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">
                    Vi behöver ytterligare underlag för att kunna godkänna objektet. Vänligen ladda upp:
                    senaste hyresavier (minst 3 månader) samt ett uppdaterat resultatdokument för
                    innevarande år.
                  </p>
                </div>
              </WireBox>

              <WireBox label="Ladda upp komplettering">
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const names = Array.from(e.dataTransfer.files).map((f) => f.name);
                    setKompletteringFiles((prev) => [...prev, ...names]);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 text-center text-sm transition ${
                    dragOver
                      ? "border-foreground bg-muted/50"
                      : "border-muted-foreground/40 bg-muted/20 hover:border-foreground/60"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const names = Array.from(e.target.files ?? []).map((f) => f.name);
                      setKompletteringFiles((prev) => [...prev, ...names]);
                    }}
                  />
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="mt-2 font-medium">Släpp filer här eller klicka för att välja</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    PDF, Word, Excel · Max 20 MB per fil
                  </div>
                </label>

                {kompletteringFiles.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {kompletteringFiles.map((f, i) => (
                      <li key={i} className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 py-1">
                        <span><Paperclip className="inline-block h-3.5 w-3.5 mr-1 align-middle" />{f}</span>
                        <WireBtn
                          variant="tertiary"
                          className="text-xs"
                          onClick={() =>
                            setKompletteringFiles((prev) => prev.filter((_, j) => j !== i))
                          }
                        >
                          Ta bort
                        </WireBtn>
                      </li>
                    ))}
                  </ul>
                )}

                {Array.isArray(item.draft?.files) && item.draft.files.length > 0 && (
                  <div className="mt-5">
                    <Annotation>Tidigare inskickade dokument</Annotation>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {item.draft.files.map((f: any, i: number) => (
                        <li key={i}><FileText className="inline-block h-3.5 w-3.5 mr-1 align-middle" />{typeof f === "string" ? f : f.name ?? "Dokument"}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5">
                  <WireBtn className="w-full" onClick={submitKomplettering}>
                    Skicka in komplettering
                  </WireBtn>
                </div>
              </WireBox>
            </>
          )}



          {/* STEP 1c · Avvisad */}
          {st === "avvisad" && (
            <>
              <WireBox label="Status">
                <div className="text-sm"><X className="inline-block h-3.5 w-3.5 mr-1 align-middle" />Din annons har avvisats.</div>
                <Annotation>
                  <span className="mt-2 block">ÄRENDET ÄR STÄNGT. SE TRELINKS MOTIVERING NEDAN.</span>
                </Annotation>
              </WireBox>

              <WireBox label="Motivering från Trelink">
                <div className="border-l-2 border-foreground/40 bg-muted/20 px-4 py-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {wf.avvisadReason?.at
                      ? new Date(wf.avvisadReason.at).toLocaleDateString("sv-SE")
                      : new Date().toLocaleDateString("sv-SE")} · TRELINK
                  </div>
                  <p className="mt-2 text-sm font-medium leading-relaxed">
                    {wf.avvisadReason?.orsak ?? "Objektet uppfyller inte kraven för förmedling via Trelink. Kontakta oss om du har frågor."}
                  </p>
                  {wf.avvisadReason?.note && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{wf.avvisadReason.note}</p>
                  )}
                </div>
              </WireBox>

              <WireBox label="Vad kan du göra?">
                <p className="text-sm">
                  Ärendet är stängt och annonsen kommer inte att publiceras. Om du anser att beslutet
                  är felaktigt, eller vill veta mer om orsakerna, är du välkommen att kontakta Trelink.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href="/kontakt">
                    <WireBtn variant="secondary">Kontakta Trelink</WireBtn>
                  </a>
                  <Link to="/saljare/mina-annonser">
                    <WireBtn variant="secondary">← Mina annonser</WireBtn>
                  </Link>
                </div>
              </WireBox>
            </>
          )}

          {/* STEP 2 · Uppdragsavtal */}
          {st === "avtal-vantar-signering" && (
            <>
              <WireBox label="Status">
                <div className="text-sm"><FileText className="inline-block h-3.5 w-3.5 mr-1 align-middle" />Uppdragsavtal väntar på din signatur.</div>
                <Annotation>
                  <span className="mt-2 block">AVTALET HAR SKICKATS TILL DIN E-POST OCH FINNS ÄVEN HÄR I PLATTFORMEN.</span>
                </Annotation>
              </WireBox>

              <WireBox label="Signera uppdragsavtal">
                <p className="text-sm">
                  Trelink har granskat och godkänt ditt objekt. Innan vi kan gå vidare behöver du signera
                  uppdragsavtalet. Det reglerar villkoren för förmedlingsuppdraget.
                </p>

                <div className="mt-5">
                  <UppdragsavtalDokument
                    bolag={onboarding?.bolagsuppgifter.bolag}
                    orgnr={onboarding?.bolagsuppgifter.orgnr}
                    firmatecknareNamn={avtalFirmatecknareNamn}
                    firmatecknareRoll={avtalFirmatecknareRoll}
                    verksamhet={item.draft?.verksamhet}
                    yta={item.draft?.yta}
                    adress={onboarding?.bolagsuppgifter.adress}
                    ort={onboarding?.bolagsuppgifter.ort}
                    pris={item.pris}
                    avgift={avtalAvgift}
                  />
                </div>

                <div className="mt-4">
                  <WireBtn className="w-full" onClick={openSignicat}>
                    Öppna och signera via Signicat →
                  </WireBtn>
                </div>
                <Annotation>
                  <span className="mt-3 block">
                    AVTALET FINNS ÄVEN I DIN E-POST · KONTAKTA TRELINK OM DU INTE HITTAR DET
                  </span>
                </Annotation>
              </WireBox>
            </>
          )}

          {/* STEP 3 · Hyresvärd */}
          {st === "hyresvard-notifiering" && (
            <>
              <WireBox label="Status">
                <div className="text-sm"><Mail className="inline-block h-3.5 w-3.5 mr-1 align-middle" />Informationsmejl skickat till hyresvärden.</div>
                <Annotation>
                  <span className="mt-2 block">
                    HYRESVÄRDEN HAR INFORMERATS OM ATT EN LOKALFÖRMEDLING HAR PÅBÖRJATS FÖR DINA LOKALER.
                  </span>
                </Annotation>
              </WireBox>

              <WireBox label="Vad händer nu?">
                <p className="text-sm">
                  Trelink har skickat ett informationsmejl till hyresvärden på din begäran. Hyresvärden
                  behöver inte agera i detta steg — de informeras enbart om att en förmedlingsprocess har
                  startat.
                </p>
                <p className="mt-2 text-sm italic text-muted-foreground">
                  Vid en framtida affär kommer hyresvärden att behöva godkänna köparen innan tillträde kan ske.
                </p>

                <div className="mt-4 border-b border-dashed border-muted-foreground/30 pb-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    HYRESVÄRD E-POST
                  </div>
                  <div className="mt-1 text-sm">{item.draft?.hyresvardEmail || "—"}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Informationsmejl skickades till denna adress när uppdragsavtalet signerades.
                  </div>
                </div>
                <WireBtn
                  variant="tertiary"
                  className="mt-2 text-xs underline"
                  onClick={() => setShowLandlordUpdate(true)}
                >
                  Uppdatera hyresvärdens e-post
                </WireBtn>

              </WireBox>
            </>
          )}

          {/* STEP 4 · Publicerad */}
          {st === "publicerad" && (
            <>
              <WireBox label="Status">
                <div className="text-sm"><CheckCircle2 className="inline-block h-3.5 w-3.5 mr-1 align-middle" />Din annons är nu live.</div>
                <Annotation>
                  <span className="mt-2 block">ETT BEKRÄFTELSEMEJL HAR SKICKATS TILL DIN E-POSTADRESS.</span>
                </Annotation>
              </WireBox>

              <WireBox label="Annonsen är publicerad">
                <p className="text-sm">
                  Trelink har publicerat din annons på trelink.se. Du kan nu följa antalet intressenter via
                  fliken Intressenter. Kom ihåg att du inte kan redigera annonsen — kontakta Trelink om något
                  behöver ändras.
                </p>

                {/* Compact listing preview */}
                <div className="mt-4 border border-foreground/30 p-4">
                  <div className="flex items-center gap-2">
                    <WireTag>{item.cat ?? "Överlåtelse"}</WireTag>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {item.draft?.ort ?? "Stockholm"}
                    </span>
                  </div>
                  <div className="mt-2 font-medium">{item.titel}</div>
                  <div className="mt-1 text-sm tabular-nums text-muted-foreground">
                    {item.pris ?? "Pris enligt överenskommelse"}
                  </div>
                  <div className="mt-3">
                    <Link to="/annons/$id" params={{ id }}>
                      <WireBtn variant="secondary">Visa annons →</WireBtn>
                    </Link>
                  </div>
                </div>

                {/* Stat chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <WireTag>0 intressenter</WireTag>
                  <WireTag>
                    Publicerad {wf.publiceradAt ? new Date(wf.publiceradAt).toLocaleDateString("sv-SE") : nowSv()}
                  </WireTag>
                  <WireTag>Premium: Nej</WireTag>
                </div>
              </WireBox>
            </>
          )}

          {/* Underlagssammanfattning — visas alltid */}
          <WireBox label="Ditt underlag">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field k="Paket" v={item.cat} />
              <Field k="Ort" v={item.draft?.ort} />
              <Field k="Adress" v={item.draft?.adress} />
              <Field k="Yta" v={item.draft?.yta ? `${item.draft.yta} m²` : "—"} />
              <Field k="Verksamhet" v={item.draft?.verksamhet} />
              <Field k="Hyresvärd e-post" v={item.draft?.hyresvardEmail} />
            </div>
          </WireBox>
        </div>

        {/* Timeline */}
        <div>
          <WireBox label="Ärendehistorik · synlig för dig & TreLink">
            <ul className="mt-1 max-h-[400px] overflow-y-auto space-y-3 pr-1">
              {(wf.timeline ?? []).map((l, i) => {
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
          </WireBox>
          <ContractExpiryCountdown daysLive={80} signedAt={wf?.avtalSignedAt} />
        </div>
      </div>

      <MailPreview open={!!mailPreview} mail={mailPreview} onClose={() => setMailPreview(null)} />

      {showLandlordUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md border border-foreground/20 bg-background p-6">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Uppdatera hyresvärdens e-post
            </div>
            <h3 className="mb-3 text-base font-semibold">
              Är du säker?
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Om du uppdaterar e-postadressen skickas ett nytt informationsmejl till den nya adressen.
            </p>
            <label className="mb-4 block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Ny e-postadress
              </span>
              <input
                type="email"
                value={newLandlordEmail}
                onChange={(e) => setNewLandlordEmail(e.target.value)}
                placeholder={item.draft?.hyresvardEmail || "info@fastighetsbolaget.se"}
                className="block h-11 w-full rounded-button border border-foreground/15 bg-muted/20 px-3 text-sm transition-colors duration-150 focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
              />
            </label>
            <div className="flex justify-end gap-2">
              <WireBtn
                variant="secondary"
                onClick={() => {
                  setShowLandlordUpdate(false);
                  setNewLandlordEmail("");
                }}
              >
                Avbryt
              </WireBtn>
              <WireBtn
                onClick={() => {
                  const email = newLandlordEmail.trim();
                  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                  if (!valid) {
                    toast("Ange en giltig e-postadress");
                    return;
                  }
                  patchAnnons(id, (it) => {
                    let nwf: WorkflowData = { ...it.workflow };
                    nwf = logEntry(nwf, "TreLink", `Nytt informationsmejl skickat till ${email}`);
                    nwf.hyresvardNotifieradAt = new Date().toISOString();
                    return {
                      ...it,
                      draft: { ...(it.draft ?? {}), hyresvardEmail: email },
                      workflow: nwf,
                    };
                  });
                  toast(`Nytt informationsmejl skickat till ${email}`);
                  setShowLandlordUpdate(false);
                  setNewLandlordEmail("");
                  refresh();
                }}
              >
                Uppdatera och skicka om
              </WireBtn>
            </div>
          </div>
        </div>
      )}

    </AppLayout>


  );
}

function Field({ k, v }: { k: string; v?: string }) {
  return (
    <div className="border-b border-dashed border-muted-foreground/30 pb-2">
      <Annotation>{k}</Annotation>
      <div className="mt-1 tabular-nums">{v || "—"}</div>
    </div>
  );
}
