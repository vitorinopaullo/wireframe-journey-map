import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TreLinkLayout } from "@/components/layouts/TreLinkLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { getAnnons, patchAnnons, logEntry, stateLabel, type WorkflowState } from "@/lib/annons-workflow";
import { docsByCat, FALTGRUPP_TYPER, type CatId, type DocSpec, type DocState } from "@/lib/annons-model";

export const Route = createFileRoute("/george/annonser/$id")({
  component: ReviewDetail,
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

const TAGG_FALT: { key: string; label: string }[] = [
  { key: "usp", label: "Vad gör verksamheten unik" },
  { key: "kundunderlag", label: "Kundunderlag" },
  { key: "laget", label: "Läget" },
  { key: "potential", label: "Utvecklingsmöjligheter" },
  { key: "anledning", label: "Anledning till försäljning" },
];

const GRUPP_NAMN: Record<string, string> = {
  Kontor: "Kontor",
  Butik: "Butik",
  Lager: "Lager",
  Servering: "Mat och dryck",
  Frisor: "Skönhetssalong",
};

type GruppFalt = { key: string; label: string; isTags?: boolean };

const GRUPP_FALT: Record<string, GruppFalt[]> = {
  Kontor: [
    { key: "taggar", label: "Taggar (läge/interiör/planlösning/ekonomi/teknisk info)", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Butik: [
    { key: "taggar", label: "Taggar (läge/interiör/planlösning/ekonomi/teknisk info)", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Lager: [
    { key: "taggar", label: "Taggar (läge/interiör/planlösning/ekonomi/teknisk info)", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Frisor: [
    { key: "underrubrik", label: "Typ av verksamhet" },
    { key: "taggar", label: "Taggar (läge/interiör/planlösning/ekonomi)", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Servering: [
    { key: "underrubrik", label: "Typ av verksamhet" },
    { key: "taggar", label: "Taggar (läge/interiör/planlösning/ekonomi)", isTags: true },
    { key: "typAvKok", label: "Köksteknik", isTags: true },
    { key: "utvecklingsmojlighet", label: "Utvecklingsmöjlighet", isTags: true },
    { key: "anledningTillForsaljning", label: "Anledning till försäljning", isTags: true },
    { key: "myndighetskrav", label: "Myndighetskrav", isTags: true },
    { key: "ovrigInfo", label: "Övrig info" },
  ],
};

function groupForTyp(typ: string): string | undefined {
  return Object.keys(FALTGRUPP_TYPER).find((g) => FALTGRUPP_TYPER[g].includes(typ));
}

function Field({ k, v }: { k: string; v?: string }) {
  return (
    <div className="border-b border-dashed border-muted-foreground/30 pb-2">
      <Annotation>{k}</Annotation>
      <div className="mt-1 text-sm">{v || "—"}</div>
    </div>
  );
}

function TagsField({ k, v }: { k: string; v?: string }) {
  const tags = v ? v.split(",").map((t) => t.trim()).filter(Boolean) : [];
  return (
    <div className="border-b border-dashed border-muted-foreground/30 pb-2">
      <Annotation>{k}</Annotation>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {tags.length > 0 ? tags.map((t) => <WireTag key={t}>{t}</WireTag>) : <span className="text-sm">—</span>}
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

const avvisningsOrsaker = [
  "Annonsen strider mot våra publiceringsregler",
  "Dubblettannons — finns redan publicerad",
  "Säljaren saknar rätt att överlåta verksamheten",
  "Bristfälligt underlag trots komplettering",
];

function ReviewDetail() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<any | null>(null);
  const [tick, setTick] = useState(0);
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [kompletteringText, setKompletteringText] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    setItem(getAnnons(id) ?? null);
  }, [id, tick]);

  const refresh = () => setTick((t) => t + 1);

  const draft = item?.draft ?? {};
  const catId: CatId | undefined = draft.cat;
  const specs: DocSpec[] = catId ? docsByCat[catId] ?? [] : [];
  const docsState: Record<string, DocState> = draft.docs ?? {};

  const stats = useMemo(() => {
    const obligatoriska = specs.filter((s) => s.required);
    const stateOf = (name: string): DocState => docsState[name] ?? "saknas";
    return {
      total: specs.length,
      ok: specs.filter((s) => stateOf(s.name) === "godkant").length,
      kompl: specs.filter((s) => stateOf(s.name) === "komplettera").length,
      obligatoriskaOk: obligatoriska.filter((s) => stateOf(s.name) === "godkant").length,
      obligatoriskaTotal: obligatoriska.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const st: WorkflowState | null = item?.workflow?.state ?? null;
  const canApprove =
    st === "granskas" && stats.obligatoriskaTotal > 0 && stats.obligatoriskaOk === stats.obligatoriskaTotal && stats.kompl === 0;

  const onboarding = readOnboardingSaljare();
  const valdaGrupper = Array.from(
    new Set(
      (draft.verksamhet ? String(draft.verksamhet).split(",") : [])
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((typ: string) => groupForTyp(typ))
        .filter(Boolean) as string[],
    ),
  );

  if (!item) {
    return (
      <TreLinkLayout>
        <PageHeader eyebrow="TreLink" title="Ärendet hittades inte" />
        <Link to="/george/annonser" className="text-sm underline">← Tillbaka</Link>
      </TreLinkLayout>
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
    if (!kompletteringText.trim()) return;
    patchAnnons(id, (it) => ({
      ...it,
      draft: { ...it.draft, docs: { ...it.draft?.docs, [docName]: "komplettera" } },
      workflow: logEntry(
        it.workflow,
        "TreLink",
        `Begärde komplettering på ${docName}: "${kompletteringText.slice(0, 60)}${kompletteringText.length > 60 ? "…" : ""}"`,
      ),
    }));
    setKompletteringText("");
    setActiveDoc(null);
    refresh();
  };

  const approveUnderlag = () => {
    if (!canApprove) return;
    patchAnnons(id, (it) => {
      const now = new Date().toISOString();
      return {
        ...it,
        workflow: logEntry(
          logEntry({ ...it.workflow, state: "avtal-vantar-signering", avtalSentAt: now }, "TreLink", "Godkände underlaget"),
          "System",
          "Uppdragsavtal skickat till säljaren via e-post (Signicat-länk)",
        ),
      };
    });
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

  return (
    <TreLinkLayout>
      <PageHeader
        eyebrow={`TreLink · granskning #${id}`}
        title={item.titel ?? "Okänd annons"}
        subtitle={`Status: ${st ? stateLabel[st] : "okänd"}`}
        right={
          <div className="flex items-center gap-2">
            <Link
              to="/george/annons-flode/$id"
              params={{ id }}
              className="border border-foreground bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:opacity-80"
            >
              Öppna flöde →
            </Link>
            <Link to="/george/annonser" className="text-xs text-muted-foreground underline hover:text-foreground">
              ← Tillbaka till inkorgen
            </Link>
          </div>
        }
      />

      {/* Progress + beslutsknappar */}
      <WireBox className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Granskningsstatus</div>
            <div className="mt-1 text-lg font-semibold">
              {stats.obligatoriskaOk}/{stats.obligatoriskaTotal} obligatoriska godkända
              {stats.kompl > 0 && <span className="ml-3 text-sm text-muted-foreground">· {stats.kompl} väntar på säljare</span>}
            </div>
            <div className="mt-2 h-2 w-full max-w-md border border-foreground/30 bg-background">
              <div
                className="h-full bg-foreground"
                style={{ width: `${(stats.obligatoriskaOk / Math.max(stats.obligatoriskaTotal, 1)) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <WireBtn variant="ghost" onClick={() => setRejectOpen((v) => !v)}>Avvisa annons</WireBtn>
            <button
              disabled={!canApprove}
              onClick={approveUnderlag}
              className={`border px-4 py-2 text-sm font-medium ${
                canApprove
                  ? "border-foreground bg-foreground text-background hover:opacity-80"
                  : "border-muted-foreground/30 bg-muted/30 text-muted-foreground cursor-not-allowed"
              }`}
            >
              {canApprove ? "Godkänn underlag — skicka uppdragsavtal →" : "Godkänn underlag (lås upp först)"}
            </button>
          </div>
        </div>
        {!canApprove && (
          <Annotation>
            <span className="mt-3 block">
              ↳ För att godkänna: alla obligatoriska dokument godkända, inga öppna kompletteringar.
            </span>
          </Annotation>
        )}
      </WireBox>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dokumentlistan */}
        <div className="lg:col-span-2 space-y-3">
          <Annotation>Granska varje dokument separat · beslut loggas direkt</Annotation>
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
                          onClick={() => setKompletteringText(m)}
                          className="border border-dashed border-muted-foreground/50 px-2 py-1 text-left font-mono text-[10px] text-muted-foreground hover:border-foreground hover:text-foreground"
                        >
                          + {m.slice(0, 40)}…
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={kompletteringText}
                      onChange={(e) => setKompletteringText(e.target.value)}
                      rows={3}
                      placeholder="Skriv tydligt vad säljaren ska göra. Detta skickas direkt till säljaren."
                      className="w-full border border-foreground/50 bg-background px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <WireBtn variant="ghost" onClick={() => { setActiveDoc(null); setKompletteringText(""); }}>Avbryt</WireBtn>
                      <button
                        disabled={!kompletteringText.trim()}
                        onClick={() => requestDocKomplettering(d.name)}
                        className={`border px-4 py-2 text-sm font-medium ${kompletteringText.trim() ? "border-foreground bg-foreground text-background hover:opacity-80" : "border-muted-foreground/30 text-muted-foreground"}`}
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

        {/* Sidopanel: logg */}
        <div className="space-y-4">
          <WireBox label="Beslutslogg · synlig för säljaren">
            <ul className="space-y-3">
              {(item.workflow?.timeline ?? []).map((l: any, i: number) => (
                <li key={i} className="border-l-2 border-foreground/40 pl-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date(l.ts).toLocaleString("sv-SE")} · {l.vem}
                  </div>
                  <div className="text-sm">{l.text}</div>
                </li>
              ))}
            </ul>
            <Annotation>
              <span className="mt-3 block">↳ Inget hemligt här. Säljaren ser exakt samma logg i sin vy.</span>
            </Annotation>
          </WireBox>

          <WireBox label="Tangentbordsgenvägar" variant="dashed">
            <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
              <li><kbd className="border border-muted-foreground/40 px-1">G</kbd> godkänn aktivt dok</li>
              <li><kbd className="border border-muted-foreground/40 px-1">K</kbd> begär komplettering</li>
              <li><kbd className="border border-muted-foreground/40 px-1">J/K</kbd> nästa/föregående</li>
              <li><kbd className="border border-muted-foreground/40 px-1">⌘↵</kbd> godkänn underlag</li>
            </ul>
          </WireBox>
        </div>
      </div>

      {/* Annonsens underlag — all data säljaren fyllt i */}
      <div className="mt-8 space-y-6">
        <Annotation>Annonsens underlag</Annotation>

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

        <WireBox label="Grunduppgifter">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field k="Ort" v={draft.ort} />
            <Field k="Adress" v={draft.adress} />
            <Field k="Yta" v={draft.yta ? `${draft.yta} m²` : undefined} />
            <Field k="Verksamhet/Verksamhetstyp" v={draft.verksamhet} />
            <Field k="Org.nr" v={draft.orgnr} />
          </div>
        </WireBox>

        <WireBox label="Taggar & underlag">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {TAGG_FALT.map((f) => (
              <Field key={f.key} k={f.label} v={draft[f.key]} />
            ))}
          </div>
        </WireBox>

        {valdaGrupper.map((grupp) => (
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
        ))}

        <WireBox label="Hyresvärd & BRF">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field k="Hyresvärd namn" v={draft.hyresvardNamn} />
            <Field k="Hyresvärd e-post" v={draft.hyresvardEmail} />
            <Field k="Hyresvärd telefon" v={draft.hyresvardTel} />
            <Field k="BRF-kontaktperson" v={draft.brfKontakt} />
          </div>
        </WireBox>
      </div>
    </TreLinkLayout>
  );
}

function DocStateBadge({ state }: { state: DocState }) {
  const map: Record<DocState, { label: string; filled: boolean }> = {
    "saknas": { label: "SAKNAS", filled: false },
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
