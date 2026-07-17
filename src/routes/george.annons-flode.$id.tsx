import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TreLinkLayout } from "@/components/layouts/TreLinkLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";
import {
  getAnnons,
  logEntry,
  patchAnnons,
  stateLabel,
  type AnnonsUtkast,
  type WorkflowState,
} from "@/lib/annons-workflow";

export const Route = createFileRoute("/george/annons-flode/$id")({
  component: TreLinkFlow,
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

function TreLinkFlow() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<any | null>(null);
  const [tick, setTick] = useState(0);
  const [draftForm, setDraftForm] = useState<AnnonsUtkast>({
    rubrik: "",
    beskrivning: "",
    pris: "",
    sentAt: "",
  });
  const [komplText, setKomplText] = useState("");
  const [rejectOrsak, setRejectOrsak] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    setItem(getAnnons(id) ?? null);
  }, [id, tick]);

  useEffect(() => {
    if (!item) return;
    const d = item.draft ?? {};
    setDraftForm((prev) =>
      prev.rubrik || prev.beskrivning
        ? prev
        : {
            rubrik: `${d.verksamhet ?? "Verksamhet"} · ${d.ort ?? "Sverige"}`,
            pris: "1 950 000 kr",
            beskrivning: `Väletablerad ${d.verksamhet ?? "verksamhet"} i ${d.ort ?? "toppläge"} om ${d.yta ?? "—"} m². ${d.usp ?? ""}\n\nKundunderlag: ${d.kundunderlag ?? "—"}\nLäge: ${d.laget ?? "—"}`,
            sentAt: "",
          },
    );
  }, [item]);

  if (!item) {
    return (
      <TreLinkLayout>
        <PageHeader eyebrow="TreLink" title="Ärendet hittades inte" />
        <Link to="/george/annonser" className="text-sm underline">← Tillbaka</Link>
      </TreLinkLayout>
    );
  }

  const wf = item.workflow ?? { state: "granskas", timeline: [] };
  const st: WorkflowState = wf.state;
  const currentStep = stateOrder[st];
  const refresh = () => setTick((t) => t + 1);

  const requestKomplettering = () => {
    if (!komplText.trim()) return;
    patchAnnons(id, (it) => ({
      ...it,
      status: "Väntar på säljare",
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
    refresh();
  };

  const approve = () => {
    patchAnnons(id, (it) => {
      const now = new Date().toISOString();
      return {
        ...it,
        status: "Uppdragsavtal skickat",
        workflow: logEntry(
          logEntry(
            { ...it.workflow, state: "avtal-vantar-signering", avtalSentAt: now },
            "TreLink",
            "Godkände underlaget",
          ),
          "System",
          "Uppdragsavtal skickat till säljaren via e-post (Signicat-länk)",
        ),
      };
    });
    refresh();
  };

  const reject = () => {
    if (!rejectOrsak) return;
    patchAnnons(id, (it) => ({
      ...it,
      status: "Avvisad",
      workflow: logEntry(
        {
          ...it.workflow,
          state: "avvisad",
          avvisadReason: { orsak: rejectOrsak, note: rejectNote, at: new Date().toISOString() },
        },
        "TreLink",
        `Avvisade ärendet · ${rejectOrsak}${rejectNote ? ` — ${rejectNote}` : ""}`,
      ),
    }));
    setRejectOrsak("");
    setRejectNote("");
    refresh();
  };

  const notifyLandlord = () => {
    patchAnnons(id, (it) => {
      const now = new Date().toISOString();
      return {
        ...it,
        status: "Annonsutkast pågår",
        workflow: logEntry(
          logEntry(
            { ...it.workflow, state: "utkast-till-saljare", hyresvardNotifieradAt: now },
            "TreLink",
            `Skickade informationsmail till hyresvärden (${it.draft?.hyresvardEmail ?? "e-post saknas"})`,
          ),
          "System",
          "TreLink kan nu ta fram annonsutkast",
        ),
      };
    });
    refresh();
  };

  const sendDraftToSeller = () => {
    if (!draftForm.rubrik.trim() || !draftForm.beskrivning.trim()) return;
    patchAnnons(id, (it) => ({
      ...it,
      status: "Utkast hos säljare",
      workflow: logEntry(
        {
          ...it.workflow,
          state: "utkast-till-saljare",
          utkast: { ...draftForm, sentAt: new Date().toISOString() },
        },
        "TreLink",
        "Skickade annonsutkast till säljaren för godkännande",
      ),
    }));
    refresh();
  };

  const publish = () => {
    patchAnnons(id, (it) => {
      const now = new Date().toISOString();
      return {
        ...it,
        status: "Publicerad",
        publiceradAt: now,
        workflow: logEntry(
          logEntry(
            { ...it.workflow, state: "publicerad", publiceradAt: now },
            "TreLink",
            "Publicerade annonsen",
          ),
          "System",
          "Statusmail skickat till säljaren · annonsen är live",
        ),
      };
    });
    refresh();
  };

  return (
    <TreLinkLayout>
      <PageHeader
        eyebrow={`TreLink · flöde #${id}`}
        title={item.titel}
        subtitle={`Status: ${stateLabel[st]}`}
        right={
          <Link to="/george/annonser" className="text-xs text-muted-foreground underline hover:text-foreground">
            ← Inkorgen
          </Link>
        }
      />

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
          {st === "granskas" && (
            <>
              <WireBox label="Beslut · granskning">
                <p className="text-sm mb-3">
                  Underlaget är komplett? Godkänn för att skicka uppdragsavtal till säljaren.
                  Om något saknas — begär komplettering. Om ärendet inte är seriöst — avvisa.
                </p>
                <div className="flex flex-wrap gap-2">
                  <WireBtn onClick={approve}>✓ Godkänn — skicka uppdragsavtal →</WireBtn>
                  <Link to="/george/annonser/$id" params={{ id }}>
                    <WireBtn variant="secondary">Öppna dokumentgranskning</WireBtn>
                  </Link>
                </div>
              </WireBox>

              <WireBox label="Begär komplettering">
                <textarea
                  value={komplText}
                  onChange={(e) => setKomplText(e.target.value)}
                  rows={3}
                  placeholder="Vad behöver säljaren komplettera?"
                  className="w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
                />
                <div className="mt-2 flex justify-end">
                  <WireBtn variant="secondary" onClick={requestKomplettering}>
                    Skicka begäran till säljaren →
                  </WireBtn>
                </div>
              </WireBox>

              <WireBox label="Avvisa ärendet" variant="dashed">
                <select
                  value={rejectOrsak}
                  onChange={(e) => setRejectOrsak(e.target.value)}
                  className="w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
                >
                  <option value="">— välj orsak —</option>
                  <option>Ej seriöst ärende</option>
                  <option>Bristfälligt underlag trots komplettering</option>
                  <option>Strider mot publiceringsregler</option>
                  <option>Säljaren saknar rätt att överlåta</option>
                </select>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={2}
                  placeholder="Motivering till säljaren (valfritt)"
                  className="mt-2 w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
                />
                <div className="mt-2 flex justify-end">
                  <WireBtn variant="ghost" onClick={reject}>Avvisa & meddela säljare</WireBtn>
                </div>
              </WireBox>
            </>
          )}

          {st === "komplettering" && (
            <WireBox label="Väntar på säljaren">
              <div className="border-l-2 border-foreground/40 bg-muted/40 px-3 py-2 text-sm">
                <Annotation>Din begäran</Annotation>
                <div className="mt-1">{wf.komplettering?.message}</div>
              </div>
              <Annotation>
                <span className="mt-3 block">Ärendet återkommer till granskning när säljaren svarat.</span>
              </Annotation>
            </WireBox>
          )}

          {st === "avvisad" && (
            <WireBox label="Ärendet är avvisat">
              <div className="text-sm">
                <div className="font-medium">{wf.avvisadReason?.orsak}</div>
                {wf.avvisadReason?.note && <div className="mt-1">{wf.avvisadReason.note}</div>}
              </div>
            </WireBox>
          )}

          {st === "avtal-vantar-signering" && (
            <WireBox label="Uppdragsavtal skickat — väntar på säljarens signering">
              <p className="text-sm">
                Signeringslänk (Signicat) skickad till säljarens e-post{" "}
                {wf.avtalSentAt ? `${new Date(wf.avtalSentAt).toLocaleString("sv-SE")}` : ""}.
                Säljaren kan även signera direkt inne på plattformen.
              </p>
              <div className="mt-3 flex gap-2">
                <WireBtn variant="secondary">Skicka påminnelse</WireBtn>
                <WireBtn
                  variant="ghost"
                  onClick={() => {
                    // För demo: markera signerat manuellt
                    patchAnnons(id, (it) => ({
                      ...it,
                      workflow: logEntry(
                        {
                          ...it.workflow,
                          state: "hyresvard-notifiering",
                          avtalSignedAt: new Date().toISOString(),
                        },
                        "System",
                        "Signicat-callback: uppdragsavtalet är signerat",
                      ),
                    }));
                    refresh();
                  }}
                >
                  (demo) Markera som signerat
                </WireBtn>
              </div>
            </WireBox>
          )}

          {st === "hyresvard-notifiering" && (
            <WireBox label="Informera hyresvärden">
              <p className="text-sm">
                Uppdragsavtalet är signerat ✓ Skicka informationsmail till hyresvärden{" "}
                <strong>{item.draft?.hyresvardEmail ?? "e-post saknas"}</strong> om att en överlåtelseprocess
                har påbörjats för <strong>{item.draft?.adress ?? "lokalen"}</strong>.
              </p>
              <div className="mt-3 border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-xs font-mono whitespace-pre-line">
                {`Till: ${item.draft?.hyresvardEmail ?? "—"}
Ämne: Information · överlåtelseprocess påbörjad för ${item.draft?.adress ?? "lokal"}

Hej,
Genom TreLink (digital affärsmäklare) informerar vi om att en process för överlåtelse av verksamheten på ${item.draft?.adress ?? "lokalen"} har inletts av nuvarande hyresgäst.
Vi återkommer med köparförslag för godkännande när aktuell tidpunkt närmar sig.

Vänliga hälsningar,
TreLink`}
              </div>
              <div className="mt-3">
                <WireBtn onClick={notifyLandlord}>Skicka mail till hyresvärden →</WireBtn>
              </div>
            </WireBox>
          )}

          {(st === "utkast-till-saljare" || st === "utkast-feedback") && (
            <WireBox label={st === "utkast-feedback" ? "Justera utkast efter feedback" : "Skapa annonsutkast"}>
              {st === "utkast-feedback" && wf.saljareFeedback && (
                <div className="mb-3 border-l-2 border-foreground bg-muted/40 px-3 py-2 text-sm">
                  <Annotation>Säljarens feedback</Annotation>
                  <div className="mt-1">{wf.saljareFeedback.msg}</div>
                </div>
              )}
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Rubrik</span>
                  <input
                    value={draftForm.rubrik}
                    onChange={(e) => setDraftForm({ ...draftForm, rubrik: e.target.value })}
                    className="h-10 w-full border border-foreground/50 bg-background px-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Pris</span>
                  <input
                    value={draftForm.pris}
                    onChange={(e) => setDraftForm({ ...draftForm, pris: e.target.value })}
                    className="h-10 w-full border border-foreground/50 bg-background px-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Beskrivning</span>
                  <textarea
                    value={draftForm.beskrivning}
                    onChange={(e) => setDraftForm({ ...draftForm, beskrivning: e.target.value })}
                    rows={8}
                    className="w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="mt-3">
                <WireBtn onClick={sendDraftToSeller}>Skicka utkast till säljaren →</WireBtn>
              </div>
            </WireBox>
          )}

          {st === "publicerad" && (
            <WireBox label="Publicerad">
              <p className="text-sm">
                Annonsen är live sedan{" "}
                {wf.publiceradAt ? new Date(wf.publiceradAt).toLocaleString("sv-SE") : "—"}.
                Statusmail skickat till säljaren.
              </p>
              <div className="mt-3">
                <WireBtn variant="secondary" onClick={publish}>Publicera om (uppdaterat innehåll)</WireBtn>
              </div>
            </WireBox>
          )}
        </div>

        <div className="space-y-4">
          <WireBox label="Säljare & objekt">
            <div className="text-sm space-y-1">
              <div><Annotation>Ort</Annotation> {item.draft?.ort ?? "—"}</div>
              <div><Annotation>Adress</Annotation> {item.draft?.adress ?? "—"}</div>
              <div><Annotation>Verksamhet</Annotation> {item.draft?.verksamhet ?? "—"}</div>
              <div><Annotation>Hyresvärd</Annotation> {item.draft?.hyresvardEmail ?? "—"}</div>
            </div>
          </WireBox>

          <WireBox label="Timeline · synlig för säljaren">
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
    </TreLinkLayout>
  );
}
