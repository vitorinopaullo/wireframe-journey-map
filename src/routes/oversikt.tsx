import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, Annotation, WireTag } from "@/components/wire";

export const Route = createFileRoute("/oversikt")({
  component: Sitemap,
});

const sections = [
  {
    title: "Publik yta — utloggad",
    color: "Publik",
    links: [
      ["/", "Start · sök & filter"],
      ["/annons/1", "Annonsdetalj"],
      ["/hur-det-funkar", "Hur det funkar"],
      ["/tillaggstjanster", "Tilläggstjänster"],
      ["/registrera", "Registrera (BankID)"],
      ["/logga-in", "Logga in"],
    ],
  },
  {
    title: "Köparläge — inloggad",
    color: "Köpare",
    links: [
      ["/dashboard?mode=kopare", "Dashboard"],
      ["/kopare/favoriter", "Sparade objekt"],
      ["/kopare/bevakningar", "Bevakningar"],
      ["/kopare/affarer", "Mina affärer"],
      ["/kopare/profil", "Profil & fakturor"],
    ],
  },
  {
    title: "Säljarläge — inloggad",
    color: "Säljare",
    links: [
      ["/dashboard?mode=saljare", "Dashboard"],
      ["/saljare/skapa-annons", "Skapa annons"],
      ["/saljare/mina-annonser", "Mina annonser"],
      ["/saljare/intressenter", "Intressenter"],
      ["/saljare/affarer", "Mina affärer"],
    ],
  },
  {
    title: "TreLink · adminzon — separat",
    color: "TreLink",
    links: [
      ["/admin", "Översikt"],
      ["/admin/annonser", "Granskning"],
      ["/admin/kopare", "Köpare/Intressenter"],
      ["/admin/affarer", "Affärer/Uppdrag"],
      ["/admin/anvandare", "Användare"],
      ["/admin/installningar", "Inställningar"],
    ],
  },
  {
    title: "Affärsvyer (delas av båda parter)",
    color: "Affär",
    links: [["/affar/A-2041", "Affärsstatus · spårning"]],
  },
];

function Sitemap() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Wireframe · navigationskarta"
        title="Sitemap — alla skärmar"
        subtitle="Snabblänkar till alla wireframe-sidor. Strukturen följer Trelink_Sitemap_UserPerspective.pdf."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <WireBox key={s.title} label={s.color}>
            <h3 className="mb-3 font-semibold">{s.title}</h3>
            <ul className="space-y-1.5">
              {s.links.map(([to, label]) => (
                <li key={to} className="flex items-center justify-between gap-3 border-b border-dashed border-muted-foreground/30 py-1.5">
                  <Link to={to} className="text-sm hover:underline">
                    {label}
                  </Link>
                  <span className="font-mono text-[10px] text-muted-foreground">{to}</span>
                </li>
              ))}
            </ul>
          </WireBox>
        ))}
      </div>

      <WireBox label="Kärnprincip" variant="dashed" className="mt-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-sm">
          <div><WireTag>1</WireTag><p className="mt-2">Ett konto, två lägen — köpare & säljare. TreLink separat.</p></div>
          <div><WireTag>2</WireTag><p className="mt-2">Gratis hela vägen — avgift först vid tillträde.</p></div>
          <div><WireTag>3</WireTag><p className="mt-2">Affärsstatus syns för båda parter — full transparens.</p></div>
        </div>
        <Annotation>
          <span className="mt-4 block">(?) UC-placering, klientmedelskonto och hyresvärdsgodkännandets exakta steg = öppna frågor till TreLink.</span>
        </Annotation>
      </WireBox>
    </PublicLayout>
  );
}
