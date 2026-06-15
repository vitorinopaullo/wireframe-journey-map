import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GeorgeLayout } from "@/components/layouts/GeorgeLayout";
import { WireBox, PageHeader, WireBtn, WireTag, StatusDot, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/affarer")({
  component: GeorgeDeals,
});

type Blocker = "George" | "Säljare" | "Köpare" | "Hyresvärd" | "Bank" | "Inget";
type Stage = 0 | 1 | 2 | 3 | 4 | 5;

const stages = ["Annons", "Match", "Hyresvärd", "Handpenning", "Signering", "Tillträde"] as const;

type Deal = {
  id: string;
  titel: string;
  kat: "Lokal" | "Inkråm" | "Bolag";
  parties: { saljare: string; kopare?: string };
  belopp: string;
  step: Stage;
  blocker: Blocker;
  daysInStage: number;
  lastEvent: string;
  nextAction: string;
  flag?: "uc-pending" | "sla-risk" | "alla-villkor-uppfyllda";
};

const initial: Deal[] = [
  { id: "A-2041", titel: "Restauranglokal · Södermalm", kat: "Lokal",  parties: { saljare: "S-77",  kopare: "K-210" }, belopp: "1 950 000 kr", step: 2, blocker: "Hyresvärd", daysInStage: 5, lastEvent: "Påminnelse skickad 13 jun", nextAction: "Vänta svar / påminn igen", flag: "sla-risk" },
  { id: "A-2039", titel: "Café · Linné (inkråm)",      kat: "Inkråm", parties: { saljare: "S-122", kopare: "K-211" }, belopp: "850 000 kr",   step: 4, blocker: "George",    daysInStage: 1, lastEvent: "Båda parter signerade i morse",  nextAction: "Bekräfta tillträdesdatum", flag: "alla-villkor-uppfyllda" },
  { id: "A-2038", titel: "Butikslokal · Vasastan",     kat: "Lokal",  parties: { saljare: "S-77",  kopare: "K-209" }, belopp: "1 200 000 kr", step: 3, blocker: "George",    daysInStage: 1, lastEvent: "Handpenning 120 000 mottagen", nextAction: "Frigör medel till säljare" },
  { id: "A-2032", titel: "SaaS-bolag B2B",              kat: "Bolag",  parties: { saljare: "S-201", kopare: "K-208" }, belopp: "4 200 000 kr", step: 1, blocker: "George",    daysInStage: 0, lastEvent: "Köpare anmält intresse",         nextAction: "Kör UC + AML på köparen", flag: "uc-pending" },
  { id: "A-2030", titel: "Frisör · Vasastan",           kat: "Inkråm", parties: { saljare: "S-104" },                  belopp: "—",            step: 0, blocker: "George",    daysInStage: 0, lastEvent: "Annons inskickad 09:12",         nextAction: "Granska annons" },
];

type StageFilter = "alla" | Stage;
type BlockerFilter = "alla" | Blocker;

