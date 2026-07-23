import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, Annotation } from "@/components/wire";
import { SearchBox } from "@/components/SearchFilters";

export const Route = createFileRoute("/lokaler")({
  component: LokalerPage,
});

// Approximate height of the sticky filter row above — not pixel-perfect,
// but keeps the list and the map's scroll area aligned in this wireframe.
const STICKY_OFFSET = "14rem";

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
        {/* Vänster: annonslista — tom, fylls i nästa steg */}
        <div
          className="lg:overflow-y-auto lg:pr-1"
          style={{ maxHeight: `calc(100vh - ${STICKY_OFFSET})` }}
        >
          <WireBox
            variant="dashed"
            className="flex h-full min-h-[400px] items-center justify-center"
          >
            <Annotation>Annonskort renderas här i nästa steg</Annotation>
          </WireBox>
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
