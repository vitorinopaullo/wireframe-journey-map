import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, StatusDot, Annotation } from "@/components/wire";

export const Route = createFileRoute("/saljare/affarer")({
  component: SellerDeals,
});

function SellerDeals() {
  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow="Säljarläge"
        title="Mina affärer"
        subtitle="Samma statusvy som köparen ser — full transparens från annonsgodkännande till tillträde."
      />
      <WireBox>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-semibold">Restauranglokal · Södermalm</h3>
            <Annotation>Affär #A-2041 · köpare anonym tills signering</Annotation>
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
            <div key={l} className="flex flex-col items-center gap-2 rounded-card border border-foreground/15 bg-background p-3 text-center">
              <StatusDot state={s as never} />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <WireBtn variant="secondary" to="/affar/$id" params={{ id: "A-2041" }}>
            Öppna affärsdetalj →
          </WireBtn>
        </div>
      </WireBox>
    </AppLayout>
  );
}
