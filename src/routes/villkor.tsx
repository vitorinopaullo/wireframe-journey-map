import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, Annotation } from "@/components/wire";

export const Route = createFileRoute("/villkor")({
  component: Villkor,
  head: () => ({
    meta: [
      { title: "Användarvillkor — Trelink" },
      { name: "description", content: "Trelinks användarvillkor för säljare och köpare." },
    ],
  }),
});

const sections = [
  { n: "1", title: "Om tjänsten", body: "Trelink AB tillhandahåller en digital marknadsplats för överlåtelser av lokaler, inkråm och aktiebolag." },
  { n: "2", title: "Avgifter", body: "Fast avgift (29 900 / 39 900 / 79 900 kr) faktureras säljaren först vid tillträde. Att skapa annons är gratis." },
  { n: "3", title: "Uppdragsavtal", body: "Uppdragsavtal tecknas mellan Trelink och säljare innan annonsen publiceras. Uppdraget gäller 90 dagar." },
  { n: "4", title: "Ansvar", body: "Trelink agerar mellanhand. Parterna ansvarar själva för korrektheten i uppgifter och för att fullfölja affären." },
  { n: "5", title: "Dokumenthantering", body: "Alla dokument arkiveras i 7 år enligt god mäklarsed (fastighetsmäklarlagen 4 kap.)." },
  { n: "6", title: "Tvist", body: "Tvist avgörs enligt svensk rätt vid Stockholms tingsrätt som första instans." },
];

function Villkor() {
  return (
    <PublicLayout>
      <PageHeader eyebrow="Juridik" title="Användarvillkor" subtitle="Senast uppdaterad: 2026-01-01 · Placeholder" />
      <div className="space-y-4">
        {sections.map((s) => (
          <WireBox key={s.n}>
            <div className="flex gap-4">
              <span className="font-mono text-2xl text-muted-foreground">{s.n}.</span>
              <div className="flex-1">
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                <Annotation>[ Fullständig juridisk text tillkommer ]</Annotation>
              </div>
            </div>
          </WireBox>
        ))}
      </div>
    </PublicLayout>
  );
}
