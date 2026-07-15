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
          En handläggare på TreLink går igenom dina dokument och uppgifter. Du får
          besked inom <strong>24 timmar på vardagar</strong>. Inget debiteras förrän
          affären går i mål.
        </p>
      </WireBox>

      <WireBox label="Så jobbar TreLink åt dig" className="p-6 mt-6">
        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full border border-dashed flex items-center justify-center shrink-0 font-mono text-xs">1</span>
            <div>
              <div className="font-medium">Granskning av underlag</div>
              <Annotation>Vi kontrollerar hyresavtal, ekonomi, bilder och övriga dokument. Vid behov hör vi av oss för komplettering.</Annotation>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full border border-dashed flex items-center justify-center shrink-0 font-mono text-xs">2</span>
            <div>
              <div className="font-medium">TreLink skapar annonsen</div>
              <Annotation>Vi paketerar objektet till en säljfärdig annons baserat på det du laddat upp — text, nyckeltal, bilder och rätt kategori (överlåtelse / inkråm / aktieöverlåtelse). Du får förhandsgranska innan publicering.</Annotation>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full border border-dashed flex items-center justify-center shrink-0 font-mono text-xs">3</span>
            <div>
              <div className="font-medium">Publicering & matchning</div>
              <Annotation>Annonsen går live. TreLink matchar den mot verifierade köpare i vårt nätverk och kvalificerar intressenter (UC, bolagsuppgifter, finansiering).</Annotation>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full border border-dashed flex items-center justify-center shrink-0 font-mono text-xs">4</span>
            <div>
              <div className="font-medium">Vi för dialogen — du och köparen möts aldrig direkt</div>
              <Annotation>All kommunikation, förhandling, budgivning och dokumenthantering går via TreLink. Vi skyddar båda parter och ser till att inget faller mellan stolarna.</Annotation>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-7 h-7 rounded-full border border-dashed flex items-center justify-center shrink-0 font-mono text-xs">5</span>
            <div>
              <div className="font-medium">Signering & tillträde</div>
              <Annotation>När en match är klar sköter TreLink kontrakt, BankID-signering (Signicat), handpenning på klientmedelskonto och tillträde. Först då debiteras vår avgift.</Annotation>
            </div>
          </li>
        </ol>
      </WireBox>

      <WireBox label="Kom ihåg" variant="dashed" className="p-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <Annotation>Digital mäklare</Annotation>
            <p className="mt-1">TreLink är plattformen och mellanhanden — vi är din motpart hela vägen.</p>
          </div>
          <div>
            <Annotation>Ingen direktkontakt</Annotation>
            <p className="mt-1">Köpare och säljare möts aldrig direkt. All info och alla frågor går via oss.</p>
          </div>
          <div>
            <Annotation>Betalt vid mål</Annotation>
            <p className="mt-1">Ingen avgift förrän affären signeras och tillträde sker.</p>
          </div>
        </div>
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
