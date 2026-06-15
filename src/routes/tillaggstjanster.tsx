import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, WireBtn, WireTag } from "@/components/wire";

export const Route = createFileRoute("/tillaggstjanster")({
  component: Services,
});

const services = [
  { name: "Premium-annons", price: "2 500 kr", desc: "Lyft i listan, mer exponering. Frivilligt tillägg vid annonsering." },
  { name: "Värdering", price: "Från 9 500 kr", desc: "Oberoende verksamhetsvärdering inför försäljning." },
  { name: "Avtalspaket", price: "Från 4 900 kr", desc: "Mall + granskning av överlåtelseavtal." },
  { name: "Due diligence (förenklad)", price: "Offert", desc: "För aktieaffärer — verklig huvudman, AML, firmateckning." },
];

function Services() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Tilläggstjänster"
        title="Verktyg som gör affären smidigare"
        subtitle="Alla tillval är frivilliga. Grundflödet är gratis tills affären genomförs."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {services.map((s) => (
          <WireBox key={s.name}>
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">{s.name}</h3>
              <WireTag>{s.price}</WireTag>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            <div className="mt-4">
              <WireBtn variant="secondary">Läs mer</WireBtn>
            </div>
          </WireBox>
        ))}
      </div>
    </PublicLayout>
  );
}
