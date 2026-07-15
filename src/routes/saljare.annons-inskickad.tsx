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
        eyebrow="TreLink · din digitala mäklare"
        title="Tack — vi tar det härifrån"
        subtitle="Du har lämnat över underlaget. TreLink agerar nu som din mäklare: vi paketerar objektet till en annons och letar upp rätt köpare. Du och köparen träffas aldrig direkt — allt går genom oss."
        right={<WireTag>Ärende {ref}</WireTag>}
      />

      <WireBox className="p-6 space-y-3">
        <div className="text-2xl">✓ Underlaget är mottaget</div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Du hittar annonsen under <strong>Mina annonser</strong> med status <strong>Granskas</strong>.
          Vi återkommer när nästa steg är klart.
        </p>
      </WireBox>

      <div className="flex flex-wrap gap-2 mt-6">
        <Link to="/dashboard">
          <WireBtn>Till min panel →</WireBtn>
        </Link>
        <Link to="/saljare/mina-annonser">
          <WireBtn variant="secondary">Mina annonser</WireBtn>
        </Link>
        <Link to="/saljare/skapa-annons">
          <WireBtn variant="secondary">Skapa ny annons</WireBtn>
        </Link>
      </div>
    </AppLayout>
  );
}
