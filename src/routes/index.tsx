import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, WireField, WireBtn, WireTag, Annotation, PageHeader } from "@/components/wire";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Trelink — Köp & sälj lokaler, inkråm och bolag" },
      {
        name: "description",
        content:
          "Digitalt mäkleri för affärsöverlåtelser. Sök lokaler, inkrämbolag och aktiebolag — verifierat via BankID.",
      },
    ],
  }),
});

const dummyListings = [
  { id: "1", kat: "Lokal", titel: "Restauranglokal · Södermalm", pris: "1 950 000", stad: "Stockholm", size: "180 m²" },
  { id: "2", kat: "Inkråm", titel: "Café & bageri — inkråm", pris: "850 000", stad: "Göteborg", size: "Verksamhet" },
  { id: "3", kat: "Bolag", titel: "E-handelsbolag (AB)", pris: "4 200 000", stad: "Malmö", size: "Omsättning 6,8 Mkr" },
  { id: "4", kat: "Lokal", titel: "Butik · Vasastan", pris: "1 200 000", stad: "Stockholm", size: "95 m²" },
  { id: "5", kat: "Inkråm", titel: "Frisörsalong", pris: "420 000", stad: "Uppsala", size: "Verksamhet" },
  { id: "6", kat: "Bolag", titel: "SaaS-bolag · B2B", pris: "12 500 000", stad: "Remote", size: "ARR 4 Mkr" },
];

function HomePage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Publik yta · ingen inloggning krävs"
        title="Hitta verksamheter att ta över"
        subtitle="Lokaler, inkråm och aktiebolag — granskade av George innan publicering. Bläddra fritt, spara med konto, agera med BankID-verifiering."
        right={
          <div className="flex gap-2">
            <WireTag>SSR</WireTag>
            <WireTag>SEO</WireTag>
          </div>
        }
      />

      <WireBox label="Sök & filter" className="mb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <WireField label="Kategori" placeholder="Lokal / Inkråm / Bolag" type="select" />
          <WireField label="Ort" placeholder="Stockholm" />
          <WireField label="Prisintervall" placeholder="0 – 5 000 000 kr" />
          <div className="flex items-end">
            <WireBtn className="w-full">Sök</WireBtn>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Lokal", "Inkråm", "Bolag", "Restaurang", "Detaljhandel", "Tjänst", "E-handel"].map((c) => (
            <WireTag key={c}>{c}</WireTag>
          ))}
        </div>
      </WireBox>

      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-semibold">Aktuella annonser</h2>
        <Annotation>{dummyListings.length} träffar · sorterat på nyast</Annotation>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dummyListings.map((l) => (
          <Link
            key={l.id}
            to="/annons/$id"
            params={{ id: l.id }}
            className="group block border border-foreground/30 bg-background p-4 hover:border-foreground transition"
          >
            <div className="mb-3 flex h-32 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-xs text-muted-foreground">
              [ Bild · {l.kat} ]
            </div>
            <div className="mb-1 flex items-center justify-between">
              <WireTag>{l.kat}</WireTag>
              <span className="text-xs text-muted-foreground">{l.stad}</span>
            </div>
            <h3 className="mt-2 font-medium group-hover:underline">{l.titel}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{l.size}</p>
            <p className="mt-3 font-mono text-sm">{l.pris} kr</p>
          </Link>
        ))}
      </div>

      <WireBox label="Friktion ökar gradvis" variant="dashed" className="mt-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <Annotation>Titta</Annotation>
            <p className="mt-1 text-sm">Fritt — ingen inloggning. Bläddra, läs, jämför.</p>
          </div>
          <div>
            <Annotation>Spara</Annotation>
            <p className="mt-1 text-sm">Kräver konto + BankID. Favoriter, bevakningar, intresse.</p>
          </div>
          <div>
            <Annotation>Affär</Annotation>
            <p className="mt-1 text-sm">UC-kontroll + signering. George matchar parterna.</p>
          </div>
        </div>
      </WireBox>
    </PublicLayout>
  );
}
