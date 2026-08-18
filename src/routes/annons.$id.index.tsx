import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star, ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, WireBtn, WireTag, Annotation } from "@/components/wire";
import { useIsAuthed } from "@/hooks/use-session";
import { nyckeltalFor } from "@/lib/nyckeltal";
import { exempelAnnons, type CatId } from "@/lib/annons-model";
import { readAnnonser } from "@/lib/annons-workflow";
import { placeholderImage } from "@/lib/placeholder-image";

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

type Listing = typeof exempelAnnons & { kategori: string; faq: [string, string][] };

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
    hasFTax: false,
    pris,
    lonsamt: false,
    beskrivning: (utkast.beskrivning || "").split(/\n+/).map((s: string) => s.trim()).filter(Boolean),
    bilder,
    planskiss: exempelAnnons.planskiss,
    kategori: KAT_NAMN[cat],
    faq: FAQ,
  };
}

const liknande = [
  { id: "4", titel: "Butik · Vasastan", pris: "1 200 000", kat: "Lokal" },
  { id: "5", titel: "Frisörsalong · Uppsala", pris: "420 000", kat: "Inkråm" },
  { id: "2", titel: "Café & bageri", pris: "850 000", kat: "Inkråm" },
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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/30 bg-background/95 backdrop-blur">
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
        : { ...exempelAnnons, kategori: KAT_NAMN[exempelAnnons.cat], faq: FAQ },
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
    hasFTax: listing.hasFTax,
    lonsamt: listing.lonsamt,
  });

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

      {/* Objektkort — bildgalleri, rubrik och nyckeltal */}
      <div className="mb-8 space-y-4">
        <div className="relative h-64 overflow-hidden rounded-card border border-foreground/15 bg-muted/30 md:h-96">
          <button
            type="button"
            onClick={() => setLightbox({ src: listing.bilder[bild], caption: `Bild ${bild + 1} av ${ANTAL_BILDER}` })}
            className="group h-full w-full cursor-zoom-in"
          >
            <img src={listing.bilder[bild]} alt={`${listing.titel} — bild ${bild + 1}`} className="h-full w-full object-cover" />
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-pill bg-foreground/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-background opacity-0 transition group-hover:opacity-100">
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
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/40 bg-background transition hover:border-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={visaNasta}
            aria-label="Nästa bild"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/40 bg-background transition hover:border-foreground"
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
                i === bild ? "border-[var(--color-interactive)]" : "border-foreground/15 hover:border-foreground/40"
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
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{listing.underrubrik}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ------------- LEFT ------------- */}
        <div className="space-y-6 lg:col-span-2">

          {/* Beskrivning */}
          <WireBox label="Beskrivning">
            <div className="space-y-3 text-sm text-muted-foreground">
              {listing.beskrivning.map((stycke, i) => (
                <p key={i}>{stycke}</p>
              ))}
            </div>
          </WireBox>

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
          </WireBox>

          <WireBox label="Nästa steg">
            <ol className="mb-4 space-y-2 text-xs">
              {[
                ["1", "Anmäl intresse (gratis, BankID)"],
                ["2", "TreLink matchar dig med säljaren"],
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
              <p className="mt-2 font-mono text-sm tabular-nums">{l.pris} kr</p>
            </Link>
          ))}
        </div>
      </div>

      <StickyCTA listing={listing} scrolled={scrolled} saved={saved} onSave={handleSave} onInterest={handleInterest} />
      <div className="h-20" />

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4"
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
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-pill bg-background/90 px-3 py-1 text-xs text-foreground">
              {lightbox.caption}
            </div>
          )}
        </div>
      )}
    </PublicLayout>
  );
}
