import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, StatusDot, Annotation } from "@/components/wire";

export const Route = createFileRoute("/kopare/affarer")({
  component: BuyerDeals,
});

function BuyerDeals() {
  return (
    <AppLayout mode="kopare">
      <PageHeader
        eyebrow="Köparläge"
        title="Mina affärer"
        subtitle="Pågående och avslutade affärer — samma statusvy som säljaren ser."
      />

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Pågående</h2>
      <WireBox className="mb-8">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-semibold">Restauranglokal · Södermalm</h3>
            <Annotation>Affär #A-2041 · säljare anonym tills signering</Annotation>
          </div>
          <WireTag>Pågår</WireTag>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {[
            ["Annons godkänd", "done"],
            ["Köpare matchad", "done"],
            ["Hyresvärd", "active"],
            ["Handpenning", "pending"],
            ["Signering", "pending"],
            ["Tillträde", "pending"],
          ].map(([l, s]) => (
            <div key={l} className="flex flex-col items-center gap-2 border border-dashed border-muted-foreground/30 p-3 text-center">
              <StatusDot state={s as never} />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <WireBtn variant="secondary" to="/affar/$id" params={{ id: "A-2041" }}>
            Öppna affärsdetalj →
          </WireBtn>
        </div>
      </WireBox>

      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Avslutade</h2>
      <WireBox variant="dashed">
        <p className="text-sm text-muted-foreground">Inga avslutade affärer ännu.</p>
      </WireBox>
    </AppLayout>
  );
}
