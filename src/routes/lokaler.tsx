import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { PageHeader } from "@/components/wire";
import { SearchBox } from "@/components/SearchFilters";
import { ListingCard, type Listing } from "@/components/ListingCard";

export const Route = createFileRoute("/lokaler")({
  component: LokalerPage,
});

// Approximate height of the sticky filter row above — not pixel-perfect,
// but keeps the list and the map's scroll area aligned in this wireframe.
const STICKY_OFFSET = "14rem";

const sodermalmListings: Listing[] = [
  { id: "plp1", kat: "Lokal", titel: "Restauranglokal · Hornstull", pris: "2 250 000", stad: "Stockholm · Södermalm", size: "195 m²" },
  { id: "plp2", kat: "Inkråm", titel: "Bageri & konditori — inkråm", pris: "540 000", stad: "Stockholm · Södermalm", size: "Verksamhet" },
  { id: "plp3", kat: "Bolag", titel: "Redovisningsbyrå (AB)", pris: "3 100 000", stad: "Stockholm · Södermalm", size: "Omsättning 4,2 Mkr" },
  { id: "plp4", kat: "Lokal", titel: "Butik · Folkungagatan", pris: "1 050 000", stad: "Stockholm · Södermalm", size: "82 m²" },
  { id: "plp5", kat: "Inkråm", titel: "Frisörsalong · Åsögatan", pris: "320 000", stad: "Stockholm · Södermalm", size: "Verksamhet" },
  { id: "plp6", kat: "Lokal", titel: "Kontorslokal · Bondegatan", pris: "1 680 000", stad: "Stockholm · Södermalm", size: "140 m²" },
  { id: "plp7", kat: "Lokal", titel: "Café · Nytorget", pris: "720 000", stad: "Stockholm · Södermalm", size: "58 m²" },
  { id: "plp8", kat: "Bolag", titel: "IT-konsultbolag (AB)", pris: "5 400 000", stad: "Stockholm · Södermalm", size: "Omsättning 7,1 Mkr" },
  { id: "plp9", kat: "Inkråm", titel: "Gymstudio inkl. utrustning", pris: "610 000", stad: "Stockholm · Södermalm", size: "Verksamhet" },
];

function LokalerPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Publik yta · kollektionsvy"
        title="Lediga lokaler i Södermalm"
        subtitle="Bläddra bland lediga lokaler, inkråm och bolag i området."
      />

      <div className="sticky top-0 z-30 bg-background">
        <SearchBox />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
        {/* Vänster: annonslista — skrollar oberoende av kartan */}
        <div
          className="space-y-4 lg:overflow-y-auto lg:pr-1"
          style={{ maxHeight: `calc(100vh - ${STICKY_OFFSET})` }}
        >
          {sodermalmListings.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>

        {/* Höger: karta — sticky under filterraden */}
        <aside
          className="lg:sticky"
          style={{ top: STICKY_OFFSET, maxHeight: `calc(100vh - ${STICKY_OFFSET})` }}
        >
          <div className="flex h-full min-h-[400px] items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-sm text-muted-foreground">
            [ Karta ]
          </div>
        </aside>
      </div>
    </PublicLayout>
  );
}
