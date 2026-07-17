import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";
import { SignicatFlow } from "@/components/SignicatFlow";
import {
  getAnnons,
  logEntry,
  patchAnnons,
  stateLabel,
  type WorkflowState,
  type WorkflowData,
} from "@/lib/annons-workflow";


export const Route = createFileRoute("/saljare/annons/$id")({
  component: SellerAnnonsDetail,
});

const flowSteps: { state: WorkflowState; label: string }[] = [
  { state: "granskas", label: "Granskning" },
  { state: "avtal-vantar-signering", label: "Uppdragsavtal" },
  { state: "hyresvard-notifiering", label: "Hyresvärd" },
  { state: "utkast-till-saljare", label: "Annonsutkast" },
  { state: "publicerad", label: "Publicerad" },
];

const stateOrder: Record<WorkflowState, number> = {
  "granskas": 0,
  "komplettering": 0,
  "avvisad": 0,
  "avtal-vantar-signering": 1,
  "hyresvard-notifiering": 2,
  "utkast-till-saljare": 3,
  "utkast-feedback": 3,
  "publicerad": 4,
};

function nowSv() {
  return new Date().toLocaleString("sv-SE");
}

function SellerAnnonsDetail() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<any | null>(null);
  const [tick, setTick] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [signicatOpen, setSignicatOpen] = useState(false);


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
      let nwf: WorkflowData = { ...it.workflow, state: target };

      // Seed contextual timeline entries per target if not already present.
      const hasText = (t: string) => nwf.timeline.some((l) => l.text === t);

      if (target === "avtal-vantar-signering") {
        const msg = "Objektet godkänt — uppdragsavtal skickat för signering";
        if (!hasText(msg)) nwf = logEntry(nwf, "TreLink", msg);
        nwf.avtalSentAt = nwf.avtalSentAt ?? new Date().toISOString();
      }
      if (target === "hyresvard-notifiering") {
        const m1 = "Uppdragsavtal signerat av säljaren";
        const m2 = "Informationsmejl skickat till hyresvärden";
        if (!hasText(m1)) nwf = logEntry(nwf, "System", m1);
        if (!hasText(m2)) nwf = logEntry(nwf, "TreLink", m2);
        nwf.avtalSignedAt = nwf.avtalSignedAt ?? new Date().toISOString();
        nwf.hyresvardNotifieradAt = nwf.hyresvardNotifieradAt ?? new Date().toISOString();
      }
      if (target === "utkast-till-saljare") {
        const msg = "Annonstextutkast skickat för granskning";
        if (!hasText(msg)) nwf = logEntry(nwf, "TreLink", msg);
      }
      if (target === "publicerad") {
        const m1 = "Annonstexten godkänd";
        const m2 = "Annons publicerad på trelink.se";
        const m3 = "Bekräftelsemejl skickat till säljaren";
        if (!hasText(m1)) nwf = logEntry(nwf, "Säljare", m1);
        if (!hasText(m2)) nwf = logEntry(nwf, "TreLink", m2);
        if (!hasText(m3)) nwf = logEntry(nwf, "System", m3);
        nwf.publiceradAt = nwf.publiceradAt ?? new Date().toISOString();
      }

      return {
        ...it,
        status: target === "publicerad" ? "Publicerad" : "Granskas",
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
      nwf = logEntry(nwf, "TreLink", "Informationsmejl skickat till hyresvärden");
      return { ...it, workflow: nwf };
    });
    setSignicatOpen(false);
    toast("Uppdragsavtalet är signerat");
    refresh();
  };


  const approveDraft = () => {
    patchAnnons(id, (it) => {
      const now = new Date().toISOString();
      let nwf: WorkflowData = { ...it.workflow, state: "publicerad", publiceradAt: now };
      nwf = logEntry(nwf, "Säljare", "Annonstexten godkänd");
      nwf = logEntry(nwf, "TreLink", "Annons publicerad på trelink.se");
      nwf = logEntry(nwf, "System", "Bekräftelsemejl skickat till säljaren");
      return { ...it, status: "Publicerad", publiceradAt: now, workflow: nwf };
    });
    toast("Trelink publicerar din annons inom kort");
    refresh();
  };

  const sendFeedback = () => {
    if (!feedbackText.trim()) return;
    patchAnnons(id, (it) => ({
      ...it,
      workflow: logEntry(
        { ...it.workflow, state: "utkast-feedback", saljareFeedback: { msg: feedbackText, at: new Date().toISOString() } },
        "Säljare",
        `Lämnade feedback på annonsutkastet`,
      ),
    }));
    toast("Feedback skickad — Trelink återkommer med en reviderad version");
    setFeedbackText("");
    setShowFeedback(false);
    refresh();
  };

  const draftText =
    "Välskött kontorslokal på 80 m² i centrala Stockholm. Lokalen är fullt utrustad och har en flexibel hyrestid. Passar verksamhet inom administration, konsulting eller lätt service. Överlåtelse av inkråm. Hyra: 18 000 kr/mån. Tillträde enligt överenskommelse.";

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
        </select>
      </div>

      {/* Flödesindikator */}
      <WireBox className="mb-6" variant="dashed">
        <div className="flex flex-wrap items-center gap-3">
          {flowSteps.map((s, i) => {
            const state = i < currentStep ? "done" : i === currentStep ? "active" : "pending";
            return (
              <div key={s.state} className="flex items-center gap-2">
                <StatusDot state={state} />
                <span className={`text-xs ${i === currentStep ? "font-semibold" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {i < flowSteps.length - 1 && <span className="text-muted-foreground/40">›</span>}
              </div>
            );
          })}
        </div>
      </WireBox>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* STEP 1 · Granskning */}
          {st === "granskas" && (
            <>
              <WireBox label="Status">
                <div className="text-sm">🔒 Låst för redigering under granskning.</div>
                <Annotation>
                  <span className="mt-2 block">TRELINK ÅTERKOMMER MED BESKED, KOMPLETTERING ELLER UPPDRAGSAVTAL.</span>
                </Annotation>
              </WireBox>
            </>
          )}

          {/* STEP 2 · Uppdragsavtal */}
          {st === "avtal-vantar-signering" && (
            <>
              <WireBox label="Status">
                <div className="text-sm">📄 Uppdragsavtal väntar på din signatur.</div>
                <Annotation>
                  <span className="mt-2 block">AVTALET HAR SKICKATS TILL DIN E-POST OCH FINNS ÄVEN HÄR I PLATTFORMEN.</span>
                </Annotation>
              </WireBox>

              <WireBox label="Signera uppdragsavtal">
                <p className="text-sm">
                  Trelink har granskat och godkänt ditt objekt. Innan vi kan gå vidare behöver du signera
                  uppdragsavtalet. Det reglerar villkoren för förmedlingsuppdraget.
                </p>
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
                <div className="text-sm">📬 Informationsmejl skickat till hyresvärden.</div>
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
                  <Annotation>Hyresvärd e-post</Annotation>
                  <div className="mt-1 text-sm">{item.draft?.hyresvardEmail || "—"}</div>
                </div>
                <button
                  onClick={() => toast("Uppdatering av hyresvärdens e-post är inte aktiv i demot")}
                  className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Uppdatera hyresvärdens e-post
                </button>
              </WireBox>
            </>
          )}

          {/* STEP 4 · Annonsutkast */}
          {(st === "utkast-till-saljare" || st === "utkast-feedback") && (
            <>
              <WireBox label="Status">
                <div className="text-sm">✍️ Annonstexten är klar för ditt godkännande.</div>
                <Annotation>
                  <span className="mt-2 block">
                    TRELINK HAR SKRIVIT ANNONSTEXTEN BASERAT PÅ DITT UNDERLAG. GRANSKA OCH GODKÄNN — ELLER LÄMNA FEEDBACK.
                  </span>
                </Annotation>
              </WireBox>

              <WireBox label="Annonstextutkast · skrivet av TreLink">
                <div
                  className="border border-foreground/20 p-4 text-sm italic"
                  style={{ background: "#F5F5F4", fontSize: 14 }}
                >
                  {draftText}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <WireBtn className="w-full sm:w-auto" onClick={approveDraft}>
                    Godkänn annonstexten
                  </WireBtn>
                  <WireBtn variant="secondary" onClick={() => setShowFeedback((v) => !v)}>
                    Lämna feedback
                  </WireBtn>
                </div>

                {showFeedback && (
                  <div className="mt-4">
                    <Annotation>Din feedback till TreLink</Annotation>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Vad vill du ändra?"
                      rows={4}
                      className="mt-1 w-full border border-dashed border-muted-foreground/50 bg-muted/20 p-3 text-sm"
                    />
                    <div className="mt-2">
                      <WireBtn onClick={sendFeedback}>Skicka feedback</WireBtn>
                    </div>
                  </div>
                )}

                {st === "utkast-feedback" && wf.saljareFeedback && (
                  <div className="mt-4 border-l-2 border-foreground/60 bg-muted/40 px-3 py-2 text-sm">
                    <Annotation>Din feedback</Annotation>
                    <div className="mt-1">{wf.saljareFeedback.msg}</div>
                  </div>
                )}
              </WireBox>
            </>
          )}

          {/* STEP 5 · Publicerad */}
          {st === "publicerad" && (
            <>
              <WireBox label="Status">
                <div className="text-sm">✅ Din annons är nu live.</div>
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
                  <div className="mt-1 text-sm text-muted-foreground">
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
            <ul className="space-y-3">
              {(wf.timeline ?? []).map((l, i) => (
                <li key={i} className="border-l-2 border-foreground/40 pl-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date(l.ts).toLocaleString("sv-SE")} · {l.vem}
                  </div>
                  <div className="text-sm">{l.text}</div>
                </li>
              ))}
            </ul>
          </WireBox>
        </div>
      </div>
    </AppLayout>
  );
}

function Field({ k, v }: { k: string; v?: string }) {
  return (
    <div className="border-b border-dashed border-muted-foreground/30 pb-2">
      <Annotation>{k}</Annotation>
      <div className="mt-1">{v || "—"}</div>
    </div>
  );
}
