import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireField, WireTag, Annotation } from "@/components/wire";
import { getSession } from "@/lib/mock-auth";
import { Check } from "lucide-react";

export const Route = createFileRoute("/saljare/profil")({
  component: SellerProfile,
});

// Samma nyckel/form som admin.annonser.$id.tsx och saljare.annons.$id.tsx läser
// (skriven av onboarding.tsx vid säljarens kontosättning) — se ONBOARDING_SALJARE_KEY.
const ONBOARDING_SALJARE_KEY = "trelink-onboarding-saljare-uppgifter";

type OnboardingSaljareData = {
  bolagsuppgifter: {
    bolag: string;
    orgnr: string;
    ort: string;
    adress: string;
    postnr?: string;
    presentation?: string;
  };
  saljaruppgifter: { fornamn: string; efternamn: string; mobil: string; epost: string };
  firmatecknare: {
    roll: string;
    fornamn: string;
    efternamn: string;
    mail: string;
    mobil: string;
  } | null;
};

function readOnboardingSaljare(userId?: string): OnboardingSaljareData | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${ONBOARDING_SALJARE_KEY}:${userId}`);
    return raw ? (JSON.parse(raw) as OnboardingSaljareData) : null;
  } catch {
    return null;
  }
}

function SellerProfile() {
  const session = getSession();
  const onboarding = readOnboardingSaljare(session?.userId);
  const fullName = session?.bankid ? `${session.bankid.fornamn} ${session.bankid.efternamn}` : "—";

  const bolagsuppgifter = onboarding?.bolagsuppgifter;
  const saljaruppgifter = onboarding?.saljaruppgifter;
  const firmatecknare = onboarding?.firmatecknare;

  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow="Säljarläge · Profil"
        title={fullName}
        subtitle="Uppgifterna nedan kommer från din kontosättning och används av TreLink vid granskning av dina annonser."
        right={
          <WireTag>
            BankID <Check className="inline-block h-3 w-3 align-middle" />
          </WireTag>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WireBox label="Bolagsuppgifter">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WireField label="Bolag" placeholder={bolagsuppgifter?.bolag || "—"} />
            <WireField label="Org.nr" placeholder={bolagsuppgifter?.orgnr || "—"} />
            <WireField label="Ort" placeholder={bolagsuppgifter?.ort || "—"} />
            <WireField label="Adress" placeholder={bolagsuppgifter?.adress || "—"} />
            <WireField label="Postnr" placeholder={bolagsuppgifter?.postnr || "—"} />
            <WireField
              label="Företagspresentation"
              placeholder={bolagsuppgifter?.presentation || "—"}
            />
          </div>
        </WireBox>

        <WireBox label="Från kontoinställningen">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WireField
              label="Namn"
              placeholder={fullName}
              hint="Hämtat från BankID — ej redigerbart"
            />
            <WireField label="Mobil" placeholder={saljaruppgifter?.mobil || "—"} />
            <WireField label="E-post" placeholder={saljaruppgifter?.epost || "—"} />
          </div>

          <div className="mt-6 border-t border-foreground/10 pt-6">
            <Annotation>Firmatecknare</Annotation>
            {firmatecknare ? (
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <WireField label="Roll" placeholder={firmatecknare.roll || "—"} />
                <WireField
                  label="Namn"
                  placeholder={`${firmatecknare.fornamn} ${firmatecknare.efternamn}`.trim() || "—"}
                />
                <WireField label="E-post" placeholder={firmatecknare.mail || "—"} />
                <WireField label="Mobil" placeholder={firmatecknare.mobil || "—"} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Du är firmatecknare — ingen separat firmatecknare angiven.
              </p>
            )}
          </div>
        </WireBox>
      </div>
    </AppLayout>
  );
}
