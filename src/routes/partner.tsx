import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, WireBtn, Annotation } from "@/components/wire";

export const Route = createFileRoute("/partner")({
  component: PartnerPage,
  head: () => ({
    meta: [
      { title: "Bli partner — Trelink" },
      {
        name: "description",
        content:
          "Samarbeta med Trelink som redovisningsbyrå, jurist, bank eller fastighetsägare och hjälp fler verksamheter att byta ägare.",
      },
      { property: "og:title", content: "Bli partner — Trelink" },
      {
        property: "og:description",
        content:
          "Samarbeta med Trelink som redovisningsbyrå, jurist, bank eller fastighetsägare.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const partnerTypes = [
  {
    title: "Redovisningsbyrå",
    body: "Hänvisa kunder som ska sälja eller köpa verksamhet. Vi sköter förmedling, granskning och avtal.",
  },
  {
    title: "Jurist & advokat",
    body: "Bistå med avtalsgranskning och due diligence i affärer som förmedlas via Trelink.",
  },
  {
    title: "Bank & finansiering",
    body: "Möt köpare med granskat underlag och färdig affärsdokumentation.",
  },
  {
    title: "Fastighetsägare & hyresvärd",
    body: "Få snabbare övertag av lokaler med verifierade och kreditkontrollerade övertagare.",
  },
];

function PartnerPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Bli partner"
        title="Samarbeta med Trelink"
        subtitle="Vi arbetar med rådgivare, banker och fastighetsägare som möter företagare i ägarskifte."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {partnerTypes.map((p) => (
          <WireBox key={p.title}>
            <h3 className="font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
          </WireBox>
        ))}
      </div>

      <WireBox label="Så fungerar partnerskapet" className="mt-8">
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li>1. Ni hänvisar en säljare eller köpare till Trelink.</li>
          <li>2. Vi granskar underlaget och tar hand om hela förmedlingen.</li>
          <li>3. Ni får löpande status på era hänvisade ärenden.</li>
        </ol>
      </WireBox>

      <WireBox label="Intresseanmälan" variant="dashed" className="mt-8">
        <Annotation>Formulär — wireframe (företag, kontaktperson, e-post, typ av partner)</Annotation>
        <div className="mt-4">
          <WireBtn variant="primary" to="/kontakt">
            Kontakta oss om partnerskap →
          </WireBtn>
        </div>
      </WireBox>
    </PublicLayout>
  );
}
