import { createFileRoute } from "@tanstack/react-router";
import { GeorgeLayout } from "@/components/layouts/GeorgeLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/fakturor")({
  component: Money,
});

const invoices = [
  { id: "F-1041", deal: "A-2041", typ: "Handpenning", belopp: "195 000", state: "Skickad" },
  { id: "F-1038", deal: "A-2038", typ: "Handpenning", belopp: "120 000", state: "Betald · frigör" },
  { id: "F-1032", deal: "A-2032", typ: "Trelink-avgift", belopp: "79 500", state: "Vid tillträde" },
];

function Money() {
  return (
    <GeorgeLayout>
      <PageHeader
        eyebrow="George · adminzon"
        title="Fakturor & klientmedel"
        subtitle="Hantera handpenning, klientmedelskonto och frigörande vid tillträde. Trelinks avgift dras först vid genomförd affär."
      />

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <WireBox label="Klientmedelskonto" variant="dashed">
          <div className="font-mono text-2xl">315 000 kr</div>
          <Annotation>Total handpenning under förvaltning</Annotation>
        </WireBox>
        <WireBox label="Fakturor utestående" variant="dashed">
          <div className="font-mono text-2xl">1</div>
          <Annotation>Skickade, ej betalda</Annotation>
        </WireBox>
        <WireBox label="Att frigöra" variant="dashed">
          <div className="font-mono text-2xl">1</div>
          <Annotation>Tillträde i veckan</Annotation>
        </WireBox>
      </div>

      <WireBox label="Fakturor">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/30 text-left text-muted-foreground">
              <th className="py-2 font-mono text-[10px] uppercase tracking-wider">Faktura</th>
              <th className="font-mono text-[10px] uppercase tracking-wider">Affär</th>
              <th className="font-mono text-[10px] uppercase tracking-wider">Typ</th>
              <th className="font-mono text-[10px] uppercase tracking-wider">Belopp</th>
              <th className="font-mono text-[10px] uppercase tracking-wider">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-b border-dashed border-muted-foreground/30">
                <td className="py-3 font-mono">{i.id}</td>
                <td className="font-mono">#{i.deal}</td>
                <td>{i.typ}</td>
                <td className="font-mono">{i.belopp} kr</td>
                <td><WireTag>{i.state}</WireTag></td>
                <td className="text-right">
                  <WireBtn variant="ghost">Hantera</WireBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </WireBox>
    </GeorgeLayout>
  );
}
