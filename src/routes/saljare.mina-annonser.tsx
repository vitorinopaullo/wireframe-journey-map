import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { canSellerEdit, stateHint, stateLabel, type WorkflowState } from "@/lib/annons-workflow";

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
  workflow?: { state: WorkflowState };
};

const seed: Item[] = [
  { id: "1", titel: "Restauranglokal · Södermalm", status: "Publicerad", views: 1240, intresse: 14, premium: true },
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
        subtitle="Se ärendets status i realtid: granskning, uppdragsavtal, annonsutkast, publicering."
        right={<WireBtn to="/saljare/skapa-annons">+ Ny annons</WireBtn>}
      />
      <div className="space-y-3">
        {items.map((i) => {
          const isNew = i.id.startsWith("n");
          const st = i.workflow?.state as WorkflowState | undefined;
          const label = st ? stateLabel[st] : i.status;
          const hint = st ? stateHint[st] : `${i.views} visningar · ${i.intresse} intresseanmälningar`;
          const editable = st ? canSellerEdit(st) : true;
          return (
            <WireBox key={i.id} className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex h-24 w-36 shrink-0 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-[10px] text-muted-foreground">
                [ Bild ]
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <WireTag>{label}</WireTag>
                  {i.premium && <WireTag>Premium</WireTag>}
                  {st === "komplettering" && <WireTag>Åtgärd krävs</WireTag>}
                  {st === "utkast-till-saljare" && <WireTag>Åtgärd krävs</WireTag>}
                  {st === "avtal-vantar-signering" && <WireTag>Signera</WireTag>}
                </div>
                {isNew ? (
                  <Link to="/saljare/annons/$id" params={{ id: i.id }} className="font-medium hover:underline">
                    {i.titel}
                  </Link>
                ) : (
                  <Link to="/annons/$id" params={{ id: i.id }} className="font-medium hover:underline">
                    {i.titel}
                  </Link>
                )}
                <Annotation>
                  <span className="mt-1 block normal-case tracking-normal text-muted-foreground text-[11px] font-sans">
                    {hint}
                  </span>
                </Annotation>
              </div>
              <div className="flex gap-2">
                {isNew ? (
                  <>
                    <WireBtn to="/saljare/annons/$id" params={{ id: i.id }}>
                      Öppna ärendet →
                    </WireBtn>
                    {editable && (
                      <WireBtn variant="secondary" to={`/saljare/skapa-annons?edit=${i.id}`}>
                        Redigera
                      </WireBtn>
                    )}
                    {st === "avvisad" && (
                      <WireBtn variant="ghost" onClick={() => remove(i.id)}>Ta bort</WireBtn>
                    )}
                  </>
                ) : (
                  <>
                    <WireBtn variant="secondary">Redigera</WireBtn>
                    <WireBtn variant="ghost">Pausa</WireBtn>
                  </>
                )}
              </div>
            </WireBox>
          );
        })}
      </div>
    </AppLayout>
  );
}
