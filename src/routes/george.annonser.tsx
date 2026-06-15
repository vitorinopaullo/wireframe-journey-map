import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GeorgeLayout } from "@/components/layouts/GeorgeLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/annonser")({
  component: ReviewListings,
});

type Status = "ny" | "pagar" | "inväntar-säljare" | "klar-publicera" | "avvisad";
type Priority = "hög" | "medel" | "låg";

type QueueItem = {
  id: string;
  titel: string;
  kat: "Inkråm" | "Lokal" | "Bolag";
  saljare: string;
  inkommen: string; // ISO
  status: Status;
  priority: Priority;
  docsTotal: number;
  docsOk: number;
  docsMissing: number;
  slaHours: number; // tid kvar innan SLA bryts
  assignedTo: string | null;
  senasteHandelse: string;
};

const initial: QueueItem[] = [
  { id: "9",  titel: "Frisörsalong · Vasastan", kat: "Inkråm", saljare: "S-104", inkommen: "2025-06-14T09:12", status: "ny",            priority: "hög",   docsTotal: 4, docsOk: 4, docsMissing: 0, slaHours: 6,  assignedTo: null,    senasteHandelse: "Säljare skickade in för granskning" },
  { id: "10", titel: "Café · Linné",            kat: "Inkråm", saljare: "S-122", inkommen: "2025-06-13T16:40", status: "inväntar-säljare", priority: "medel", docsTotal: 5, docsOk: 3, docsMissing: 1, slaHours: 28, assignedTo: "George", senasteHandelse: "Begärt komplettering: hyresavtal" },
  { id: "11", titel: "Butikslokal · Malmö",     kat: "Lokal",  saljare: "S-77",  inkommen: "2025-06-14T07:55", status: "pagar",         priority: "medel", docsTotal: 3, docsOk: 2, docsMissing: 0, slaHours: 18, assignedTo: "George", senasteHandelse: "Påbörjad granskning · 1 dok kvar" },
  { id: "12", titel: "SaaS-bolag B2B",          kat: "Bolag",  saljare: "S-201", inkommen: "2025-06-12T11:00", status: "ny",            priority: "hög",   docsTotal: 7, docsOk: 5, docsMissing: 2, slaHours: -2, assignedTo: null,    senasteHandelse: "SLA bruten · väntar 50h" },
  { id: "13", titel: "Restaurang · SoFo",       kat: "Inkråm", saljare: "S-133", inkommen: "2025-06-14T08:10", status: "klar-publicera", priority: "låg",   docsTotal: 6, docsOk: 6, docsMissing: 0, slaHours: 12, assignedTo: "George", senasteHandelse: "Allt godkänt · redo att publicera" },
];

const filters: { id: "alla" | Status; label: string }[] = [
  { id: "alla", label: "Alla" },
  { id: "ny", label: "Nya" },
  { id: "pagar", label: "Pågår" },
  { id: "inväntar-säljare", label: "Väntar på säljare" },
  { id: "klar-publicera", label: "Klar att publicera" },
];

