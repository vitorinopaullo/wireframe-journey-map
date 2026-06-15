import { createFileRoute, Link } from "@tanstack/react-router";
import { GeorgeLayout } from "@/components/layouts/GeorgeLayout";
import { WireBox, PageHeader, WireBtn, WireTag, StatusDot, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/affarer")({
  component: GeorgeDeals,
});

const deals = [
  { id: "A-2041", titel: "Restauranglokal · Södermalm", kat: "Lokal", state: "Hyresvärd", step: 3 },
  { id: "A-2039", titel: "Café · Linné (inkråm)", kat: "Inkråm", state: "Signering", step: 5 },
  { id: "A-2038", titel: "Butikslokal · Vasastan", kat: "Lokal", state: "Handpenning", step: 4 },
  { id: "A-2032", titel: "SaaS-bolag", kat: "Bolag", state: "Matchning · AML", step: 2 },
];

function GeorgeDeals() {
  return (
    <GeorgeLayout>
      <PageHeader
        eyebrow="George · adminzon"
        title="Driv affärer"
        subtitle="Matcha köpare & säljare, kör UC, hantera hyresvärd, styr status. Båda parter ser samma vy."
      />
      <div className="space-y-3">
        {deals.map((d) => (
          <WireBox key={d.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <WireTag>{d.kat}</WireTag>
                  <span className="font-mono text-xs text-muted-foreground">#{d.id}</span>
                </div>
                <h3 className="font-medium">{d.titel}</h3>
                <Annotation>Nuvarande steg: {d.state}</Annotation>
              </div>
              <div className="flex gap-2">
                <Link to="/affar/$id" params={{ id: d.id }} className="border border-foreground/40 px-3 py-1.5 text-xs">
                  Visa parter-vy
                </Link>
                <WireBtn variant="secondary">Uppdatera status</WireBtn>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {["Annons", "Match", "Hyresvärd", "Handpenning", "Signering", "Tillträde"].map((l, i) => {
                const s = i < d.step ? "done" : i === d.step ? "active" : "pending";
                return (
                  <div key={l} className="flex flex-col items-center gap-1 border border-dashed border-muted-foreground/30 p-2 text-center">
                    <StatusDot state={s as never} />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{l}</span>
                  </div>
                );
              })}
            </div>
          </WireBox>
        ))}
      </div>
    </GeorgeLayout>
  );
}
