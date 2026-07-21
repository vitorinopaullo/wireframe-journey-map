import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, Annotation } from "@/components/wire";

export const Route = createFileRoute("/om-oss")({
  component: OmOss,
  head: () => ({
    meta: [
      { title: "Om Trelink — Digitalt mäkleri för verksamhetsöverlåtelser" },
      { name: "description", content: "Trelink är Sveriges marknadsplats för verksamhetsöverlåtelser. Fast avgift, ingen provision." },
    ],
  }),
});

function OmOss() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Om oss"
        title="Om Trelink"
        subtitle="Vi gör affärsöverlåtelser transparenta, trygga och prisvärda — utan mäklarprovision."
      />
      <div className="space-y-6">
        <WireBox label="Vad vi gör">
          <p className="text-sm text-muted-foreground">
            Trelink är en digital marknadsplats där lokaler, inkråm och aktiebolag byter ägare.
            Vi granskar varje annons innan publicering, matchar parter, och driver hela affären till signering med BankID.
          </p>
        </WireBox>
        <WireBox label="Varför fast avgift">
          <p className="text-sm text-muted-foreground">
            Traditionella mäklare tar 5–10 % i provision. Vi tar en fast avgift (29 500 / 49 500 / 79 500 kr)
            som betalas först när affären genomförs. Ingen risk för säljaren.
          </p>
        </WireBox>
        <WireBox label="Teamet" variant="dashed">
          <Annotation>Placeholder — team-presentation kommer</Annotation>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {["Grundare & VD", "Mäklarchef", "Tech lead"].map((r) => (
              <div key={r} className="border border-dashed border-muted-foreground/40 p-4">
                <div className="mb-2 h-24 border border-dashed border-muted-foreground/40 bg-muted/30" />
                <div className="text-sm font-medium">[ Namn ]</div>
                <Annotation>{r}</Annotation>
              </div>
            ))}
          </div>
        </WireBox>
      </div>
    </PublicLayout>
  );
}
