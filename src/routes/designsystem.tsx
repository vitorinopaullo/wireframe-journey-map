import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, Annotation, WireTag, WireBtn } from "@/components/wire";

export const Route = createFileRoute("/designsystem")({
  component: DesignSystem,
  head: () => ({
    meta: [
      { title: "Designsystem — Trelink" },
      { name: "description", content: "Överblick över Trelinks designsystem: typografi, färger, spacing, radie, skuggor och komponentregler." },
      { property: "og:title", content: "Designsystem — Trelink" },
      { property: "og:description", content: "Levande överblick över Trelinks typografi, färgskala och komponentregler." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const purple = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const pink = [50, 100, 200, 300];

const semantic: [string, string, string][] = [
  ["--color-primary", "purple-800 · #3D138D", "Fyllda knappar och CTA — endast."],
  ["--color-interactive", "purple-600 · #714CDE", "Textlänkar och interaktiv text på vitt."],
  ["--color-accent-wash", "pink-100 · #FEEBE9", "Bakgrunder och badges — aldrig knappar/status."],
  ["--color-background", "#FAF9FC", "Appens canvas — varm, lätt lila ton."],
  ["--color-foreground", "#1D1A24", "Brödtext och rubriker."],
  ["--color-muted-foreground", "#6B6675", "Sekundär text."],
  ["--color-border", "#ECEAF1", "Hårfina linjer."],
];

const typeScale: [string, string, string][] = [
  ["text-6xl", "60 px", "font-heading"],
  ["text-5xl", "48 px", "font-heading"],
  ["text-4xl", "36 px", "font-heading"],
  ["text-3xl", "30 px", "font-heading"],
  ["text-2xl", "24 px", "font-heading"],
  ["text-xl", "20 px", "font-body"],
  ["text-base", "16 px", "font-body"],
  ["text-sm", "14 px", "font-body"],
  ["text-xs", "12 px", "font-body"],
];

const spacing = [4, 8, 12, 16, 24, 32, 48, 64, 96];

const komponentregler: [string, string][] = [
  ["Primärknapp", "Fylld primary, vit text, radie 8 px, 0.97 vid tryck."],
  ["Sekundärknapp", "Hårfin ram, neutral text, ingen fyllning."],
  ["Textlänk", "Endast text i interactive-lila, understruken vid hover."],
  ["Kort", "Radie 14 px. Skugga ELLER hårfin ram — aldrig båda. Hover ökar skuggan, kortet ändrar inte storlek."],
  ["Fält", "Cirka 44 px höjd, hårfin ram, fokus = purple-600 ram + purple-500 ring."],
  ["Tabeller", "Endast vågräta linjer, sticky rubrik, siffror högerställda med tabular-nums."],
  ["Navigation", "Hårfin underkant, aktiv post i interactive-lila."],
  ["Ikoner", "Lucide, samma linjetjocklek överallt."],
];

function Swatch({ varName, label }: { varName: string; label: string }) {
  return (
    <div>
      <div
        className="h-16 rounded-button border border-border"
        style={{ background: `var(${varName})` }}
      />
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function DesignSystem() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Internt"
        title="Designsystem — överblick"
        subtitle="Levande referens för Trelinks visuella språk. Alla värden kommer direkt från src/styles.css, så det du ser här är exakt det appen använder."
      />

      <div className="space-y-6">
        <WireBox label="Typografi">
          <div className="space-y-3">
            {typeScale.map(([cls, px, font]) => (
              <div key={cls} className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0">
                <span className={`${cls} ${font === "font-heading" ? "font-heading" : "font-body"} truncate`}>
                  Hitta din nästa verksamhet
                </span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {cls} · {px} · {font}
                </span>
              </div>
            ))}
          </div>
          <Annotation>
            <span className="mt-3 block">
              Instrument Serif används för h1/h2 och stora siffror. Inter för allt annat, inklusive h3–h6.
              Negativ teckenavstånd (-0.02em) från 30 px och uppåt.
            </span>
          </Annotation>
        </WireBox>

        <WireBox label="Färg — lila skala">
          <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-11">
            {purple.map((n) => (
              <Swatch key={n} varName={`--purple-${n}`} label={String(n)} />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {pink.map((n) => (
              <Swatch key={n} varName={`--pink-${n}`} label={`rosa ${n}`} />
            ))}
          </div>
        </WireBox>

        <WireBox label="Färg — roller">
          <ul className="space-y-2">
            {semantic.map(([token, value, use]) => (
              <li key={token} className="flex flex-col gap-1 border-b border-border py-2 last:border-0 md:flex-row md:items-center md:gap-4">
                <span
                  className="h-6 w-6 shrink-0 rounded-button border border-border"
                  style={{ background: `var(${token})` }}
                />
                <span className="w-56 shrink-0 font-mono text-[11px]">{token}</span>
                <span className="w-48 shrink-0 font-mono text-[11px] text-muted-foreground">{value}</span>
                <span className="text-sm text-muted-foreground">{use}</span>
              </li>
            ))}
          </ul>
        </WireBox>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <WireBox label="Spacing">
            <div className="space-y-2">
              {spacing.map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <span className="w-12 font-mono text-[10px] tabular-nums text-muted-foreground">{n} px</span>
                  <span className="h-3 rounded-sm bg-purple-200" style={{ width: `${n}px` }} />
                </div>
              ))}
            </div>
            <Annotation>
              <span className="mt-3 block">Tailwinds standardskala (1 = 4 px). Inga egna spacing-värden.</span>
            </Annotation>
          </WireBox>

          <WireBox label="Radie & skugga">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-button border border-border bg-card p-4 text-center font-mono text-[10px]">button<br />8 px</div>
              <div className="rounded-card border border-border bg-card p-4 text-center font-mono text-[10px]">card<br />14 px</div>
              <div className="rounded-pill border border-border bg-card p-4 text-center font-mono text-[10px]">pill<br />999 px</div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-card bg-card p-4 text-center font-mono text-[10px] shadow-sm">shadow-sm</div>
              <div className="rounded-card bg-card p-4 text-center font-mono text-[10px] shadow-md">shadow-md</div>
              <div className="rounded-card bg-card p-4 text-center font-mono text-[10px] shadow-lg">shadow-lg</div>
            </div>
            <Annotation>
              <span className="mt-3 block">Skuggorna är varmtonade, inte svarta. Rörelse följer ease-in-out, 150 ms, och respekterar reducerad rörelse.</span>
            </Annotation>
          </WireBox>
        </div>

        <WireBox label="Komponenter">
          <div className="flex flex-wrap items-center gap-3">
            <WireBtn variant="primary">Primär</WireBtn>
            <WireBtn variant="secondary">Sekundär</WireBtn>
            <WireBtn variant="tertiary">Textlänk</WireBtn>
            <WireTag>Etikett</WireTag>
          </div>
          <ul className="mt-6 space-y-2">
            {komponentregler.map(([name, rule]) => (
              <li key={name} className="border-b border-border py-2 last:border-0">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{name}</span>
                <p className="text-sm">{rule}</p>
              </li>
            ))}
          </ul>
        </WireBox>

        <WireBox label="Siffror" variant="dashed">
          <p className="text-sm">Pris, värdering, yta och lagervärde sätts alltid med <span className="font-mono text-[11px]">tabular-nums</span> så siffrorna ligger i linje:</p>
          <div className="mt-3 space-y-1 font-mono text-sm tabular-nums">
            <div>29 900 kr</div>
            <div>39 900 kr</div>
            <div>79 900 kr</div>
            <div>2 500 kr</div>
          </div>
        </WireBox>
      </div>
    </PublicLayout>
  );
}
