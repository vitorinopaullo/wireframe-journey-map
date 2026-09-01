import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star, ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, WireBtn, WireTag, Annotation } from "@/components/wire";
import { ListingCard, type Listing as CardListing } from "@/components/ListingCard";
import { useIsAuthed } from "@/hooks/use-session";
import { nyckeltalFor } from "@/lib/nyckeltal";
import { exempelAnnons, type CatId } from "@/lib/annons-model";
import { readAnnonser } from "@/lib/annons-workflow";
import { placeholderImage } from "@/lib/placeholder-image";
import { isFavorit, toggleFavorit } from "@/lib/favoriter";

export const Route = createFileRoute("/annons/$id/")({
  component: ListingDetail,
});

/* ---------- mock data ----------
 * Delas med annonskortet på startsidan via exempelAnnons (annons-model.ts) —
 * titel/adress/pris/yta osv. kan därför aldrig divergera mellan kort och
 * detaljsida. FAQ är unikt för detaljsidan och hålls lokalt här. Samma FAQ
 * används oavsett om annonsen är en riktig, publicerad annons eller
 * exempeldatan — riktiga annonser saknar egen FAQ-data.
 */
const FAQ: [string, string][] = [
  ["Varför säljs verksamheten?", "Ägaren ska gå i pension. Driftpersonal stannar gärna."],
  ["Får jag ta över hyreskontraktet?", "Ja, med hyresvärdens godkännande. TreLink driver dialogen."],
  ["Ingår inventarier?", "Ja, allt i inventarielistan. Råvarulager räknas separat vid tillträde."],
  ["När kan tillträde ske?", "Tidigast 6 veckor efter signering — beror på hyresvärd."],
];

const KAT_NAMN: Record<CatId, "Lokal" | "Inkråm" | "Bolag"> = {
  overlatelse: "Lokal",
  inkram: "Inkråm",
  aktie: "Bolag",
};

type Listing = typeof exempelAnnons & { kategori: string; faq: [string, string][]; dokument: string[] };

// Visas för demo-annonsen (exempelAnnons) som inte har egna, riktiga dokument.
export const DEMO_DOKUMENT = ["Hyresavtal", "Hyresavi", "Bilder på verksamheten"];

/** Namnen på de dokument TreLink har granskat och godkänt för annonsen — de
 * enda dokument köparen ska kunna se listade (och, efter intresseanmälan, öppna).
 * Delas med annons.$id.underlag.tsx så att samma dokumentlista visas låst
 * (före intresseanmälan) och upplåst (efter). */
export function godkandaDokument(docs: Record<string, string> | undefined): string[] {
  if (!docs) return [];
  return Object.entries(docs)
    .filter(([, status]) => status === "godkant")
    .map(([namn]) => namn)
    .sort((a, b) => a.localeCompare(b, "sv"));
}

/** Bygger en publik listing-vy från en riktig, publicerad annons i saljare-annonser. */
function fromPublishedItem(item: any): Listing {
  const draft = item.draft ?? {};
  const cat: CatId = draft.cat ?? "overlatelse";
  const utkast = item.workflow?.utkast ?? {};
  const rawPris = utkast.pris || item.pris || "0";
  const pris = Number(String(rawPris).replace(/\D/g, "")) || 0;
  const bildLabels: string[] = draft.valdaBilderOrdning?.length ? draft.valdaBilderOrdning : draft.bilder ?? [];
  const bilder = bildLabels.length ? bildLabels.map((label: string) => placeholderImage(label)) : exempelAnnons.bilder;
  const verksamhetTyp = String(draft.verksamhet ?? "").split(",")[0]?.trim();

  return {
    id: item.id,
    cat,
    typ: verksamhetTyp || exempelAnnons.typ,
    titel: utkast.rubrik || item.titel,
    underrubrik: "",
    ort: item.ort || "",
    adress: draft.adress || "",
    yta: Number(draft.yta) || 0,
    hyra: Number(draft.hyra) || 0,
    fSkattManad: Number(draft.fSkattManad) || undefined,
    pris,
    lonsamt: false,
    beskrivning: (utkast.beskrivning || "").split(/\n+/).map((s: string) => s.trim()).filter(Boolean),
    bilder,
    planskiss: exempelAnnons.planskiss,
    kategori: KAT_NAMN[cat],
    faq: FAQ,
    dokument: godkandaDokument(draft.docs).length ? godkandaDokument(draft.docs) : DEMO_DOKUMENT,
  };
}

