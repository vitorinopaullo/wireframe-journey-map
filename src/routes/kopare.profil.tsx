import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireField, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/kopare/profil")({
  component: Profile,
});

function Profile() {
  return (
    <AppLayout mode="kopare">
      <PageHeader
        eyebrow="Köparläge"
        title="Profil & fakturor"
        subtitle="Kontaktuppgifter används endast av George — visas aldrig för säljare innan signering."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WireBox label="Mina uppgifter">
          <div className="space-y-4">
            <WireField label="Namn" placeholder="Anna Andersson" hint="Hämtas från BankID" />
            <WireField label="E-post" placeholder="anna@exempel.se" />
            <WireField label="Telefon" placeholder="+46 70 ..." />
            <WireField label="Företag (frivilligt)" placeholder="AB / Org.nr" />
          </div>
          <div className="mt-4 flex justify-end">
            <WireBtn>Spara ändringar</WireBtn>
          </div>
        </WireBox>

        <div className="space-y-6">
          <WireBox label="UC-kontroll" variant="dashed">
            <div className="flex items-center justify-between">
              <div>
                <Annotation>Status</Annotation>
                <p className="mt-1 text-sm">Ej kört än — körs av George när affär startar.</p>
              </div>
              <WireTag>Adminägd</WireTag>
            </div>
          </WireBox>

          <WireBox label="Fakturor">
            <p className="text-sm text-muted-foreground">Inga fakturor än.</p>
            <Annotation>
              <span className="mt-2 block">Handpenning faktureras vid signering. Trelinks avgift dras vid tillträde.</span>
            </Annotation>
          </WireBox>
        </div>
      </div>
    </AppLayout>
  );
}
