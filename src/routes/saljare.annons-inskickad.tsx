import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/saljare/annons-inskickad")({
  component: TackPage,
});

function TackPage() {
  const ref = "TRL-" + Math.floor(100000 + Math.random() * 900000);
  return (
    <AppLayout mode="saljare">
      <PageHeader
        title="Tack — din annons är skickad till TreLink"
        subtitle="Vi har tagit emot din annons och tillhörande underlag. Nu tar TreLink över."
        right={<WireTag>Ärende {ref}</WireTag>}
      />

      <WireBox className="p-6 space-y-4">
        <div className="text-2xl">✓ Inskickat för granskning</div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          En handläggare på TreLink går igenom dina uppgifter och dokument. Du får
          besked inom <strong>24 timmar på vardagar</strong>. Annonsen publiceras först
          när allt är godkänt — inget debiteras förrän affären går i mål.
        </p>
      </WireBox>

      <WireBox className="p-6 mt-4">
        <div className="text-sm font-semibold mb-3">Så här går det till nu</div>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center shrink-0">1</span>
            <div>
              <div className="font-medium">TreLink granskar dokumenten</div>
              <Annotation>Hyresavtal, ekonomi, bilder och övriga underlag.</Annotation>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center shrink-0">2</span>
            <div>
              <div className="font-medium">Du får besked</div>
              <Annotation>Antingen godkänt & publicerad, eller begäran om komplettering med tydliga instruktioner.</Annotation>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center shrink-0">3</span>
            <div>
              <div className="font-medium">Annonsen går live</div>
              <Annotation>Köpare kan anmäla intresse. TreLink kvalificerar och för fram seriösa köpare till dig.</Annotation>
            </div>
          </li>
        </ol>
      </WireBox>

      <div className="flex flex-wrap gap-2 mt-6">
        <Link to="/saljare/dashboard">
          <WireBtn>Till min panel →</WireBtn>
        </Link>
        <Link to="/saljare/annonser">
          <WireBtn variant="secondary">Mina annonser</WireBtn>
        </Link>
        <Link to="/saljare/skapa-annons">
          <WireBtn variant="secondary">Skapa ny annons</WireBtn>
        </Link>
      </div>
    </AppLayout>
  );
}
