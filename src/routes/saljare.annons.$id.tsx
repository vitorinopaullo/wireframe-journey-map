import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";
import {
  getAnnons,
  logEntry,
  patchAnnons,
  stateHint,
  stateLabel,
  type WorkflowState,
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

function SellerAnnonsDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any | null>(null);
  const [tick, setTick] = useState(0);

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

  const wf = item.workflow;
  const st: WorkflowState = wf?.state ?? "granskas";
  const currentStep = stateOrder[st];
  const refresh = () => setTick((t) => t + 1);

  const supplementInfo = () => {
    const msg = prompt("Kort beskrivning av det du har kompletterat/uppdaterat:");
    if (!msg) return;
    patchAnnons(id, (it) => ({
      ...it,
      status: "Granskas",
      workflow: logEntry(
        { ...it.workflow, state: "granskas", komplettering: undefined },
        "Säljare",
        `Kompletterade underlaget: ${msg}`,
      ),
    }));
    refresh();
  };

  const signAvtal = () => {
    if (!confirm("Öppna Signicat och signera med BankID? (demo)")) return;
    patchAnnons(id, (it) => ({
      ...it,
      workflow: logEntry(
        {
          ...it.workflow,
          state: "hyresvard-notifiering",
          avtalSignedAt: new Date().toISOString(),
        },
        "Säljare",
        "Signerade uppdragsavtal via BankID (Signicat)",
      ),
    }));
    refresh();
  };

  const approveDraft = () => {
    patchAnnons(id, (it) => {
      const now = new Date().toISOString();
      return {
        ...it,
        status: "Publicerad",
        publiceradAt: now,
        workflow: logEntry(
          logEntry(
            { ...it.workflow, state: "publicerad", publiceradAt: now },
            "Säljare",
            "Godkände annonsutkastet",
          ),
          "System",
          "Statusmail skickat till säljaren · annonsen är live",
        ),
      };
    });
    refresh();
  };

  const submitFeedback = () => {
    const msg = prompt("Din feedback till TreLink på annonsutkastet:");
    if (!msg) return;
    patchAnnons(id, (it) => ({
      ...it,
      workflow: logEntry(
        {
          ...it.workflow,
          state: "utkast-feedback",
          saljareFeedback: { msg, at: new Date().toISOString() },
        },
        "Säljare",
        `Lämnade feedback på annonsutkastet: "${msg.slice(0, 80)}${msg.length > 80 ? "…" : ""}"`,
      ),
    }));
    refresh();
  };

  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow={`Säljarläge · ärende ${id}`}
        title={item.titel}
        subtitle={stateHint[st]}
        right={
          <div className="flex flex-col items-end gap-2">
            <WireTag>{stateLabel[st]}</WireTag>
            <Link to="/saljare/mina-annonser" className="text-xs text-muted-foreground underline hover:text-foreground">
              ← Mina annonser
            </Link>
          </div>
        }
      />

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
          {/* Åtgärdspanel per state */}
          {st === "granskas" && (
            <WireBox label="Status">
              <div className="text-sm">🔒 Låst för redigering under granskning.</div>
              <Annotation>
                <span className="mt-2 block">TreLink återkommer med besked, komplettering eller uppdragsavtal.</span>
              </Annotation>
            </WireBox>
          )}

          {st === "komplettering" && (
            <WireBox label="TreLink har begärt komplettering">
              <div className="border-l-2 border-foreground/60 bg-muted/40 px-3 py-2 text-sm">
                {wf.komplettering?.message ?? "Se detaljer nedan."}
              </div>
              <div className="mt-4 flex gap-2">
                <WireBtn to="/saljare/skapa-annons" params={{}} onClick={() => navigate({ to: "/saljare/skapa-annons", search: { edit: id } })}>
                  Öppna & komplettera →
                </WireBtn>
                <WireBtn variant="secondary" onClick={supplementInfo}>
                  Snabbsvar utan att öppna wizarden
                </WireBtn>
              </div>
            </WireBox>
          )}

          {st === "avvisad" && (
            <WireBox label="Ärendet är stängt">
              <div className="border-l-2 border-foreground bg-muted/40 px-3 py-2 text-sm">
                <div className="font-medium">{wf.avvisadReason?.orsak ?? "Avvisad"}</div>
                {wf.avvisadReason?.note && <div className="mt-1">{wf.avvisadReason.note}</div>}
              </div>
              <Annotation>
                <span className="mt-3 block">Kontakta support om du vill diskutera beslutet.</span>
              </Annotation>
            </WireBox>
          )}

          {st === "avtal-vantar-signering" && (
            <WireBox label="Uppdragsavtal — väntar på din signering">
              <p className="text-sm">
                TreLink har skickat uppdragsavtalet till din e-post. Du kan också signera direkt här.
                Signering sker via <strong>Signicat</strong> med BankID.
              </p>
              <div className="mt-3 border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-xs font-mono">
                📄 Uppdragsavtal_{id}.pdf · skickat {wf.avtalSentAt ? new Date(wf.avtalSentAt).toLocaleString("sv-SE") : "nu"}
              </div>
              <div className="mt-4 flex gap-2">
                <WireBtn onClick={signAvtal}>Signera med BankID →</WireBtn>
                <WireBtn variant="secondary">Ladda ner PDF</WireBtn>
              </div>
            </WireBox>
          )}

          {st === "hyresvard-notifiering" && (
            <WireBox label="TreLink kontaktar hyresvärden">
              <p className="text-sm">
                Uppdragsavtalet är signerat ✓ TreLink skickar nu ett informationsmail till hyresvärden på{" "}
                <strong>{item.draft?.hyresvardEmail ?? "hyresvärdens e-post"}</strong> om att en överlåtelseprocess
                har påbörjats för lokalen.
              </p>
              <Annotation>
                <span className="mt-2 block">Du behöver inte göra något här. Nästa steg är annonsutkastet.</span>
              </Annotation>
            </WireBox>
          )}

          {(st === "utkast-till-saljare" || st === "utkast-feedback") && wf.utkast && (
            <WireBox label="Annonsutkast från TreLink">
              <div className="space-y-3 text-sm">
                <div>
                  <Annotation>Rubrik</Annotation>
                  <div className="mt-1 font-medium">{wf.utkast.rubrik}</div>
                </div>
                <div>
                  <Annotation>Pris</Annotation>
                  <div className="mt-1 font-medium">{wf.utkast.pris}</div>
                </div>
                <div>
                  <Annotation>Beskrivning</Annotation>
                  <div className="mt-1 whitespace-pre-line">{wf.utkast.beskrivning}</div>
                </div>
              </div>
              {st === "utkast-feedback" && wf.saljareFeedback && (
                <div className="mt-4 border-l-2 border-foreground/60 bg-muted/40 px-3 py-2 text-sm">
                  <Annotation>Din feedback</Annotation>
                  <div className="mt-1">{wf.saljareFeedback.msg}</div>
                </div>
              )}
              {st === "utkast-till-saljare" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <WireBtn onClick={approveDraft}>Godkänn & publicera →</WireBtn>
                  <WireBtn variant="secondary" onClick={submitFeedback}>Lämna feedback</WireBtn>
                </div>
              )}
              {st === "utkast-feedback" && (
                <Annotation>
                  <span className="mt-3 block">TreLink justerar och återkommer med ett nytt utkast.</span>
                </Annotation>
              )}
            </WireBox>
          )}

          {st === "publicerad" && (
            <WireBox label="Annonsen är live">
              <p className="text-sm">
                🎉 Annonsen publicerades{" "}
                {wf.publiceradAt ? new Date(wf.publiceradAt).toLocaleString("sv-SE") : "nyss"}.
                Ett bekräftelsemail har skickats till dig.
              </p>
              <div className="mt-3 flex gap-2">
                <Link to="/annons/$id" params={{ id }}>
                  <WireBtn>Visa publicerad annons →</WireBtn>
                </Link>
                <Link to="/saljare/intressenter">
                  <WireBtn variant="secondary">Intressenter</WireBtn>
                </Link>
              </div>
            </WireBox>
          )}

          {/* Underlagssammanfattning */}
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
              {(wf.timeline ?? []).map((l: any, i: number) => (
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
