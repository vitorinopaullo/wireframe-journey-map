import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Star,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Banknote,
  Tag,
  Building2,
  Percent,
  type LucideIcon,
} from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";
import { useIsAuthed } from "@/hooks/use-session";

export const Route = createFileRoute("/annons/$id/")({
  component: ListingDetail,
});

/* ---------- mock data ---------- */
const ANTAL_BILDER = 4;

const listing = {
  id: "1",
  kategori: "Lokal",
  rubrik: "Restauranglokal · 180 m² · Hornstull",
  underrubrik:
    "Fullt utrustad restauranglokal med uteservering. Lång hyresperiod kvar, fungerande ventilation, A-läge.",
  adress: "Hornsgatan 45",
  typ: "Restaurang",
  yta: 180,
  hyra: 62_000,
  // F-Skatt är ett fristående fält satt av säljaren — oberoende av kategori/typ.
  hasFTax: true,
  ort: "Stockholm · Södermalm",
  pris: 1_950_000,
  publicerad: "28 maj 2026",
  uppdaterad: "12 jun 2026",
  visningar: 412,
  intressenter: 7,
  nyckeltal: [
    ["Omsättning", "8,4 Mkr"],
    ["Resultat", "+ 1,1 Mkr"],
    ["Hyra/mån", "62 000 kr"],
    ["Anställda", "9 st"],
    ["Hyresperiod kvar", "4 år + 3"],
    ["Etablerad", "2014"],
  ],
  dokument: [
    { namn: "Hyreskontrakt.pdf", status: "godkänt" },
    { namn: "Resultaträkning 2024.pdf", status: "godkänt" },
    { namn: "Resultaträkning 2023.pdf", status: "godkänt" },
    { namn: "Inventarielista.pdf", status: "godkänt" },
    { namn: "Personalöversikt.pdf", status: "godkänt" },
  ],
  faq: [
    ["Varför säljs verksamheten?", "Ägaren ska gå i pension. Driftpersonal stannar gärna."],
    ["Får jag ta över hyreskontraktet?", "Ja, med hyresvärdens godkännande. TreLink driver dialogen."],
    ["Ingår inventarier?", "Ja, allt i inventarielistan. Råvarulager räknas separat vid tillträde."],
    ["När kan tillträde ske?", "Tidigast 6 veckor efter signering — beror på hyresvärd."],
  ],
};

const liknande = [
  { id: "4", titel: "Butik · Vasastan", pris: "1 200 000", kat: "Lokal" },
  { id: "5", titel: "Frisörsalong · Uppsala", pris: "420 000", kat: "Inkråm" },
  { id: "2", titel: "Café & bageri", pris: "850 000", kat: "Inkråm" },
];

/* ---------- helpers ---------- */
function StatTile({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-start gap-3 border p-3",
        highlight ? "border-foreground bg-foreground text-background" : "border-foreground/30 bg-background",
      ].join(" ")}
    >
      <Icon className={["mt-0.5 h-4 w-4 shrink-0", highlight ? "text-background" : "text-muted-foreground"].join(" ")} />
      <div>
        <div
          className={[
            "font-mono text-[10px] uppercase tracking-wider",
            highlight ? "text-background/70" : "text-muted-foreground",
          ].join(" ")}
        >
          {label}
        </div>
        <div className="mt-0.5 text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function StickyCTA({
  scrolled,
  saved,
  onSave,
  onInterest,
}: {
  scrolled: boolean;
  saved: boolean;
  onSave: () => void;
  onInterest: () => void;
}) {
  if (!scrolled) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/30 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <WireTag>{listing.kategori}</WireTag>
          <span className="text-sm font-medium">{listing.rubrik}</span>
          <span className="font-mono text-sm">{listing.pris.toLocaleString("sv-SE")} kr</span>
        </div>
        <div className="flex gap-2">
          <WireBtn variant="ghost" onClick={onSave}>
            {saved ? <><Star className="h-4 w-4 mr-1 fill-current" />Sparad</> : <><Star className="h-4 w-4 mr-1" />Spara</>}
          </WireBtn>
          <WireBtn onClick={onInterest}>Anmäl intresse →</WireBtn>
        </div>
      </div>
    </div>
  );
}

