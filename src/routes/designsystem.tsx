import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  ChevronRight,
  Download,
  FileText,
  Heart,
  Info,
  Lock,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, Annotation, WireTag, WireBtn, StatusDot } from "@/components/wire";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/designsystem")({
  component: DesignSystem,
  head: () => ({
    meta: [
      { title: "Designsystem — Trelink" },
      {
        name: "description",
        content:
          "Levande överblick över Trelinks designsystem: typografi, siffror, färg, spacing, knappar, formulär, status och komponenter.",
      },
      { property: "og:title", content: "Designsystem — Trelink" },
      { property: "og:description", content: "Levande överblick över Trelinks visuella språk och komponentregler." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/* ---------- data ---------- */

const sections: [string, string][] = [
  ["grunder", "Grunder"],
  ["typografi", "Typografi"],
  ["siffror", "Siffror"],
  ["farg", "Färg"],
  ["spacing", "Spacing & layout"],
  ["form", "Radie, skugga & rörelse"],
  ["knappar", "Knappar"],
  ["formular", "Formulär"],
  ["status", "Märken & status"],
  ["data", "Data"],
  ["navigation", "Navigation"],
  ["meddelanden", "Meddelanden"],
  ["ikoner", "Ikoner"],
];

const purple = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const pink = [50, 100, 200, 300];

const roller: [string, string, string][] = [
  ["--color-primary", "lila 800 · #3D138D", "Fyllda knappar och CTA — endast."],
  ["--color-interactive", "lila 600 · #714CDE", "Textlänkar och interaktiv text på vitt."],
  ["--color-accent-wash", "rosa 100", "Bakgrunder och badges — aldrig knappar eller status."],
  ["--color-background", "#FAF9FC", "Appens canvas — varm, lätt lila ton."],
  ["--color-card", "#FFFFFF", "Kort och paneler."],
  ["--color-foreground", "#1D1A24", "Rubriker och brödtext."],
  ["--color-muted-foreground", "#6B6675", "Sekundär text och hjälptext."],
  ["--color-border", "#ECEAF1", "Hårfina linjer."],
];

const statusfarger: [string, string, string][] = [
  ["--color-success", "Godkänd, publicerad, klar", "success"],
  ["--color-warning", "Väntar, komplettering krävs", "warning"],
  ["--color-danger", "Avslag, fel, raderas", "danger"],
];

const typeScale: [string, string, string][] = [
  ["text-6xl", "60 px", "heading"],
  ["text-5xl", "48 px", "heading"],
  ["text-4xl", "36 px", "heading"],
  ["text-3xl", "30 px", "heading"],
  ["text-2xl", "24 px", "heading"],
  ["text-xl", "20 px", "body"],
  ["text-base", "16 px", "body"],
  ["text-sm", "14 px", "body"],
  ["text-xs", "12 px", "body"],
];

const spacing = [4, 8, 12, 16, 24, 32, 48, 64, 96];

const siffror: [string, string, string][] = [
  ["Pris", "1 250 000 kr", "text-2xl"],
  ["Avgift", "29 900 kr", "text-base"],
  ["Yta", "142 kvm", "text-base"],
  ["Lagervärde", "385 000 kr", "text-base"],
  ["Hyra per månad", "48 500 kr", "text-base"],
  ["Datum", "2026-09-09", "text-sm"],
  ["Andel", "12,5 %", "text-sm"],
  ["Org.nr", "556677-8899", "text-sm"],
];

const annonsstatus: [string, "done" | "active" | "pending", string][] = [
  ["Publicerad", "done", "Annonsen är live och syns för köpare."],
  ["Granskas", "active", "TreLink granskar underlaget — svar inom 24 h på vardagar."],
  ["Uppdragsavtal", "active", "Väntar på signering med BankID."],
  ["Komplettering krävs", "pending", "Säljaren behöver ladda upp mer underlag."],
  ["Utkast", "pending", "Inte inskickad än."],
];

const ikoner = [
  { Icon: Search, name: "Search" },
  { Icon: Heart, name: "Heart" },
  { Icon: FileText, name: "FileText" },
  { Icon: Upload, name: "Upload" },
  { Icon: Download, name: "Download" },
  { Icon: Check, name: "Check" },
  { Icon: X, name: "X" },
  { Icon: Plus, name: "Plus" },
  { Icon: Info, name: "Info" },
  { Icon: Lock, name: "Lock" },
  { Icon: Trash2, name: "Trash2" },
  { Icon: ChevronRight, name: "ChevronRight" },
];

/* ---------- små byggstenar för sidan ---------- */

function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl">{title}</h2>
      {lead && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{lead}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground">{children}</p>
  );
}

function Swatch({ varName, label }: { varName: string; label: string }) {
  return (
    <div>
      <div className="h-16 rounded-button border border-border" style={{ background: `var(${varName})` }} />
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

// Samma tone→klass-mappning som StatusTag i admin.annonser.index.tsx använder
// för riktiga annonsstatusar — så att Etiketter-sektionen visar exakt de
// färger appen faktiskt renderar, inte en påhittad variant.
const TAG_TONE_CLASS = {
  success: "border-[var(--color-success)] bg-[var(--color-success)] text-white",
  warning: "border-amber-500/70 text-amber-700 bg-amber-50/60 dark:text-amber-500 dark:bg-amber-500/10",
  danger: "border-destructive text-destructive bg-destructive/10",
  neutral: "border-foreground/20 text-muted-foreground",
} as const;

/* ---------- sidan ---------- */

function DesignSystem() {
  const [toggle, setToggle] = useState(true);
  const [toggle2, setToggle2] = useState(false);

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Internt"
        title="Designsystem — överblick"
        subtitle="Levande referens för Trelinks visuella språk. Allt du ser här är samma komponenter och värden som resten av prototypen använder — ändrar vi något här slår det igenom överallt."
      />

      <div className="flex gap-10">
        <nav className="sticky top-8 hidden h-fit w-52 shrink-0 lg:block">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Innehåll</div>
          <ul className="space-y-1">
            {sections.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="block rounded-button px-2 py-1.5 text-sm hover:bg-muted">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-14">
          {/* 1 — Grunder */}
          <Section
            id="grunder"
            title="Grunder"
            lead="Vad som är styrt centralt, och vad som därför ändras i hela prototypen på en gång."
          >
            <WireBox>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Ändras överallt
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    <li>Alla färger och färgroller</li>
                    <li>Typsnitt och hela textskalan</li>
                    <li>Sifferregeln</li>
                    <li>Hörnradier, skuggor och rörelse</li>
                    <li>Knappar, fält, märken och kort</li>
                  </ul>
                </div>
                <div>
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Ändras per sida
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li>Texter och rubriker</li>
                    <li>Vilka fält ett formulär innehåller</li>
                    <li>Ordningen mellan sektioner</li>
                    <li>Flödets steg och regler</li>
                  </ul>
                </div>
              </div>
              <Rule>
                Säg vad du vill ändra i klartext — "rundare hörn", "ljusare lila på länkar", "mindre luft mellan
                sektioner" — så ändras det på ett ställe och slår igenom i hela prototypen.
              </Rule>
            </WireBox>
          </Section>

          {/* 2 — Typografi */}
          <Section id="typografi" title="Typografi" lead="Två typsnitt, nio storlekar. Inget annat.">
            <WireBox label="Skala">
              <div className="space-y-3">
                {typeScale.map(([cls, px, font]) => (
                  <div key={cls} className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-0">
                    <span className={`${cls} ${font === "heading" ? "font-heading" : "font-body"} truncate`}>
                      Hitta din nästa verksamhet
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {cls} · {px} · {font}
                    </span>
                  </div>
                ))}
              </div>
              <Rule>
                Instrument Serif används för h1 och h2 samt stora sifferrubriker. Inter för allt annat, inklusive
                h3–h6. Från 30 px och uppåt dras teckenavståndet ihop något.
              </Rule>
            </WireBox>

            <WireBox label="Textroller">
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl">Rubrik nivå 1</h1>
                  <h2 className="mt-2 text-3xl">Rubrik nivå 2</h2>
                  <h3 className="mt-2 text-xl">Rubrik nivå 3</h3>
                  <h4 className="mt-2 text-base">Rubrik nivå 4</h4>
                </div>
                <p className="text-base">
                  Brödtext, 16 px, radavstånd 1,5. Används i löpande text och beskrivningar.
                </p>
                <p className="text-sm text-muted-foreground">Hjälptext, 14 px, dämpad. Under fält och i förklaringar.</p>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Etikett — versaler, monospace, 10 px
                </div>
                <p className="text-sm">
                  En <a href="#typografi" className="text-interactive underline-offset-4 hover:underline">textlänk</a>{" "}
                  mitt i en mening.
                </p>
              </div>
            </WireBox>
          </Section>

          {/* 3 — Siffror */}
          <Section
            id="siffror"
            title="Siffror"
            lead="En regel för alla belopp, ytor, datum och procent — så att kolumner ligger i linje och priser inte hoppar."
          >
            <WireBox label="Sifferregeln">
              <p className="text-sm">
                Alla siffror sätts i Inter med fasta siffervidder. Monospace används enbart till tekniska koder som
                K-123 och A-2041 — aldrig till belopp. Instrument Serif används bara till det stora priset på
                annonssidan.
              </p>
              <div className="mt-4 divide-y divide-border">
                {siffror.map(([label, value, size]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 py-2">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className={`num ${size}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-baseline gap-6">
                <div>
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Stort pris — annonssida
                  </div>
                  <div className="font-heading text-4xl tabular-nums">1 250 000 kr</div>
                </div>
                <div>
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Teknisk kod
                  </div>
                  <div className="font-mono text-lg">K-123 · A-2041</div>
                </div>
              </div>
              <Rule>I tabeller högerställs sifferkolumner alltid.</Rule>
            </WireBox>
          </Section>

          {/* 4 — Färg */}
          <Section id="farg" title="Färg" lead="En lila skala, en rosa tvättskala och tre statusfärger. Lila används sparsamt.">
            <WireBox label="Lila skala">
              <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-11">
                {purple.map((n) => (
                  <Swatch key={n} varName={`--purple-${n}`} label={String(n)} />
                ))}
              </div>
            </WireBox>

            <WireBox label="Rosa tvätt">
              <div className="grid grid-cols-4 gap-3">
                {pink.map((n) => (
                  <Swatch key={n} varName={`--pink-${n}`} label={`rosa ${n}`} />
                ))}
              </div>
              <Rule>Rosa är enbart dekor: bakgrunder, badges, illustrationer. Aldrig knappar, aldrig status.</Rule>
            </WireBox>

            <WireBox label="Roller">
              <ul>
                {roller.map(([token, value, use]) => (
                  <li
                    key={token}
                    className="flex flex-col gap-1 border-b border-border py-2 last:border-0 md:flex-row md:items-center md:gap-4"
                  >
                    <span className="h-6 w-6 shrink-0 rounded-button border border-border" style={{ background: `var(${token})` }} />
                    <span className="w-56 shrink-0 font-mono text-[11px]">{token}</span>
                    <span className="w-44 shrink-0 font-mono text-[11px] text-muted-foreground">{value}</span>
                    <span className="text-sm text-muted-foreground">{use}</span>
                  </li>
                ))}
              </ul>
            </WireBox>

            <WireBox label="Status">
              <ul>
                {statusfarger.map(([token, use, tone]) => (
                  <li key={token} className="flex flex-wrap items-center gap-4 border-b border-border py-3 last:border-0">
                    <span className="h-6 w-6 shrink-0 rounded-button border border-border" style={{ background: `var(${token})` }} />
                    <span className="w-56 shrink-0 font-mono text-[11px]">{token}</span>
                    <WireTag className={TAG_TONE_CLASS[tone as "success" | "warning" | "danger"]}>
                      {use}
                    </WireTag>
                  </li>
                ))}
              </ul>
              <Rule>Statusfärgerna är varmtonade så de hör ihop med paletten i stället för att se ut som systemvarningar.</Rule>
            </WireBox>
          </Section>

          {/* 5 — Spacing */}
          <Section id="spacing" title="Spacing & layout" lead="Nio avstånd, en sidbredd. Inga mellanvärden.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <WireBox label="Avståndsskala">
                <div className="space-y-2">
                  {spacing.map((n) => (
                    <div key={n} className="flex items-center gap-3">
                      <span className="num w-12 text-[11px] text-muted-foreground">{n} px</span>
                      <span className="h-3 rounded-sm bg-purple-200" style={{ width: `${n}px` }} />
                    </div>
                  ))}
                </div>
              </WireBox>
              <WireBox label="Layout">
                <ul className="space-y-2 text-sm">
                  <li>Sidbredd: max 1280 px, centrerad</li>
                  <li>Sidmarginal: 24 px</li>
                  <li>Avstånd mellan sektioner: 48–64 px</li>
                  <li>Avstånd mellan kort i rutnät: 16–24 px</li>
                  <li>Innerpadding i kort: 16 px, större kort 24 px</li>
                </ul>
                <Rule>Rutnätet är fyra kolumner på desktop, två på surfplatta, en på mobil.</Rule>
              </WireBox>
            </div>
          </Section>

          {/* 6 — Radie, skugga, rörelse */}
          <Section id="form" title="Radie, skugga & rörelse" lead="Tre radier, tre skuggor, ett rörelsemönster.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <WireBox label="Radie">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-button border border-border bg-card p-4 text-center font-mono text-[10px]">
                    knapp
                    <br />8 px
                  </div>
                  <div className="rounded-card border border-border bg-card p-4 text-center font-mono text-[10px]">
                    kort
                    <br />14 px
                  </div>
                  <div className="rounded-pill border border-border bg-card p-4 text-center font-mono text-[10px]">
                    pill
                    <br />rund
                  </div>
                </div>
              </WireBox>
              <WireBox label="Skugga">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-card bg-card p-4 text-center font-mono text-[10px] shadow-sm">liten</div>
                  <div className="rounded-card bg-card p-4 text-center font-mono text-[10px] shadow-md">mellan</div>
                  <div className="rounded-card bg-card p-4 text-center font-mono text-[10px] shadow-lg">stor</div>
                </div>
                <Rule>Kort har skugga eller hårfin ram — aldrig båda.</Rule>
              </WireBox>
            </div>
            <WireBox label="Rörelse">
              <div className="flex flex-wrap items-center gap-4">
                <div className="cursor-default rounded-card border border-border bg-card p-4 text-sm shadow-sm transition-shadow duration-150 ease-in-out hover:shadow-lg">
                  Hovra på kortet — skuggan ökar, storleken är oförändrad
                </div>
                <WireBtn variant="primary">Tryck — knappen sjunker till 0,97</WireBtn>
              </div>
              <Rule>150 ms, mjuk kurva. Den som slagit på reducerad rörelse i sitt system får inga animationer.</Rule>
            </WireBox>
          </Section>

          {/* 7 — Knappar */}
          <Section id="knappar" title="Knappar" lead="Fyra varianter. Bara en primärknapp per vy.">
            <WireBox label="Varianter">
              <div className="flex flex-wrap items-center gap-3">
                <WireBtn variant="primary">Primär</WireBtn>
                <WireBtn variant="secondary">Sekundär</WireBtn>
                <WireBtn variant="tertiary">Textlänk</WireBtn>
                <WireBtn variant="ghost">Ghost</WireBtn>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <WireBtn variant="primary" disabled>
                  Inaktiv
                </WireBtn>
                <WireBtn variant="primary">
                  <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Skickar…
                </WireBtn>
                <WireBtn variant="secondary">
                  <Upload className="mr-2 h-4 w-4" /> Med ikon
                </WireBtn>
              </div>
              <Rule>
                Primär = det du vill att användaren gör. Sekundär = alternativet. Textlänk = bort från flödet, t.ex.
                "Avbryt".
              </Rule>
            </WireBox>
          </Section>

          {/* 8 — Formulär */}
          <Section id="formular" title="Formulär" lead="Alla fältyper och deras lägen.">
            <WireBox label="Textfält">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm">Företagsnamn</Label>
                  <Input placeholder="Ex. Café Solsidan AB" />
                  <p className="mt-1.5 text-xs text-muted-foreground">Som det står i bolagsregistret.</p>
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Ifyllt</Label>
                  <Input defaultValue="Café Solsidan AB" />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Fel</Label>
                  <Input defaultValue="cafe.solsidan" aria-invalid className="border-danger focus-visible:ring-danger/30" />
                  <p className="mt-1.5 text-xs text-danger">Ange en giltig e-postadress.</p>
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm">Inaktivt</Label>
                  <Input disabled defaultValue="Låst under granskning" />
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-1.5 block text-sm">Textruta</Label>
                  <Textarea rows={3} placeholder="Beskriv verksamheten…" />
                </div>
              </div>
              <Rule>Fälten är cirka 44 px höga, med hårfin ram. Vid fokus blir ramen lila med en mjuk ring runt.</Rule>
            </WireBox>

            <WireBox label="Val">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm">Väljare</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lokal">Lokal</SelectItem>
                      <SelectItem value="inkram">Inkråm</SelectItem>
                      <SelectItem value="bolag">Aktiebolag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1.5 block text-sm">Sökfält</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="rounded-pill pl-9" placeholder="Sök på ort, bransch eller nyckelord" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Kryssrutor</div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox defaultChecked /> Jag godkänner uppdragsavtalet
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox /> Lägg till Premium — 2 500 kr
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox disabled /> Inaktivt val
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Radioknappar</div>
                  <RadioGroup defaultValue="overlatelse" className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="overlatelse" /> Överlåtelse — 29 900 kr
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="inkram" /> Inkråm — 39 900 kr
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="aktie" /> Aktieöverlåtelse — 79 900 kr
                    </label>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Växlingsknapp (toggle)
                  </div>
                  <label className="flex items-center justify-between gap-4 text-sm">
                    <span>Visa annonsen anonymt</span>
                    <Switch checked={toggle} onCheckedChange={setToggle} />
                  </label>
                  <label className="flex items-center justify-between gap-4 text-sm">
                    <span>Mejla mig vid nya intressenter</span>
                    <Switch checked={toggle2} onCheckedChange={setToggle2} />
                  </label>
                  <label className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                    <span>Inaktiv växling</span>
                    <Switch disabled />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Växlingsknapp används när valet slår igenom direkt. Behövs ett "Spara" efteråt — använd kryssruta.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Filuppladdning</div>
                  <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-muted-foreground/40 p-6 text-center">
                    <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
                    <p className="text-sm">Dra hit filen eller klicka för att välja</p>
                    <p className="mt-1 text-xs text-muted-foreground">PDF, JPG eller PNG — max 10 MB</p>
                  </div>
                  <div className="flex items-center justify-between rounded-button border border-border bg-card px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" /> arsredovisning-2025.pdf
                    </span>
                    <Trash2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </WireBox>
          </Section>

          {/* 9 — Status */}
          <Section id="status" title="Märken & status" lead="Samma märken som annonsflödet använder.">
            <WireBox label="Annonsens lägen">
              <ul>
                {annonsstatus.map(([label, dot, desc]) => (
                  <li key={label} className="flex flex-wrap items-center gap-4 border-b border-border py-3 last:border-0">
                    <StatusDot state={dot} />
                    <span className="w-48 shrink-0 text-sm font-medium">{label}</span>
                    <span className="text-sm text-muted-foreground">{desc}</span>
                  </li>
                ))}
              </ul>
            </WireBox>
            <WireBox label="Etiketter">
              <div className="flex flex-wrap items-center gap-3">
                <WireTag className={TAG_TONE_CLASS.success}>Publicerad</WireTag>
                <WireTag className={TAG_TONE_CLASS.warning}>Komplettering krävs</WireTag>
                <WireTag className={TAG_TONE_CLASS.danger}>Avslagen</WireTag>
                <WireTag className={TAG_TONE_CLASS.neutral}>Utkast</WireTag>
                <WireTag>Lokal</WireTag>
                <WireTag active>Inkråm</WireTag>
              </div>
            </WireBox>
          </Section>

          {/* 10 — Data */}
          <Section id="data" title="Data" lead="Tabeller och nyckeltal — där sifferregeln syns tydligast.">
            <WireBox label="Tabell">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="py-2 font-normal">Objekt</th>
                    <th className="py-2 font-normal">Status</th>
                    <th className="py-2 text-right font-normal">Yta</th>
                    <th className="py-2 text-right font-normal">Pris</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Café Solsidan", "Publicerad", "142 kvm", "1 250 000 kr"],
                    ["Restaurang Vik", "Granskas", "86 kvm", "875 000 kr"],
                    ["Salong Nord", "Utkast", "54 kvm", "395 000 kr"],
                  ].map((r) => (
                    <tr key={r[0]} className="border-b border-border transition-colors hover:bg-muted/50 last:border-0">
                      <td className="py-3">{r[0]}</td>
                      <td className="py-3 text-muted-foreground">{r[1]}</td>
                      <td className="num py-3 text-right">{r[2]}</td>
                      <td className="num py-3 text-right">{r[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Rule>Endast vågräta linjer, versala kolumnrubriker och högerställda sifferkolumner.</Rule>
            </WireBox>

            <WireBox label="Nyckeltal">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  ["Omsättning", "4 250 000 kr"],
                  ["Resultat", "612 000 kr"],
                  ["Yta", "142 kvm"],
                  ["Hyra/mån", "48 500 kr"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-card border border-border p-4">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
                    <div className="num mt-1 text-xl">{value}</div>
                  </div>
                ))}
              </div>
            </WireBox>
          </Section>

          {/* 11 — Navigation */}
          <Section id="navigation" title="Navigation" lead="Hur användaren rör sig och vet var hen är.">
            <WireBox label="Flikar">
              <Tabs defaultValue="alla">
                <TabsList>
                  <TabsTrigger value="alla">Alla</TabsTrigger>
                  <TabsTrigger value="lokal">Lokal</TabsTrigger>
                  <TabsTrigger value="inkram">Inkråm</TabsTrigger>
                </TabsList>
              </Tabs>
            </WireBox>
            <WireBox label="Brödsmulor & paginering">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Start</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span>Lokaler</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-foreground">Café Solsidan</span>
              </div>
              <div className="mt-6 flex items-center gap-2">
                {["1", "2", "3"].map((p) => (
                  <span
                    key={p}
                    className={`num flex h-9 w-9 items-center justify-center rounded-button border text-sm ${
                      p === "1" ? "border-primary bg-primary text-white" : "border-border"
                    }`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </WireBox>
            <WireBox label="Stegindikator">
              <div className="flex flex-wrap items-center gap-4">
                {[
                  ["Paket", "done"],
                  ["Grunduppgifter", "done"],
                  ["Dokument", "active"],
                  ["Köpare", "pending"],
                  ["Granska", "pending"],
                ].map(([label, state]) => (
                  <span key={label} className="flex items-center gap-2 text-sm">
                    <StatusDot state={state as "done" | "active" | "pending"} />
                    {label}
                  </span>
                ))}
              </div>
            </WireBox>
          </Section>

          {/* 12 — Meddelanden */}
          <Section id="meddelanden" title="Meddelanden" lead="Information, varning, fel, bekräftelse, tomt och laddar.">
            <div className="space-y-3">
              <div className="flex gap-3 rounded-card bg-accent-wash p-4 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>TreLink skriver annonstexten och sätter priset. Du behöver inte fylla i något av det.</span>
              </div>
              <div className="flex gap-3 rounded-card bg-warning-wash p-4 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span>Uppdragsavtalet löper ut om 10 dagar.</span>
              </div>
              <div className="flex gap-3 rounded-card bg-danger-wash p-4 text-sm">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span>Filen kunde inte laddas upp. Försök igen.</span>
              </div>
              <div className="flex gap-3 rounded-card bg-success-wash p-4 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>Annonsen är inskickad till TreLink för granskning.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <WireBox label="Tomt läge">
                <div className="flex flex-col items-center py-8 text-center">
                  <FileText className="mb-3 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">Inga annonser än</p>
                  <p className="mt-1 text-sm text-muted-foreground">Skapa din första annons — det är gratis.</p>
                  <div className="mt-4">
                    <WireBtn variant="primary">Skapa annons</WireBtn>
                  </div>
                </div>
              </WireBox>
              <WireBox label="Laddar">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </WireBox>
            </div>
          </Section>

          {/* 13 — Ikoner */}
          <Section id="ikoner" title="Ikoner" lead="Lucide, en storlek, en linjetjocklek.">
            <WireBox>
              <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
                {ikoner.map(({ Icon, name }) => (
                  <div key={name} className="flex flex-col items-center gap-2 rounded-card border border-border py-4">
                    <Icon className="h-5 w-5" />
                    <span className="font-mono text-[10px] text-muted-foreground">{name}</span>
                  </div>
                ))}
              </div>
              <Rule>20 px i gränssnittet, 16 px inuti knappar och etiketter. Blanda aldrig in ikoner från andra stilar.</Rule>
            </WireBox>
          </Section>

          <Annotation>
            Sidan speglar prototypen. Ser något fel ut här ser det fel ut i hela flödet — säg till så ändrar vi på
            källan.
          </Annotation>
        </div>
      </div>
    </PublicLayout>
  );
}
