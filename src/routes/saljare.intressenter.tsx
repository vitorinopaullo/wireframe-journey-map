import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/saljare/intressenter")({
  component: Interest,
});

const rows = [
  { date: "14 jun", annons: "Restauranglokal · Södermalm", code: "K-208", state: "Ny" },
  { date: "13 jun", annons: "Restauranglokal · Södermalm", code: "K-204", state: "Matchad" },
  { date: "11 jun", annons: "Restauranglokal · Södermalm", code: "K-198", state: "Bedöms av TreLink" },
  { date: "10 jun", annons: "Restauranglokal · Södermalm", code: "K-191", state: "Avvisad" },
];

function Interest() {
  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow="Säljarläge"
        title="Intresse på mina annonser"
        subtitle="Du ser ATT det finns intresse — TreLink driver matchningen. Köparens identitet skyddas tills signering."
      />
      <WireBox>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/30 text-left text-muted-foreground">
              <th className="py-2 font-mono text-[10px] uppercase tracking-wider">Datum</th>
              <th className="font-mono text-[10px] uppercase tracking-wider">Annons</th>
              <th className="font-mono text-[10px] uppercase tracking-wider">Köpare</th>
              <th className="font-mono text-[10px] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-dashed border-muted-foreground/30">
                <td className="py-3">{r.date}</td>
                <td>{r.annons}</td>
                <td className="font-mono">{r.code}</td>
                <td><WireTag>{r.state}</WireTag></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Annotation>
          <span className="mt-4 block">Inga kontaktuppgifter visas. Besked från TreLink kommer via mejl.</span>
        </Annotation>
      </WireBox>
    </AppLayout>
  );
}
