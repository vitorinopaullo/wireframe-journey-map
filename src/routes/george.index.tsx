import { createFileRoute, Link } from "@tanstack/react-router";
import { TreLinkLayout } from "@/components/layouts/TreLinkLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { useState } from "react";

export const Route = createFileRoute("/george/")({
  component: TreLinkHome,
});

type Task = {
  id: string;
  category: "Granskning" | "UC" | "Hyresvärd" | "Faktura" | "Signering" | "Match";
  title: string;
  context: string;
  to: string;
  cta: string;
  age: string; // "2h", "1d", "3d"
  sla: "ok" | "snart" | "brott";
  parties: string; // "S-104 · K-208"
};

const blockerOnTreLink: Task[] = [
  { id: "t1", category: "Granskning", title: "Annons #9 — Frisörsalong, Vasastan", context: "5 dokument · alla inlämnade", to: "/george/annonser/9", cta: "Granska", age: "2h", sla: "ok", parties: "S-104" },
  { id: "t2", category: "Granskning", title: "Annons #12 — SaaS-bolag B2B", context: "7 dok · 2 saknas (granskning utlöper)", to: "/george/annonser/12", cta: "Öppna", age: "50h", sla: "brott", parties: "S-201" },
  { id: "t3", category: "UC", title: "Köpare K-208 anmält intresse på #1", context: "Kör UC innan kontaktdelning", to: "/george/affarer", cta: "Kör UC", age: "4h", sla: "snart", parties: "K-208 · S-101" },
  { id: "t4", category: "Faktura", title: "Affär #A-2038 — handpenning betald", context: "Verifiera mottagen · frigör till säljare", to: "/george/fakturor", cta: "Frigör medel", age: "1d", sla: "ok", parties: "S-77 · K-209" },
  { id: "t5", category: "Signering", title: "Affär #A-2039 — båda parter signerade", context: "Markera tillträdesdatum bekräftat", to: "/george/affarer", cta: "Bekräfta tillträde", age: "6h", sla: "ok", parties: "S-122 · K-211" },
];

const waitingOnOthers: Task[] = [
  { id: "w1", category: "Hyresvärd", title: "#A-2041 · Restauranglokal Södermalm", context: "Anonym profil skickad 13 jun · ingen återkoppling", to: "/george/hyresvard", cta: "Påminn", age: "2d", sla: "snart", parties: "Hyresvärd" },
  { id: "w2", category: "Match", title: "Annons #10 · Café Linné", context: "Säljare ska komplettera hyresavtal", to: "/george/annonser/10", cta: "Påminn säljare", age: "1d", sla: "ok", parties: "S-122" },
  { id: "w3", category: "Granskning", title: "Annons #11 · Butikslokal Malmö", context: "Säljaren behöver godkänna TreLink's redigering av rubriken", to: "/george/annonser/11", cta: "Visa", age: "3h", sla: "ok", parties: "S-77" },
];

const activity = [
  { ts: "09:42", text: "Säljare S-104 skickade annons #9 för granskning" },
  { ts: "09:30", text: "Köpare K-209 betalade handpenning 120 000 kr för #A-2038" },
  { ts: "08:55", text: "Hyresvärd för #A-2038 godkände anonym köparprofil" },
  { ts: "08:20", text: "Köpare K-211 signerade köpeavtal för #A-2039" },
  { ts: "yesterday", text: "Du publicerade annons #8 · Pizzeria Solna" },
];