function GeorgeDeals() {
  const [stageF, setStageF] = useState<StageFilter>("alla");
  const [blockerF, setBlockerF] = useState<BlockerFilter>("alla");
  const [selected, setSelected] = useState<string[]>([]);

  const list = useMemo(() => {
    return initial
      .filter((d) => (stageF === "alla" ? true : d.step === stageF))
      .filter((d) => (blockerF === "alla" ? true : d.blocker === blockerF))
      .sort((a, b) => {
        // SLA-risk först, sen "väntar på George", sen åldrad
        const risk = (d: Deal) => (d.flag === "sla-risk" ? 0 : d.blocker === "George" ? 1 : 2);
        if (risk(a) !== risk(b)) return risk(a) - risk(b);
        return b.daysInStage - a.daysInStage;
      });
  }, [stageF, blockerF]);

  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <GeorgeLayout>
      <PageHeader
        eyebrow="George · adminzon"
        title="Driv affärer"
        subtitle="Varje affär visar tydligt vem som blockerar nästa steg. Båda parter ser samma stege i sin vy."
        right={<WireTag>{initial.length} aktiva</WireTag>}
      />

      {/* Filter */}
      <div className="mb-4 space-y-3 border-y border-dashed border-muted-foreground/40 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Annotation>Steg:</Annotation>
          <Chip active={stageF === "alla"} onClick={() => setStageF("alla")}>Alla</Chip>
          {stages.map((s, i) => (
            <Chip key={s} active={stageF === i} onClick={() => setStageF(i as Stage)}>{i + 1}. {s}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Annotation>Blocker:</Annotation>
          {(["alla", "George", "Säljare", "Köpare", "Hyresvärd", "Bank"] as BlockerFilter[]).map((b) => (
            <Chip key={b} active={blockerF === b} onClick={() => setBlockerF(b)}>
              {b === "alla" ? "Alla" : b}
            </Chip>
          ))}
        </div>
      </div>

      {/* Bulk-aktioner */}
      {selected.length > 0 && (
        <div className="mb-4 flex items-center justify-between border border-foreground bg-foreground/5 px-4 py-3">
          <div className="font-mono text-[11px] uppercase tracking-wider">
            {selected.length} affärer markerade
          </div>
          <div className="flex gap-2">
            <WireBtn variant="ghost" onClick={() => setSelected([])}>Avmarkera</WireBtn>
            <WireBtn variant="secondary">Skicka påminnelse</WireBtn>
            <WireBtn>Tilldela till mig</WireBtn>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {list.length === 0 && (
          <WireBox variant="dashed"><Annotation>Inga affärer matchar filtret.</Annotation></WireBox>
        )}
        {list.map((d) => (
          <WireBox key={d.id} className={`space-y-3 ${selected.includes(d.id) ? "ring-2 ring-foreground" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-1 min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(d.id)}
                  onChange={() => toggle(d.id)}
                  className="mt-1.5 accent-foreground"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <WireTag>{d.kat}</WireTag>
                    <BlockerBadge blocker={d.blocker} />
                    {d.flag === "sla-risk" && (
                      <span className="border border-foreground bg-foreground text-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                        ⚠ {d.daysInStage}d i steget
                      </span>
                    )}
                    {d.flag === "alla-villkor-uppfyllda" && (
                      <span className="border border-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                        ✓ klar för nästa steg
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-muted-foreground">
                      #{d.id} · {d.parties.saljare}{d.parties.kopare ? ` ↔ ${d.parties.kopare}` : ""} · {d.belopp}
                    </span>
                  </div>
                  <h3 className="font-medium">{d.titel}</h3>
                  <div className="mt-1 grid gap-x-4 gap-y-0.5 font-mono text-[11px] text-muted-foreground md:grid-cols-2">
                    <span>↳ senast: {d.lastEvent}</span>
                    <span>↳ nästa: {d.nextAction}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link to="/affar/$id" params={{ id: d.id }} className="border border-foreground/40 px-3 py-1.5 text-xs hover:border-foreground">
                  Parter-vy
                </Link>
                <PrimaryAction deal={d} />
              </div>
            </div>

            {/* Stegmätare */}
            <div>
              <div className="grid grid-cols-6 gap-1">
                {stages.map((l, i) => {
                  const s = i < d.step ? "done" : i === d.step ? "active" : "pending";
                  const isActive = i === d.step;
                  return (
                    <div
                      key={l}
                      className={`flex flex-col items-center gap-1 border p-2 text-center ${
                        isActive ? "border-foreground bg-muted/40" : "border-dashed border-muted-foreground/30"
                      }`}
                    >
                      <StatusDot state={s as never} />
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{l}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </WireBox>
        ))}
      </div>
    </GeorgeLayout>
  );
}

function PrimaryAction({ deal }: { deal: Deal }) {
  if (deal.blocker !== "George") {
    return <WireBtn variant="ghost">Påminn {deal.blocker.toLowerCase()}</WireBtn>;
  }
  const label =
    deal.flag === "uc-pending" ? "Kör UC →" :
    deal.step === 0 ? "Granska →" :
    deal.step === 3 ? "Frigör medel →" :
    deal.step === 4 ? "Bekräfta tillträde →" :
    "Driv vidare →";
  return (
    <button className="border border-foreground bg-foreground text-background px-3 py-1.5 text-xs hover:opacity-80">
      {label}
    </button>
  );
}

function BlockerBadge({ blocker }: { blocker: Blocker }) {
  const filled = blocker === "George";
  return (
    <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
      filled ? "border-foreground bg-foreground text-background" : "border-foreground/50"
    }`}>
      {blocker === "George" ? "→ DU" : `väntar: ${blocker.toLowerCase()}`}
    </span>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${
        active ? "border-foreground bg-foreground text-background" : "border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

import type React from "react";
