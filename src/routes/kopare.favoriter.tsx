import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { readFavoriter, removeFavorit, type Favorit } from "@/lib/favoriter";
import { getSession } from "@/lib/mock-auth";

export const Route = createFileRoute("/kopare/favoriter")({
  component: Favorites,
});

function Favorites() {
  const [favoriter, setFavoriter] = useState<Favorit[]>([]);

  useEffect(() => {
    const userId = getSession()?.userId;
    setFavoriter(readFavoriter(userId));
  }, []);

  function remove(annonsId: string) {
    const userId = getSession()?.userId ?? "";
    setFavoriter(removeFavorit(annonsId, userId));
  }

  return (
    <AppLayout mode="kopare">
      <PageHeader
        eyebrow="Köparläge"
        title="Sparade objekt"
        subtitle="Samla favoriter, jämför och återkom. Inga kontaktuppgifter visas — affär startar via intresseanmälan."
        right={
          <div className="flex items-center gap-2">
            <Annotation>{favoriter.length} sparade</Annotation>
            <WireBtn variant="secondary" to="/kopare/jamfor" params={{}}>Jämför alla →</WireBtn>
          </div>
        }
      />
      {favoriter.length === 0 ? (
        <WireBox variant="dashed">
          <p className="text-sm text-muted-foreground">
            Inga sparade objekt än — bläddra bland annonser för att spara favoriter.
          </p>
          <WireBtn variant="secondary" to="/" className="mt-4">
            Till annonser →
          </WireBtn>
        </WireBox>
      ) : (
        <div className="space-y-3">
          {favoriter.map((f) => (
            <WireBox key={f.annonsId} className="flex items-center gap-4">
              <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-card border border-foreground/15 bg-muted/20 text-[10px] text-muted-foreground">
                [ Bild ]
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <WireTag>{f.kategori}</WireTag>
                  <span className="text-xs text-muted-foreground">{f.ort}</span>
                </div>
                <Link to="/annons/$id" params={{ id: f.annonsId }} className="font-medium hover:underline">
                  {f.titel}
                </Link>
                <p className="mt-1 font-mono text-sm">{f.pris.toLocaleString("sv-SE")} kr</p>
              </div>
              <div className="flex flex-col gap-2">
                <WireBtn variant="secondary" to="/annons/$id/intresse" params={{ id: f.annonsId }}>
                  Anmäl intresse
                </WireBtn>
                <WireBtn variant="ghost" onClick={() => remove(f.annonsId)}>Ta bort</WireBtn>
              </div>
            </WireBox>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