function TreLinkHome() {
  const [tab, setTab] = useState<"dig" | "andra">("dig");
  const list = tab === "dig" ? blockerOnTreLink : waitingOnOthers;

  return (
    <TreLinkLayout>
      <PageHeader
        eyebrow="Kommandocentral · måndag 15 juni"
        title="God morgon, TreLink"
        subtitle="5 saker väntar på dig · 3 på andra · 2 SLA-brott att rädda först"
        right={
          <div className="flex items-center gap-2">
            <WireTag>Inloggad 09:12</WireTag>
            <Link to="/oversikt" className="border border-foreground/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider hover:border-foreground">
              Demoöversikt
            </Link>
          </div>
        }
      />

      {/* Health-rad */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Health label="Väntar på dig" value="5" hint="ny + pågår" />
        <Health label="Väntar på andra" value="3" hint="säljare · hyresvärd" />
        <Health label="SLA-brott" value="2" hint="åtgärda först" warn />
        <Health label="Affärer i pipen" value="11" hint="varav 4 nära avslut" />
      </div>

      {/* Genvägar */}
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Shortcut to="/george/annonser" title="Granska annonser" count="4" desc="Triage-inkorg · dokument-för-dokument" hint="⌘2" />
        <Shortcut to="/george/affarer" title="Driv affärer" count="5" desc="Stege med blocker per affär" hint="⌘3" />
        <Shortcut to="/george/fakturor" title="Pengar" count="2" desc="Klientmedel · frigörande · fakturor" hint="⌘5" />
      </div>

      {/* Huvudlista med flikar */}
      <div className="mb-3 flex items-center gap-2 border-b border-foreground/20">
        <TabButton active={tab === "dig"} onClick={() => setTab("dig")}>
          Väntar på dig ({blockerOnTreLink.length})
        </TabButton>
        <TabButton active={tab === "andra"} onClick={() => setTab("andra")}>
          Väntar på andra ({waitingOnOthers.length})
        </TabButton>
        <div className="ml-auto pb-2 font-mono text-[10px] text-muted-foreground">
          Sorterat: SLA-brott först
        </div>
      </div>

      <ul className="divide-y divide-dashed divide-muted-foreground/30 border border-foreground/30 bg-background">
        {list
          .sort((a, b) => {
            const order = { brott: 0, snart: 1, ok: 2 };
            return order[a.sla] - order[b.sla];
          })
          .map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-1 min-w-0 items-start gap-3">
                <SlaPill sla={t.sla} age={t.age} />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <WireTag>{t.category}</WireTag>
                    <span className="font-mono text-[10px] text-muted-foreground">{t.parties}</span>
                  </div>
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <Annotation>{t.context}</Annotation>
                </div>
              </div>
              <Link
                to={t.to}
                className="shrink-0 border border-foreground bg-foreground text-background px-4 py-2 text-sm hover:opacity-80"
              >
                {t.cta} →
              </Link>
            </li>
          ))}
      </ul>

      {/* Aktivitetsström */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WireBox label="Aktivitet · senaste 24h">
            <ul className="space-y-2">
              {activity.map((a, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-20 shrink-0 font-mono text-[11px] text-muted-foreground">{a.ts}</span>
                  <span className="flex-1">{a.text}</span>
                </li>
              ))}
            </ul>
          </WireBox>
        </div>
        <div className="space-y-4">
          <WireBox label="SLA-policy" variant="dashed">
            <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
              <li>· Annons granskas inom 24h</li>
              <li>· UC-svar levereras inom 4h</li>
              <li>· Hyresvärd: påminnelse efter 3d</li>
              <li>· Klientmedel frigörs inom 1d</li>
            </ul>
          </WireBox>
          <WireBox label="Tangentbord" variant="dashed">
            <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
              <li><kbd className="border border-muted-foreground/40 px-1">⌘K</kbd> snabbsök</li>
              <li><kbd className="border border-muted-foreground/40 px-1">⌘1-6</kbd> hoppa sektion</li>
              <li><kbd className="border border-muted-foreground/40 px-1">J/K</kbd> nästa/föregående post</li>
            </ul>
          </WireBox>
        </div>
      </div>
    </TreLinkLayout>
  );
}

function Health({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className={`border p-3 ${warn ? "border-foreground bg-foreground/5" : "border-foreground/30 bg-background"}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl">{value}</div>
      {hint && <div className="font-mono text-[10px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

function Shortcut({ to, title, count, desc, hint }: { to: string; title: string; count: string; desc: string; hint: string }) {
  return (
    <Link to={to} className="group block border border-foreground/30 bg-background p-4 hover:border-foreground">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="font-mono text-3xl">{count}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>
        <span className="text-xs text-muted-foreground group-hover:text-foreground">Öppna →</span>
      </div>
    </Link>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNodeLike }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 pb-2 text-sm ${
        active ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SlaPill({ sla, age }: { sla: "ok" | "snart" | "brott"; age: string }) {
  if (sla === "brott") {
    return <span className="shrink-0 border border-foreground bg-foreground text-background px-2 py-1 font-mono text-[10px] uppercase tracking-wider">⚠ {age}</span>;
  }
  if (sla === "snart") {
    return <span className="shrink-0 border border-foreground px-2 py-1 font-mono text-[10px] uppercase tracking-wider">⏱ {age}</span>;
  }
  return <span className="shrink-0 border border-dashed border-muted-foreground/50 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{age}</span>;
}

type ReactNodeLike = React.ReactNode;
import type React from "react";
