import { createFileRoute } from "@tanstack/react-router";
import { GeorgeLayout } from "@/components/layouts/GeorgeLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/hyresvard")({
  component: Landlord,
});

const cases = [
  { id: "A-2041", lokal: "Restauranglokal · Södermalm", state: "Inväntar svar", sent: "13 jun" },
  { id: "A-2038", lokal: "Butikslokal · Vasastan", state: "Godkänd", sent: "8 jun" },
];

function Landlord() {
  return (
    <GeorgeLayout>
      <PageHeader
        eyebrow="George · adminzon · endast lokal"
        title="Hyresvärdsgodkännande"
        subtitle="Anonym profil skickas till hyresvärd: ekonomi · UC · verksamhetstyp. Inga personuppgifter — skyddar mot disintermediering."
      />

      <WireBox label="Vad hyresvärden ser" variant="dashed" className="mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div><Annotation>Ekonomi</Annotation><p className="mt-1 text-sm">[Omsättning, eget kapital, soliditet]</p></div>
          <div><Annotation>Kreditvärdighet</Annotation><p className="mt-1 text-sm">[UC-score]</p></div>
          <div><Annotation>Verksamhet</Annotation><p className="mt-1 text-sm">[Bransch + planerad användning]</p></div>
        </div>
        <Annotation>
          <span className="mt-3 block">INGET namn · INGEN telefon · INGEN mejl. All kommunikation går via George.</span>
        </Annotation>
      </WireBox>

      <div className="space-y-3">
        {cases.map((c) => (
          <WireBox key={c.id} className="flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <WireTag>{c.state}</WireTag>
                <span className="font-mono text-xs text-muted-foreground">#{c.id}</span>
              </div>
              <h3 className="font-medium">{c.lokal}</h3>
              <Annotation>Anonym profil skickad {c.sent}</Annotation>
            </div>
            <div className="flex gap-2">
              <WireBtn variant="ghost">Skicka påminnelse</WireBtn>
              <WireBtn variant="secondary">Registrera svar</WireBtn>
            </div>
          </WireBox>
        ))}
      </div>
    </GeorgeLayout>
  );
}
