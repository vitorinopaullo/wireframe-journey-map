import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/saljare/mina-annonser")({
  component: MyListings,
});

type Item = {
  id: string;
  titel: string;
  status: string;
  views: number;
  intresse: number;
  premium: boolean;
  ort?: string;
  pris?: string;
  skickadAt?: string;
};

const seed: Item[] = [
  { id: "1", titel: "Restauranglokal · Södermalm", status: "Publicerad", views: 1240, intresse: 14, premium: true },
  { id: "9", titel: "Frisörsalong · Vasastan", status: "Granskas", views: 0, intresse: 0, premium: false },
];

function MyListings() {
  const [userItems, setUserItems] = useState<Item[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("saljare-annonser");
      if (raw) setUserItems(JSON.parse(raw));
    } catch {}
  }, []);

  const items = [...userItems, ...seed];

  function remove(id: string) {
    const next = userItems.filter((i) => i.id !== id);
    setUserItems(next);
    localStorage.setItem("saljare-annonser", JSON.stringify(next));
  }

  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow="Säljarläge"
        title="Mina annonser"
        subtitle="Status: granskas / publicerad / pausad. Premium kan köpas direkt på annonsen."
        right={<WireBtn to="/saljare/skapa-annons">+ Ny annons</WireBtn>}
      />
      <div className="space-y-3">
        {items.map((i) => {
          const isNew = i.id.startsWith("n");
          return (
            <WireBox key={i.id} className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex h-24 w-36 shrink-0 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-[10px] text-muted-foreground">
                [ Bild ]
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <WireTag>{i.status}</WireTag>
                  {i.premium && <WireTag>Premium</WireTag>}
                  {isNew && <WireTag>Nyss inskickad</WireTag>}
                </div>
                <Link to="/annons/$id" params={{ id: i.id }} className="font-medium hover:underline">
                  {i.titel}
                </Link>
                <Annotation>
                  {i.status === "Granskas"
                    ? `Skickad till TreLink${i.skickadAt ? " · " + new Date(i.skickadAt).toLocaleString("sv-SE") : ""} · besked inom 24h på vardagar`
                    : `${i.views} visningar · ${i.intresse} intresseanmälningar`}
                </Annotation>
              </div>
              <div className="flex gap-2">
                <WireBtn variant="secondary">Redigera</WireBtn>
                {isNew ? (
                  <WireBtn variant="ghost" onClick={() => remove(i.id)}>Ta bort</WireBtn>
                ) : (
                  <WireBtn variant="ghost">Pausa</WireBtn>
                )}
              </div>
            </WireBox>
          );
        })}
      </div>
    </AppLayout>
  );
}