// Samma tre annonser (och samma fältvärden) som visas som kort på startsidan
// (src/routes/index.tsx) — så att korten alltid stämmer överens oavsett var de visas.
const liknande: CardListing[] = [
  { id: "4", kat: "Lokal", cat: "overlatelse", titel: "Butik · Vasastan", pris: "1 200 000", stad: "Stockholm", typ: "Butik", adress: "Odengatan 30", yta: 95, hyra: 33_250 },
  { id: "5", kat: "Lokal", cat: "overlatelse", titel: "Frisörsalong · Uppsala", pris: "420 000", stad: "Uppsala", typ: "Frisör", adress: "Kungsgatan 9", yta: 45, hyra: 15_000, omsattning: "980 tkr", antalAnstallda: 2, lonsamt: true },
  { id: "2", kat: "Lokal", cat: "overlatelse", titel: "Café & bageri · Göteborg", pris: "850 000", stad: "Göteborg", typ: "Café", adress: "Kyrkogatan 14", yta: 60, hyra: 22_000, fSkattManad: 1_500, omsattning: "1,9 Mkr", lonsamt: true },
];

/* ---------- helpers ---------- */
function StickyCTA({
  listing,
  scrolled,
  saved,
  onSave,
  onInterest,
}: {
  listing: Listing;
  scrolled: boolean;
  saved: boolean;
  onSave: () => void;
  onInterest: () => void;
}) {
  if (!scrolled) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/30 bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <WireTag>{listing.kategori}</WireTag>
          <span className="text-sm font-medium">{listing.titel}</span>
          <span className="font-mono text-sm tabular-nums">{listing.pris.toLocaleString("sv-SE")} kr</span>
        </div>
        <div className="flex gap-2">
          <WireBtn variant="ghost" onClick={onSave}>
            {saved ? <><Star className="h-4 w-4 mr-1 fill-current" />Sparad</> : <><Star className="h-4 w-4 mr-1" />Spara</>}
          </WireBtn>
          <WireBtn onClick={onInterest}>Se dokument →</WireBtn>
        </div>
      </div>
    </div>
  );
}