function ListingDetail() {
  const { id } = Route.useParams();
  const [saved, setSaved] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bild, setBild] = useState(0);
  const isAuthed = useIsAuthed();
  const navigate = useNavigate();

  const visaForegaende = () => setBild((b) => (b - 1 + ANTAL_BILDER) % ANTAL_BILDER);
  const visaNasta = () => setBild((b) => (b + 1) % ANTAL_BILDER);
  const hyraPerKvm = Math.round(listing.hyra / listing.yta);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const gotoLogin = (next: string) =>
    navigate({ to: "/logga-in", search: { next } });

  const handleInterest = () => {
    if (isAuthed) navigate({ to: "/annons/$id/intresse", params: { id } });
    else gotoLogin(`/annons/${id}/intresse`);
  };

  const handleSave = () => {
    if (!isAuthed) return gotoLogin(`/annons/${id}`);
    setSaved((v) => !v);
  };


  return (
    <PublicLayout>
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">← Tillbaka till sök</Link>
        <span>·</span>
        <span>Annons #{id}</span>
      </div>

      {/* Objektkort — bildkarusell, rubrik och nyckeltal */}
      <div className="mb-8 space-y-4">
        <div className="relative h-64 border border-foreground/30 bg-muted/30 md:h-96">
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            [ Bild {bild + 1} av {ANTAL_BILDER} ]
          </div>
          <div className="absolute right-3 top-3">
            <WireTag>{listing.ort.split(" · ")[0]}</WireTag>
          </div>
          <button
            type="button"
            onClick={visaForegaende}
            aria-label="Föregående bild"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-foreground/40 bg-background transition hover:border-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={visaNasta}
            aria-label="Nästa bild"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-foreground/40 bg-background transition hover:border-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div>
          <Annotation>{listing.typ} · {listing.ort}</Annotation>
          <h1 className="mt-1 text-2xl md:text-3xl">
            {listing.adress} · {listing.yta} m²
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{listing.underrubrik}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <WireTag><CheckCircle2 className="inline-block h-3 w-3 mr-1 align-middle" />Granskad av TreLink</WireTag>
          <WireTag>Premium</WireTag>
          <WireTag>{listing.intressenter} intressenter</WireTag>
          {listing.hasFTax && <WireTag>F-skatt</WireTag>}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <StatTile icon={Maximize} label="Yta" value={`${listing.yta} kvm`} />
          <StatTile icon={Banknote} label="Pris" value={`${listing.pris.toLocaleString("sv-SE")} kr`} highlight />
          <StatTile icon={Tag} label="Hyra" value={`${listing.hyra.toLocaleString("sv-SE")} kr/mån`} />
          <StatTile icon={Building2} label="Typ" value={listing.typ} />
          <StatTile icon={Percent} label="Hyra / kvm" value={`${hyraPerKvm} kr/kvm`} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ------------- LEFT ------------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Trust-rad */}
          <WireBox label="Vad TreLink har verifierat" variant="dashed">
            <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              {[
                "Säljarens identitet (BankID)",
                "Org.nr & ägarstruktur",
                "Hyreskontrakt giltigt",
                "Resultat- och balansräkning (2 år)",
                "Inventarielista mot bokföring",
                "Ingen pågående tvist/skuld",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <StatusDot state="done" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Annotation>
              <span className="mt-3 block">
                TreLink står som mellanhand. Inga uppgifter byts mellan parter förrän handpenning är inne.
              </span>
            </Annotation>
          </WireBox>

          {/* Beskrivning */}
          <WireBox label="Beskrivning">
            <p className="text-sm text-muted-foreground">
              [Säljarens beskrivning av verksamheten / lokalen. Granskad av TreLink innan publicering.
              Inkluderar bakgrund, inventarier, omsättning, personal, hyresvillkor.]
            </p>
          </WireBox>

          {/* Nyckeltal */}
          <WireBox label="Nyckeltal">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {listing.nyckeltal.map(([k, v]) => (
                <div key={k}>
                  <Annotation>{k}</Annotation>
                  <div className="mt-1 font-mono text-lg">{v}</div>
                </div>
              ))}
            </div>
          </WireBox>

          {/* Dokument */}
          <WireBox label="Dokument — granskade av TreLink" variant="dashed">
            <ul className="space-y-2 text-sm">
              {listing.dokument.map((d) => (
                <li
                  key={d.namn}
                  className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 py-2"
                >
                  <span>▤ {d.namn}</span>
                  <div className="flex items-center gap-2">
                    <WireTag>Godkänt</WireTag>
                    <span className="text-xs text-muted-foreground">Förhandsvisa efter intresseanmälan</span>
                  </div>
                </li>
              ))}
            </ul>
          </WireBox>

          {/* FAQ */}
          <WireBox label="Vanliga frågor">
            <div className="divide-y divide-dashed divide-muted-foreground/30">
              {listing.faq.map(([q, a]) => (
                <details key={q} className="group py-3">
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                    {q}
                    <span className="font-mono text-xs text-muted-foreground group-open:rotate-45 transition">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </WireBox>
        </div>

        {/* ------------- RIGHT (sticky) ------------- */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <WireBox label="Pris">
            <div className="font-mono text-3xl">{listing.pris.toLocaleString("sv-SE")} kr</div>
            <p className="mt-1 text-xs text-muted-foreground">Inkråm + inventarier</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <Annotation>Handpenning</Annotation>
                <p className="mt-1 font-mono">~ 195 000 kr</p>
              </div>
              <div>
                <Annotation>Trelinks avgift</Annotation>
                <p className="mt-1 font-mono">vid tillträde</p>
              </div>
            </div>
          </WireBox>

          <WireBox label="Nästa steg">
            <ol className="mb-4 space-y-2 text-xs">
              {[
                ["1", "Anmäl intresse (gratis, BankID)"],
                ["2", "TreLink kör UC + matchar"],
                ["3", "Du får full info & hyresvärd kontrolleras"],
                ["4", "Handpenning till klientmedel"],
                ["5", "Signera digitalt (Signicat)"],
                ["6", "Tillträde — säljaren får betalt"],
              ].map(([n, t]) => (
                <li key={n} className="flex gap-2">
                  <span className="font-mono text-muted-foreground">{n}.</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-2">
              <WireBtn onClick={handleInterest}>Anmäl intresse →</WireBtn>
              <WireBtn variant="secondary" onClick={handleSave}>
                {saved ? <><Star className="h-4 w-4 mr-1 fill-current" />Sparad i favoriter</> : <><Star className="h-4 w-4 mr-1" />Spara som favorit</>}
              </WireBtn>
              <WireBtn variant="ghost" to="/kopare/bevakningar">
                Bevaka liknande
              </WireBtn>
            </div>
            <Annotation>
              <span className="mt-3 block">
                Inga kontaktuppgifter byts. TreLink når dig på mejl inom 24 h.
              </span>
            </Annotation>
          </WireBox>

          <WireBox label="Statistik" variant="ghost">
            <ul className="space-y-1 text-xs">
              <li className="flex justify-between"><span>Publicerad</span><span>{listing.publicerad}</span></li>
              <li className="flex justify-between"><span>Uppdaterad</span><span>{listing.uppdaterad}</span></li>
              <li className="flex justify-between"><span>Visningar</span><span>{listing.visningar}</span></li>
              <li className="flex justify-between"><span>Intresseanmälningar</span><span>{listing.intressenter}</span></li>
            </ul>
          </WireBox>
        </aside>
      </div>

      {/* Liknande */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Liknande annonser</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {liknande.map((l) => (
            <Link
              key={l.id}
              to="/annons/$id"
              params={{ id: l.id }}
              className="group block border border-foreground/30 bg-background p-4 hover:border-foreground transition"
            >
              <div className="mb-3 flex h-24 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-[10px] text-muted-foreground">
                [ Bild ]
              </div>
              <WireTag>{l.kat}</WireTag>
              <h3 className="mt-2 font-medium group-hover:underline">{l.titel}</h3>
              <p className="mt-2 font-mono text-sm">{l.pris} kr</p>
            </Link>
          ))}
        </div>
      </div>

      <StickyCTA scrolled={scrolled} saved={saved} onSave={handleSave} onInterest={handleInterest} />
      <div className="h-20" />
    </PublicLayout>
  );
}
