import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, Annotation } from "@/components/wire";

export const Route = createFileRoute("/integritetspolicy")({
  component: Integritetspolicy,
  head: () => ({
    meta: [
      { title: "Integritetspolicy — Trelink" },
      { name: "description", content: "Hur Trelink behandlar personuppgifter enligt GDPR." },
    ],
  }),
});

const sections = [
  { title: "Vilka uppgifter vi samlar in", body: "Namn, personnummer, e-post, telefon, bolagsuppgifter och dokument som du laddar upp." },
  { title: "Ändamål", body: "Verifiering via BankID, granskning av annonser, matchning, avtalshantering, fakturering och lagstadgade skyldigheter." },
  { title: "Rättslig grund", body: "Avtal, rättslig förpliktelse (bokföring, penningtvättslagen) och berättigat intresse." },
  { title: "Lagringstid", body: "Kontodata: så länge kontot är aktivt. Affärsdokument: 7 år enligt god mäklarsed. Bokföringsunderlag: 7 år enligt bokföringslagen." },
  { title: "Mottagare", body: "Signicat (signering), UC (kreditupplysning), Trelinks anlitade underleverantörer, samt myndigheter vid lagkrav." },
  { title: "Dina rättigheter", body: "Tillgång, rättelse, radering (i tillämpliga fall), begränsning, dataportabilitet och att klaga till IMY." },
];

function Integritetspolicy() {
  return (
    <PublicLayout>
      <PageHeader eyebrow="GDPR" title="Integritetspolicy" subtitle="Så behandlar vi dina personuppgifter · Placeholder" />
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