function ReviewListings() {
  const [filter, setFilter] = useState<"alla" | Status>("alla");
  const [onlyMine, setOnlyMine] = useState(false);

  const list = useMemo(() => {
    return initial
      .filter((q) => (filter === "alla" ? true : q.status === filter))
      .filter((q) => (onlyMine ? q.assignedTo === "George" : true))
      .sort((a, b) => {
        // SLA brott först, sedan prioritet, sedan äldst
        if ((a.slaHours < 0) !== (b.slaHours < 0)) return a.slaHours - b.slaHours;
        const p = { hög: 0, medel: 1, låg: 2 };
        if (p[a.priority] !== p[b.priority]) return p[a.priority] - p[b.priority];
        return a.inkommen.localeCompare(b.inkommen);
      });
  }, [filter, onlyMine]);

  const counts = useMemo(() => ({
    ny: initial.filter((q) => q.status === "ny").length,
    pagar: initial.filter((q) => q.status === "pagar").length,
    väntar: initial.filter((q) => q.status === "inväntar-säljare").length,
    klar: initial.filter((q) => q.status === "klar-publicera").length,
    sla: initial.filter((q) => q.slaHours < 0).length,
  }), []);

  return (
    <GeorgeLayout>
      <PageHeader
        eyebrow="George · adminzon"
        title="Inkorg · granska annonser"
        subtitle="Inget publiceras ogranskat. Varje dokument godkänns separat. SLA: nya annonser granskas inom 24h."
        right={
          <div className="flex items-center gap-2">
            <WireTag>{counts.ny} nya</WireTag>
            <WireTag>{counts.pagar} pågår</WireTag>
            {counts.sla > 0 && <span className="border border-foreground bg-foreground text-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">⚠ {counts.sla} SLA bruten</span>}
          </div>
        }
      />

      {/* KPI-rad */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Att granska" value={counts.ny + counts.pagar} hint="ny + pågår" />
        <Kpi label="Väntar på säljare" value={counts.väntar} hint="komplettering begärd" />
        <Kpi label="Klar att publicera" value={counts.klar} hint="ett klick kvar" />
        <Kpi label="SLA-brott" value={counts.sla} hint="åtgärda först" warn={counts.sla > 0} />
      </div>

      {/* Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-y border-dashed border-muted-foreground/40 py-3">
        <Annotation>Filter:</Annotation>
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
              filter === f.id ? "border-foreground bg-foreground text-background" : "border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="accent-foreground" />
          Endast tilldelat mig
        </label>
      </div>

      <div className="space-y-3">
        {list.length === 0 && (
          <WireBox variant="dashed">
            <Annotation>Inga ärenden matchar filtret · bra jobbat.</Annotation>
          </WireBox>
        )}
        {list.map((q) => (
          <WireBox key={q.id} className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <WireTag>{q.kat}</WireTag>
                <StatusBadge status={q.status} />
                <PriorityBadge p={q.priority} />
                <SLABadge hours={q.slaHours} />
                <span className="font-mono text-[10px] text-muted-foreground">#{q.id} · säljare {q.saljare}</span>
              </div>
              <h3 className="font-medium">{q.titel}</h3>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <span>Dokument: {q.docsOk}/{q.docsTotal} godkända{q.docsMissing > 0 ? ` · ${q.docsMissing} saknas` : ""}</span>
                <span>Inkommen: {new Date(q.inkommen).toLocaleString("sv-SE")}</span>
                <span>Tilldelad: {q.assignedTo ?? "— ingen —"}</span>
              </div>
              <Annotation>↳ senast: {q.senasteHandelse}</Annotation>
            </div>
            <div className="flex shrink-0 flex-col gap-2 md:items-end">
              <Link
                to="/george/annonser/$id"
                params={{ id: q.id }}
                className="border border-foreground bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-80"
              >
                {q.status === "klar-publicera" ? "Publicera →" : "Öppna granskning →"}
              </Link>
              {q.assignedTo === null && (
                <WireBtn variant="ghost" className="text-xs">Ta ärendet</WireBtn>
              )}
            </div>
          </WireBox>
        ))}
      </div>

      <Annotation>
        <span className="mt-6 block">
          Alla beslut loggas med tidsstämpel och syns för säljaren. Komplettering måste ha motivering. Avvisning kräver mall + fri text.
        </span>
      </Annotation>
    </GeorgeLayout>
  );
}

function Kpi({ label, value, hint, warn }: { label: string; value: number; hint?: string; warn?: boolean }) {
  return (
    <div className={`border p-3 ${warn ? "border-foreground bg-foreground/5" : "border-foreground/30 bg-background"}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl">{value}</div>
      {hint && <div className="font-mono text-[10px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    "ny": "NY",
    "pagar": "PÅGÅR",
    "inväntar-säljare": "VÄNTAR PÅ SÄLJARE",
    "klar-publicera": "KLAR · PUBLICERA",
    "avvisad": "AVVISAD",
  };
  const filled = status === "klar-publicera" || status === "ny";
  return (
    <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${filled ? "border-foreground bg-foreground text-background" : "border-foreground/50 text-foreground"}`}>
      {map[status]}
    </span>
  );
}

function PriorityBadge({ p }: { p: Priority }) {
  if (p === "låg") return null;
  return (
    <span className="border border-dashed border-muted-foreground/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {p === "hög" ? "↑ hög prio" : "· medel"}
    </span>
  );
}

function SLABadge({ hours }: { hours: number }) {
  if (hours < 0) {
    return <span className="border border-foreground bg-foreground text-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">⚠ SLA -{Math.abs(hours)}h</span>;
  }
  if (hours < 6) {
    return <span className="border border-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">SLA {hours}h kvar</span>;
  }
  return <span className="font-mono text-[10px] text-muted-foreground">SLA {hours}h kvar</span>;
}
