import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { PageHeader, Annotation } from "@/components/wire";
import { SearchBox } from "@/components/SearchFilters";
import { ListingCard } from "@/components/ListingCard";
import { lokalerSodermalmListings } from "@/lib/dummy-listings";

export const Route = createFileRoute("/lokaler")({
  component: LokalerPage,
});

// Approximate height of the sticky filter row above — not pixel-perfect,
// but keeps the list and the map's scroll area aligned in this wireframe.
const STICKY_OFFSET = "14rem";

// Klustrade områdesbubblor — representerar zoner, inte exakta adresser.
const mapClusters = [
  { id: "c1", x: 22, y: 26, pris: "2,3 Mkr" },
  { id: "c2", x: 52, y: 16, pris: "1,1 Mkr" },
  { id: "c3", x: 76, y: 32, pris: "3,4 Mkr" },
  { id: "c4", x: 34, y: 54, pris: "540 tkr" },
  { id: "c5", x: 60, y: 60, pris: "1,7 Mkr" },
  { id: "c6", x: 18, y: 76, pris: "720 tkr" },
  { id: "c7", x: 82, y: 74, pris: "5,4 Mkr" },
];

function LokalerPage() {
  return (
    <PublicLayout>
      <PageHeader
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
          {lokalerSodermalmListings.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>

        {/* Höger: karta — sticky under filterraden */}
        <aside
          className="lg:sticky"
          style={{ top: STICKY_OFFSET, maxHeight: `calc(100vh - ${STICKY_OFFSET})` }}
        >
          <div className="relative h-full min-h-[400px] overflow-hidden rounded-card border border-foreground/15 bg-muted/20">
            {/* Rutnät som antyder en karta */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="border border-muted-foreground/10" />
              ))}
            </div>

            <span className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              [ Karta ]
            </span>

            {/* Prisbubblor — områdes-/klusterzoner, inte exakta pins */}
            {mapClusters.map((c) => (
              <div
                key={c.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
                  <span className="whitespace-nowrap rounded-full border border-foreground/15 bg-background px-2 py-0.5 font-mono text-[10px] text-foreground shadow-sm">
                    {c.pris}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Annotation>
            <span className="mt-2 block">
              Kartprecision: område/kluster, aldrig exakt adress för Bolag/Inkråm — att bekräfta för Lokal-annonser.
            </span>
          </Annotation>
        </aside>
      </div>
    </PublicLayout>
  );
}
