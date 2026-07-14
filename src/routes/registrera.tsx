import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, WireBtn, WireField, Annotation, WireTag } from "@/components/wire";

export const Route = createFileRoute("/registrera")({
  component: Register,
});

function Register() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Ett konto · två lägen"
        title="Registrera med BankID"
        subtitle="En person verifieras en gång och kan sedan både köpa och sälja. Inget separat konto för säljare/köpare."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <WireBox label="BankID-verifiering">
          <div className="flex h-56 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-sm text-muted-foreground">
            [ BankID-modul · Signicat ]
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Verifieringen är obligatorisk för att kunna spara annonser eller anmäla intresse.
          </p>
          <WireBtn className="mt-4 w-full" to="/onboarding">
            Starta BankID
          </WireBtn>

        </WireBox>

        <WireBox label="Komplettera profil">
          <div className="space-y-4">
            <WireField label="E-post" placeholder="namn@exempel.se" />
            <WireField label="Telefon" placeholder="+46 ..." />
            <WireField label="Företag (frivilligt)" placeholder="AB / Org.nr" />
            <Annotation>Notiser och besked från George skickas via mejl (Brevo / Postmark).</Annotation>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <WireTag>Anpassad start</WireTag>
            <WireTag>Växla läge</WireTag>
            <WireTag>Säker inloggning</WireTag>
          </div>
        </WireBox>
      </div>
    </PublicLayout>
  );
}
