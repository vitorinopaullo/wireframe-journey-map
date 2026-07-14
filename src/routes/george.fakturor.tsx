import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TreLinkLayout } from "@/components/layouts/TreLinkLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/fakturor")({
  component: Money,
});

type InvState = "utkast" | "skickad" | "betald-väntar-frigörande" | "frigjord" | "förfallen";

type Inv = {
  id: string;
  deal: string;
  typ: "Handpenning" | "Trelink-avgift" | "Tilläggstjänst";
  belopp: number;
  parts: string;
  state: InvState;
  date: string;
  daysOverdue?: number;
};

const initial: Inv[] = [
  { id: "F-1041", deal: "A-2041", typ: "Handpenning",    belopp: 195000, parts: "K-210 → Trelink klientmedel", state: "skickad",                  date: "14 jun" },
  { id: "F-1038", deal: "A-2038", typ: "Handpenning",    belopp: 120000, parts: "K-209 betalt · S-77 inväntar", state: "betald-väntar-frigörande", date: "13 jun" },
  { id: "F-1039", deal: "A-2039", typ: "Handpenning",    belopp:  85000, parts: "K-211 betalt · S-122 inväntar", state: "betald-väntar-frigörande", date: "12 jun" },
  { id: "F-1032", deal: "A-2032", typ: "Trelink-avgift", belopp:  79500, parts: "Faktureras vid tillträde",      state: "utkast",                   date: "—" },
  { id: "F-1020", deal: "A-2020", typ: "Trelink-avgift", belopp:  45000, parts: "Köpare 8d försenad",            state: "förfallen",                date: "5 jun", daysOverdue: 8 },
];

type Filter = "alla" | "att-frigora" | "utestaende" | "forfallna";

