import { createFileRoute, Link } from "@tanstack/react-router";
import { GeorgeLayout } from "@/components/layouts/GeorgeLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/george/")({
  component: GeorgeHome,
});

function GeorgeHome() {
  return (
    <GeorgeLayout>
      <PageHeader
        eyebrow="Mäklarens kontrollrum"
        title="Det här behöver göras idag"
        subtitle="En tydlig att-göra-lista — George slipper leta. Allt här syns som status hos köpare & säljare."
        right={<WireTag>11 ärenden öppna</WireTag>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card to="/george/annonser" title="Godkänna" count="4" desc="Nya annonser & dokument väntar på granskning." />
        <Card to="/george/affarer" title="Driva affärer" count="5" desc="Matcha köpare & säljare. UC-kontroll. Hyresvärd." />
        <Card to="/george/fakturor" title="Hantera pengar" count="2" desc="Fakturor, handpenning, frigörande av medel." />
      </div>

      <WireBox label="Att-göra · prioriterad lista" className="mt-8">
        <ul className="divide-y divide-dashed divide-muted-foreground/30">
          {[
            { tag: "Granskning", title: "Ny annons #9 — Frisörsalong, Vasastan", action: "Granska dokument", to: "/george/annonser" },
            { tag: "UC", title: "Köpare K-208 anmält intresse på #1", action: "Kör UC-kontroll", to: "/george/affarer" },
            { tag: "Hyresvärd", title: "Affär #A-2041 — invänta hyresvärdsbesked", action: "Skicka påminnelse", to: "/george/hyresvard" },
            { tag: "Faktura", title: "Affär #A-2038 — handpenning betald, frigör", action: "Frigör medel", to: "/george/fakturor" },
            { tag: "Signering", title: "Affär #A-2039 — båda parter signerade", action: "Markera tillträde", to: "/george/affarer" },
          ].map((t, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <WireTag>{t.tag}</WireTag>
                <span className="text-sm">{t.title}</span>
              </div>
              <Link to={t.to} className="text-xs text-muted-foreground hover:text-foreground underline">
                {t.action} →
              </Link>
            </li>
          ))}
        </ul>
        <Annotation>
          <span className="mt-4 block">Allt George gör syns som status hos köpare & säljare — aldrig som en svart låda.</span>
        </Annotation>
      </WireBox>
    </GeorgeLayout>
  );
}

function Card({ to, title, count, desc }: { to: string; title: string; count: string; desc: string }) {
  return (
    <Link to={to} className="block border border-foreground/30 bg-background p-5 hover:border-foreground">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="font-mono text-3xl">{count}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-4">
        <WireBtn variant="secondary">Öppna →</WireBtn>
      </div>
    </Link>
  );
}
