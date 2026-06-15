import { createFileRoute } from "@tanstack/react-router";
import { GeorgeLayout } from "@/components/layouts/GeorgeLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/annonser")({
  component: ReviewListings,
});

const queue = [
  { id: "9", titel: "Frisörsalong · Vasastan", kat: "Inkråm", saljare: "S-104", docs: 4, missing: 0 },
  { id: "10", titel: "Café · Linné", kat: "Inkråm", saljare: "S-122", docs: 5, missing: 1 },
  { id: "11", titel: "Butikslokal · Malmö", kat: "Lokal", saljare: "S-77", docs: 3, missing: 0 },
  { id: "12", titel: "SaaS-bolag B2B", kat: "Bolag", saljare: "S-201", docs: 7, missing: 2 },
];

function ReviewListings() {
  return (
    <GeorgeLayout>
      <PageHeader
        eyebrow="George · adminzon"
        title="Granska annonser & dokument"
        subtitle="Inget publiceras ogranskat. Godkänn varje dokument innan annonsen går live."
      />
      <div className="space-y-3">
        {queue.map((q) => (
          <WireBox key={q.id} className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <WireTag>{q.kat}</WireTag>
                <span className="text-xs text-muted-foreground">Säljare {q.saljare}</span>
              </div>
              <h3 className="font-medium">{q.titel}</h3>
              <Annotation>{q.docs} dokument · {q.missing > 0 ? `${q.missing} saknas/begärs in` : "alla inlämnade"}</Annotation>
            </div>
            <div className="flex gap-2">
              <WireBtn variant="ghost">Be om komplettering</WireBtn>
              <WireBtn variant="secondary">Avvisa</WireBtn>
              <WireBtn>Godkänn & publicera</WireBtn>
            </div>
          </WireBox>
        ))}
      </div>
    </GeorgeLayout>
  );
}