function Money() {
  const [filter, setFilter] = useState<Filter>("alla");
  const [selected, setSelected] = useState<string[]>([]);

  const list = useMemo(() => {
    return initial.filter((i) => {
      if (filter === "alla") return true;
      if (filter === "att-frigora") return i.state === "betald-väntar-frigörande";
      if (filter === "utestaende") return i.state === "skickad";
      if (filter === "forfallna") return i.state === "förfallen";
      return true;
    });
  }, [filter]);

  const totals = useMemo(() => {
    const klientmedel = initial.filter((i) => i.state === "betald-väntar-frigörande").reduce((s, i) => s + i.belopp, 0);
    const attFrigora = initial.filter((i) => i.state === "betald-väntar-frigörande").length;
    const utestaende = initial.filter((i) => i.state === "skickad").length;
    const forfallna  = initial.filter((i) => i.state === "förfallen").length;
    return { klientmedel, attFrigora, utestaende, forfallna };
  }, []);

  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const releaseSelected = () => {
    if (!confirm(`Frigör medel för ${selected.length} fakturor? Detta loggas och kan inte ångras automatiskt.`)) return;
    alert("Medel frigjorda (wireframe-demo). Säljarna får notis.");
    setSelected([]);
  };

  return (
    <TreLinkLayout>
      <PageHeader
        eyebrow="TreLink · adminzon"
        title="Fakturor & klientmedel"
        subtitle="Klientmedelskonto hålls åtskilt. Trelinks avgift dras först vid genomförd affär. Allt frigörande loggas."
        right={
          totals.forfallna > 0 ? (
            <span className="border border-foreground bg-foreground text-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
              ⚠ {totals.forfallna} förfallna
            </span>
          ) : null
        }
      />

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Klientmedel" value={`${(totals.klientmedel).toLocaleString("sv-SE")} kr`} hint="att frigöra" big />
        <Kpi label="Att frigöra" value={String(totals.attFrigora)} hint="prio idag" warn={totals.attFrigora > 0} />
        <Kpi label="Utestående" value={String(totals.utestaende)} hint="skickade · ej betalda" />
        <Kpi label="Förfallna" value={String(totals.forfallna)} hint="påminn / driv in" warn={totals.forfallna > 0} />
      </div>

      {/* Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-y border-dashed border-muted-foreground/40 py-3">
        <Annotation>Filter:</Annotation>
        {([
          ["alla", "Alla"],
          ["att-frigora", `Att frigöra (${totals.attFrigora})`],
          ["utestaende", `Utestående (${totals.utestaende})`],
          ["forfallna", `Förfallna (${totals.forfallna})`],
        ] as [Filter, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
              filter === id ? "border-foreground bg-foreground text-background" : "border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bulk-aktion */}
      {selected.length > 0 && (
        <div className="mb-3 flex items-center justify-between border border-foreground bg-foreground/5 px-4 py-3">
          <div className="font-mono text-[11px] uppercase tracking-wider">
            {selected.length} fakturor markerade ·{" "}
            {selected
              .map((id) => initial.find((i) => i.id === id)?.belopp ?? 0)
              .reduce((a, b) => a + b, 0)
              .toLocaleString("sv-SE")}{" "}
            kr totalt
          </div>
          <div className="flex gap-2">
            <WireBtn variant="ghost" onClick={() => setSelected([])}>Avmarkera</WireBtn>
            <WireBtn onClick={releaseSelected}>Frigör markerade →</WireBtn>
          </div>
        </div>
      )}

      <WireBox label="Fakturor">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/30 text-left">
              <th className="w-8 py-2"></th>
              <Th>Faktura</Th>
              <Th>Affär</Th>
              <Th>Typ</Th>
              <Th>Belopp</Th>
              <Th>Parter</Th>
              <Th>Status</Th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id} className={`border-b border-dashed border-muted-foreground/30 ${selected.includes(i.id) ? "bg-muted/40" : ""}`}>
                <td className="py-3">
                  {i.state === "betald-väntar-frigörande" && (
                    <input
                      type="checkbox"
                      checked={selected.includes(i.id)}
                      onChange={() => toggle(i.id)}
                      className="accent-foreground"
                    />
                  )}
                </td>
                <td className="font-mono">{i.id}</td>
                <td className="font-mono">#{i.deal}</td>
                <td>{i.typ}</td>
                <td className="font-mono">{i.belopp.toLocaleString("sv-SE")} kr</td>
                <td className="font-mono text-[11px] text-muted-foreground">{i.parts}</td>
                <td><InvStateBadge state={i.state} overdue={i.daysOverdue} /></td>
                <td className="text-right">
                  <PrimaryInvAction inv={i} onRelease={() => releaseSelected()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </WireBox>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <WireBox label="Klientmedel-policy" variant="dashed">
          <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
            <li>· Klientmedel hålls på separat konto (FI-reglerat)</li>
            <li>· Frigörs först när villkor i avtalet är uppfyllda</li>
            <li>· Trelinks avgift dras EFTER genomförd affär</li>
            <li>· Allt frigörande loggas och syns för båda parter</li>
          </ul>
        </WireBox>
        <WireBox label="Senaste händelser" variant="dashed">
          <ul className="space-y-1 text-sm">
            <li><span className="font-mono text-[10px] text-muted-foreground">09:30</span> K-209 betalade handpenning 120 000</li>
            <li><span className="font-mono text-[10px] text-muted-foreground">igår</span> Frigjorde 85 000 till S-122 (#A-2039)</li>
            <li><span className="font-mono text-[10px] text-muted-foreground">igår</span> Skickade påminnelse på F-1020</li>
          </ul>
        </WireBox>
      </div>
    </TreLinkLayout>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="pb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{children}</th>;
}

function Kpi({ label, value, hint, warn, big }: { label: string; value: string; hint?: string; warn?: boolean; big?: boolean }) {
  return (
    <div className={`border p-3 ${warn ? "border-foreground bg-foreground/5" : "border-foreground/30 bg-background"}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono ${big ? "text-xl" : "text-2xl"}`}>{value}</div>
      {hint && <div className="font-mono text-[10px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

function InvStateBadge({ state, overdue }: { state: InvState; overdue?: number }) {
  if (state === "förfallen") {
    return <span className="border border-foreground bg-foreground text-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">⚠ {overdue}d försenad</span>;
  }
  const map: Record<InvState, string> = {
    "utkast": "UTKAST",
    "skickad": "VÄNTAR BETALNING",
    "betald-väntar-frigörande": "✓ BETALD · FRIGÖR",
    "frigjord": "FRIGJORD",
    "förfallen": "FÖRFALLEN",
  };
  const filled = state === "betald-väntar-frigörande";
  return (
    <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${filled ? "border-foreground bg-foreground text-background" : "border-foreground/50"}`}>
      {map[state]}
    </span>
  );
}

function PrimaryInvAction({ inv, onRelease }: { inv: Inv; onRelease: () => void }) {
  if (inv.state === "betald-väntar-frigörande") {
    return (
      <button
        onClick={onRelease}
        className="border border-foreground bg-foreground text-background px-3 py-1.5 text-xs hover:opacity-80"
      >
        Frigör →
      </button>
    );
  }
  if (inv.state === "förfallen") return <WireBtn variant="secondary">Driv in</WireBtn>;
  if (inv.state === "skickad")   return <WireBtn variant="ghost">Påminn</WireBtn>;
  if (inv.state === "utkast")    return <WireBtn variant="ghost">Skicka</WireBtn>;
  return <WireBtn variant="ghost">Visa</WireBtn>;
}

import type React from "react";
