import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, Annotation } from "@/components/wire";

export const Route = createFileRoute("/faq")({
  component: FAQ,
  head: () => ({
    meta: [
      { title: "Vanliga frågor — Trelink" },
      { name: "description", content: "Svar på vanliga frågor om att sälja och köpa verksamheter via Trelink." },
    ],
  }),
});

const categories: { title: string; questions: { q: string; a: string }[] }[] = [
  {
    title: "För säljare",
    questions: [
      { q: "Vad kostar det att annonsera?", a: "Att skapa annons är gratis. Fast avgift (29 900 / 39 900 / 79 900 kr) tas ut först när affären genomförs." },
      { q: "Hur lång tid tar granskningen?", a: "Inom 24 timmar på vardagar." },
      { q: "Kan jag redigera annonsen efter publicering?", a: "Ja, men ändringar går på ny granskning innan de går live." },
      { q: "Hur länge ligger min annons uppe?", a: "90 dagar per uppdragsavtal. Kontakta oss för förlängning." },
      { q: "Vem skriver annonstexten?", a: "Trelink skriver texten baserat på dina underlag och uppgifter. Du godkänner utkastet innan publicering." },
    ],
  },
  {
    title: "För köpare",
    questions: [
      { q: "Varför får jag inte kontakta säljaren direkt?", a: "Alla dialoger går via Trelink för att skydda båda parter och säkerställa korrekt process." },
      { q: "Vem genomför visningen?", a: "Trelink samordnar visningen tillsammans med säljaren efter godkänd intresseanmälan." },
      { q: "Vad kostar det att anmäla intresse?", a: "Inget. Att anmäla intresse är kostnadsfritt. Kreditkontroll (UC) görs först senare i processen, efter signerat köpeavtal och betald handpenning." },
      { q: "Krävs BankID?", a: "Ja, för att anmäla intresse, spara favoriter och signera avtal." },
    ],
  },
  {
    title: "Avgifter & betalning",
    questions: [
      { q: "När betalar jag avgiften?", a: "Först vid tillträde. Ingen avgift innan affären är genomförd." },
      { q: "Hur hanteras handpenning?", a: "Handpenning faktureras till Trelinks klientmedelskonto och frigörs vid tillträde." },
      { q: "Vad ingår i den fasta avgiften?", a: "Granskning, annonsering, matchning, avtalshantering och signering via Signicat." },
    ],
  },
  {
    title: "Process & juridik",
    questions: [
      { q: "Hur signeras avtalet?", a: "Digitalt med BankID via Signicat. Båda parter signerar samma dokument." },
      { q: "Vad händer om hyresvärden inte godkänner köparen?", a: "Affären avbryts utan kostnad. Trelink hjälper till att hitta ny köpare." },
      { q: "Hur länge sparas mina dokument?", a: "7 år enligt god mäklarsed." },
    ],
  },
];

function FAQ() {
  return (
    <PublicLayout>
      <PageHeader eyebrow="Support" title="Vanliga frågor" subtitle="Svar på det vi får oftast." />
      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.title}>
            <Annotation>{cat.title}</Annotation>
            <div className="mt-3 space-y-3">
              {cat.questions.map((item) => (
                <WireBox key={item.q}>
                  <details>
                    <summary className="cursor-pointer font-medium">▸ {item.q}</summary>
                    <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
                  </details>
                </WireBox>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PublicLayout>
  );
}
