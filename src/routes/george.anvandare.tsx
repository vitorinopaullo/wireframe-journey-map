import { createFileRoute } from "@tanstack/react-router";
import { TreLinkLayout } from "@/components/layouts/TreLinkLayout";
import { WireBox, PageHeader, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/anvandare")({
  component: Users,
});

function Users() {
  return (
    <TreLinkLayout>
      <PageHeader
        eyebrow="TreLink · adminzon"
        title="Användare & statistik"
        subtitle="Översikt över verifierade konton, aktiva annonser och affärsvolym."
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Verifierade konton", "412"],
          ["Aktiva annonser", "87"],
          ["Pågående affärer", "11"],
          ["Avslutade i år", "34"],
        ].map(([k, v]) => (
          <WireBox key={k} variant="dashed">
            <Annotation>{k}</Annotation>
            <div className="mt-1 font-mono text-2xl">{v}</div>
          </WireBox>
        ))}
      </div>
      <WireBox label="Senast verifierade">
        <ul className="divide-y divide-dashed divide-muted-foreground/30">
          {["U-410 · BankID · 14 jun", "U-409 · BankID · 14 jun", "U-408 · BankID · 13 jun"].map((u) => (
            <li key={u} className="flex items-center justify-between py-3 text-sm">
              <span className="font-mono">{u}</span>
              <WireTag>OK</WireTag>
            </li>
          ))}
        </ul>
      </WireBox>
    </TreLinkLayout>
  );
}
