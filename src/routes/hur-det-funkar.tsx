import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, Annotation, WireTag } from "@/components/wire";

export const Route = createFileRoute("/hur-det-funkar")({
  component: HowItWorks,
});

const steps = [
  {
    actor: "Säljare",
    title: "Skapa annons — gratis",
    body: "Registrera med BankID. Välj kategori (lokal/inkråm/bolag). Ladda upp underlag. Premium-tillägg 2 500 kr är frivilligt.",
  },
  {
    actor: "TreLink",
    title: "Granska & publicera",
    body: "Mäklaren granskar varje dokument innan annonsen går live. Inget publiceras ogranskat.",
  },
  {
    actor: "Köpare",
    title: "Upptäcka & anmäla intresse",
    body: "Bläddra fritt utan inloggning. Verifiera med BankID för att spara, bevaka och anmäla intresse.",
  },
  {
    actor: "TreLink",
    title: "Matchning",
    body: "TreLink matchar parterna. Vid lokal: anonym profil till hyresvärd för godkännande.",
  },
  {
    actor: "Båda",
    title: "Signering med BankID (Signicat)",
    body: "Båda parter signerar avtalet. Handpenning faktureras till klientmedelskonto.",
  },
  {
    actor: "TreLink",
    title: "Tillträde & frigörande",
    body: "Vid tillträde frigörs medel. Säljaren får betalt — Trelinks avgift (29,5/49,5/79,5k) tas ut nu, först nu.",
  },
];

function HowItWorks() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Affärsflöde"
        title="Hur det funkar"
        subtitle="Gratis hela vägen tills affären genomförs. TreLink är navet varje affär passerar — statusen syns för båda parter."
      />

      <div className="space-y-4">
        {steps.map((s, i) => (
          <WireBox key={i} className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="flex w-20 shrink-0 flex-col items-start">
              <span className="font-mono text-3xl text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <WireTag>{s.actor}</WireTag>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </WireBox>
        ))}
      </div>

      <WireBox label="Tre kategorier — tre flöden" variant="dashed" className="mt-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <Annotation>Lokal</Annotation>
            <p className="mt-1 text-sm">Hyresvärden måste godkänna köparen — anonym profil skickas (ekonomi + verksamhet, inga personuppgifter).</p>
          </div>
          <div>
            <Annotation>Inkråm</Annotation>
            <p className="mt-1 text-sm">Tillgångar säljs till köparens bolag. TreLink godkänner varje dokument. Leverantörer tas över i drift.</p>
          </div>
          <div>
            <Annotation>Aktiebolag</Annotation>
            <p className="mt-1 text-sm">Hela bolaget byter ägare. Verklig huvudman, firmateckning och AML blir centrala.</p>
          </div>
        </div>
      </WireBox>
    </PublicLayout>
  );
}
