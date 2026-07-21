import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, Annotation } from "@/components/wire";

export const Route = createFileRoute("/cookies")({
  component: Cookies,
  head: () => ({
    meta: [
      { title: "Cookies — Trelink" },
      { name: "description", content: "Hur Trelink använder cookies." },
    ],
  }),
});

const sections = [
  { title: "Vad är cookies?", body: "Små textfiler som lagras i din webbläsare för att tjänsten ska fungera och för att förbättra din upplevelse." },
  { title: "Nödvändiga cookies", body: "Krävs för inloggning, sessioner och säkerhet. Kan inte stängas av." },
  { title: "Analys", body: "Anonymiserad statistik för att förstå hur tjänsten används. Kräver samtycke." },
  { title: "Lagringstid", body: "Sessionscookies raderas när du stänger webbläsaren. Permanenta cookies lagras upp till 12 månader." },
  { title: "Hantera samtycke", body: "Du kan när som helst ändra dina val via cookie-inställningarna i sidfoten." },
];

function Cookies() {
  return (
    <PublicLayout>
      <PageHeader eyebrow="Cookies" title="Cookies" subtitle="Så använder vi cookies · Placeholder" />
      <div className="space-y-4">
        {sections.map((s) => (
          <WireBox key={s.title}>
            <h3 className="font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            <Annotation>[ Fullständig text tillkommer ]</Annotation>
          </WireBox>
        ))}
      </div>
    </PublicLayout>
  );
}
