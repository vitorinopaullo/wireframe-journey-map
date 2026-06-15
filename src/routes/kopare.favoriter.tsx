import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/kopare/favoriter")({
  component: Favorites,
});

const favs = [
  { id: "1", titel: "Restauranglokal · Södermalm", pris: "1 950 000", stad: "Stockholm", kat: "Lokal" },
  { id: "4", titel: "Butik · Vasastan", pris: "1 200 000", stad: "Stockholm", kat: "Lokal" },
  { id: "5", titel: "Frisörsalong", pris: "420 000", stad: "Uppsala", kat: "Inkråm" },
];

function Favorites() {
  return (
    <AppLayout mode="kopare">
      <PageHeader
        eyebrow="Köparläge"
        title="Sparade objekt"
        subtitle="Samla favoriter, jämför och återkom. Inga kontaktuppgifter visas — affär startar via intresseanmälan."
        right={<Annotation>{favs.length} sparade</Annotation>}
      />
      <div className="space-y-3">
        {favs.map((l) => (
          <WireBox key={l.id} className="flex items-center gap-4">
            <div className="flex h-20 w-28 shrink-0 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-[10px] text-muted-foreground">
              [ Bild ]
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <WireTag>{l.kat}</WireTag>
                <span className="text-xs text-muted-foreground">{l.stad}</span>
              </div>
              <Link to="/annons/$id" params={{ id: l.id }} className="font-medium hover:underline">
                {l.titel}
              </Link>
              <p className="mt-1 font-mono text-sm">{l.pris} kr</p>
            </div>
            <div className="flex flex-col gap-2">
              <WireBtn variant="secondary" to="/annons/$id" params={{ id: l.id }}>
                Anmäl intresse
              </WireBtn>
              <WireBtn variant="ghost">Ta bort</WireBtn>
            </div>
          </WireBox>
        ))}
      </div>
    </AppLayout>
  );
}