function ListingDetail() {
  const { id } = Route.useParams();
  const [saved, setSaved] = useState(() => isFavorit(id));
  const [scrolled, setScrolled] = useState(false);
  const [bild, setBild] = useState(0);
  const [lightbox, setLightbox] = useState<{ src: string; caption?: string } | null>(null);
  const [publishedItem, setPublishedItem] = useState<any | null>(null);
  const isAuthed = useIsAuthed();
  const navigate = useNavigate();

  useEffect(() => {
    const match = readAnnonser().find((i: any) => i.id === id);
    setPublishedItem(match && match.workflow?.state === "publicerad" ? match : null);
  }, [id]);

  const listing: Listing = useMemo(
    () =>
      publishedItem
        ? fromPublishedItem(publishedItem)
        : { ...exempelAnnons, kategori: KAT_NAMN[exempelAnnons.cat], faq: FAQ, dokument: DEMO_DOKUMENT },
    [publishedItem],
  );
  const ANTAL_BILDER = listing.bilder.length;
  const HANDPENNING = Math.round(listing.pris * 0.1);

  const visaForegaende = () => setBild((b) => (b - 1 + ANTAL_BILDER) % ANTAL_BILDER);
  const visaNasta = () => setBild((b) => (b + 1) % ANTAL_BILDER);
  const nyckeltal = nyckeltalFor({
    typ: listing.typ,
    cat: listing.cat,
    pris: String(listing.pris),
    adress: listing.adress,
    yta: listing.yta,
    hyra: listing.hyra,
    fSkattManad: listing.fSkattManad,
    lonsamt: listing.lonsamt,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const gotoLogin = (next: string) =>
    navigate({ to: "/logga-in", search: { next, role: "kopare" } });

  const handleInterest = () => {
    if (isAuthed) navigate({ to: "/annons/$id/intresse", params: { id } });
    else gotoLogin(`/annons/${id}/intresse`);
  };

  const handleSave = () => {
    if (!isAuthed) return gotoLogin(`/annons/${id}`);
    const next = toggleFavorit({
      annonsId: id,
      titel: listing.titel,
      pris: listing.pris,
      ort: listing.ort,
      kategori: listing.kategori,
      savedAt: new Date().toISOString(),
    });
    setSaved(next.some((f) => f.annonsId === id));
  };


  return (
    <PublicLayout>
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">← Tillbaka till sök</Link>
        <span>·</span>
        <span>Annons #{id}</span>
      </div>

      {/* Objektkort — bildgalleri, rubrik och nyckeltal */}
      <div className="mb-8 space-y-4">
        <div className="relative h-64 overflow-hidden rounded-card border border-foreground/15 bg-muted/30 md:h-96">
          <button
            type="button"
            onClick={() => setLightbox({ src: listing.bilder[bild], caption: `Bild ${bild + 1} av ${ANTAL_BILDER}` })}
            className="group h-full w-full cursor-zoom-in"
          >
            <img src={listing.bilder[bild]} alt={`${listing.titel} — bild ${bild + 1}`} className="h-full w-full object-cover" />
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-pill bg-black/60 px-3 py-1.5 text-sm text-white opacity-0 transition group-hover:opacity-100">
              <Expand className="h-3 w-3" /> Förstora
            </span>
          </button>
          <div className="absolute right-3 top-3">
            <WireTag>{listing.ort.split(" · ")[0]}</WireTag>
          </div>
          <button
            type="button"
            onClick={visaForegaende}
            aria-label="Föregående bild"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/15 bg-card transition-colors duration-150 hover:border-foreground/30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={visaNasta}
            aria-label="Nästa bild"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/15 bg-card transition-colors duration-150 hover:border-foreground/30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Miniatyrrad */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {listing.bilder.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setBild(i)}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-button border transition ${
                i === bild ? "border-[var(--color-interactive)]" : "border-foreground/15 hover:border-foreground/30"
              }`}
            >
              <img src={src} alt={`Miniatyr ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>

        <div>
          <Annotation>{listing.typ} · {listing.ort}</Annotation>
          <h1 className="mt-1 text-2xl md:text-3xl">
            {listing.titel}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ------------- LEFT ------------- */}
        <div className="space-y-6 lg:col-span-2">

          {/* Nyckeltal */}
          <WireBox label="Nyckeltal">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {nyckeltal.map((n) => (
                <div key={n.label}>
                  <Annotation>{n.label}</Annotation>
                  <div className="mt-1 font-mono text-lg tabular-nums">{n.value}</div>
                </div>
              ))}
            </div>
          </WireBox>

          {/* Beskrivning */}
          <WireBox label="Beskrivning">
            <div className="space-y-3 text-sm text-muted-foreground">
              {listing.beskrivning.map((stycke, i) => (
                <p key={i}>{stycke}</p>
              ))}
            </div>
          </WireBox>

          {/* Dokument */}
          <WireBox label="Dokument — granskade av TreLink" variant="dashed">
            <ul className="divide-y divide-foreground/10 text-sm">
              {listing.dokument.map((namn) => (
                <li key={namn} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>▤ {namn}</span>
                  <div className="flex items-center gap-2">
                    <WireTag>Godkänt</WireTag>
                    <span className="text-xs text-muted-foreground">Förhandsvisa efter intresseanmälan</span>
                  </div>
                </li>
              ))}
            </ul>
          </WireBox>

          {/* Planlösning */}
          <WireBox label="Planlösning">
            <button
              type="button"
              onClick={() => setLightbox({ src: listing.planskiss, caption: "Planlösning" })}
              className="group block h-48 w-full cursor-zoom-in overflow-hidden rounded-button border border-foreground/15"
            >
              <img src={listing.planskiss} alt="Planlösning" className="h-full w-full object-contain" />
            </button>
          </WireBox>

          {/* Karta */}
          <WireBox label="Karta">
            <div className="h-64 overflow-hidden rounded-button border border-foreground/15">
              <iframe
                title="Karta"
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${listing.adress}, ${listing.ort}`)}&output=embed`}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </WireBox>

          {/* FAQ */}
          <WireBox label="Vanliga frågor">
            <div className="divide-y divide-foreground/10">
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
          <WireBox>
            <div className="font-heading text-3xl tabular-nums">{listing.pris.toLocaleString("sv-SE")} kr</div>
            <p className="mt-1 text-xs text-muted-foreground">Inkråm + inventarier</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <Annotation>Handpenning</Annotation>
                <p className="mt-1 font-mono tabular-nums">~ {HANDPENNING.toLocaleString("sv-SE")} kr</p>
              </div>
              <div>
                <Annotation>Trelinks avgift</Annotation>
                <p className="mt-1 font-mono">vid tillträde</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <WireBtn onClick={handleInterest}>Se dokument →</WireBtn>
              <WireBtn variant="secondary" onClick={handleSave}>
                {saved ? <><Star className="h-4 w-4 mr-1 fill-current" />Sparad i favoriter</> : <><Star className="h-4 w-4 mr-1" />Spara som favorit</>}
              </WireBtn>
            </div>
          </WireBox>
        </aside>
      </div>

      {/* Liknande */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Liknande annonser</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {liknande.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      </div>

      <StickyCTA listing={listing} scrolled={scrolled} saved={saved} onSave={handleSave} onInterest={handleInterest} />
      <div className="h-20" />

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Stäng"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-background/40 text-background hover:border-background"
          >
            <X className="h-4 w-4" />
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.caption ?? ""}
            className="max-h-[85vh] max-w-full rounded-card object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.caption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-pill bg-card/90 px-3 py-1 text-xs text-foreground">
              {lightbox.caption}
            </div>
          )}
        </div>
      )}
    </PublicLayout>
  );
}
