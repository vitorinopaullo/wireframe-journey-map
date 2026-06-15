import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireField, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/kopare/bevakningar")({
  component: Watch,
});

function Watch() {
  return (
    <AppLayout mode="kopare">
      <PageHeader
        eyebrow="Köparläge"
        title="Bevakningar"
        subtitle="Skapa sparade sökningar. Vi mejlar när en ny annons matchar dina kriterier."
      />

      <WireBox label="Skapa ny bevakning" className="mb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <WireField label="Kategori" placeholder="Lokal / Inkråm / Bolag" type="select" />
          <WireField label="Ort" placeholder="Stockholm" />
          <WireField label="Pris max" placeholder="2 500 000 kr" />
        </div>
        <div className="mt-4 flex justify-end">
          <WireBtn>Spara bevakning</WireBtn>
        </div>
      </WireBox>

      <div className="space-y-3">
        {[
          { titel: "Lokal · Stockholm < 2 Mkr", hits: 12 },
          { titel: "Inkråm · café/restaurang", hits: 4 },
          { titel: "Bolag · SaaS · ARR > 2 Mkr", hits: 2 },
        ].map((b) => (
          <WireBox key={b.titel} className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{b.titel}</h3>
              <Annotation>{b.hits} träffar · senaste 30 dagarna</Annotation>
            </div>
            <div className="flex gap-2">
              <WireTag>Aktiv</WireTag>
              <WireBtn variant="ghost">Pausa</WireBtn>
            </div>
          </WireBox>
        ))}
      </div>
    </AppLayout>
  );
}
