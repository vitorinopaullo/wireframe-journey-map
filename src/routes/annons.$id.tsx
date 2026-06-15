import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, WireBtn, WireTag, Annotation, PageHeader } from "@/components/wire";

export const Route = createFileRoute("/annons/$id")({
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  return (
    <PublicLayout>
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">← Tillbaka till sök</Link>
        <span>·</span>
        <span>Annons #{id}</span>
      </div>

      <PageHeader
        eyebrow="Lokal · Stockholm · Södermalm"
        title="Restauranglokal · 180 m² · Hornstull"
        subtitle="Fullt utrustad restauranglokal med uteservering. Lång hyresperiod kvar, fungerande ventilation, A-läge."
        right={
          <div className="flex gap-2">
            <WireTag>Granskad av George</WireTag>
            <WireTag>Premium</WireTag>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex h-48 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-xs text-muted-foreground"
              >
                [ Bild {i} ]
              </div>
            ))}
          </div>

          <WireBox label="Beskrivning">
            <p className="text-sm text-muted-foreground">
              [Säljarens beskrivning av verksamheten / lokalen. Granskad av George innan publicering.
              Inkluderar bakgrund, inventarier, omsättning, personal, hyresvillkor.]
            </p>
          </WireBox>

          <WireBox label="Nyckeltal">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ["Omsättning", "8,4 Mkr"],
                ["Resultat", "+ 1,1 Mkr"],
                ["Hyra/mån", "62 000 kr"],
                ["Anställda", "9 st"],
              ].map(([k, v]) => (
                <div key={k}>
                  <Annotation>{k}</Annotation>
                  <div className="mt-1 font-mono text-lg">{v}</div>
                </div>
              ))}
            </div>
          </WireBox>

          <WireBox label="Dokument (granskade)" variant="dashed">
            <ul className="space-y-2 text-sm">
              {["Hyreskontrakt.pdf", "Resultaträkning 2024.pdf", "Inventarielista.pdf"].map((d) => (
                <li key={d} className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 py-2">
                  <span>▤ {d}</span>
                  <WireTag>Godkänt av George</WireTag>
                </li>
              ))}
            </ul>
          </WireBox>
        </div>

        <aside className="space-y-4">
          <WireBox label="Pris">
            <div className="font-mono text-2xl">1 950 000 kr</div>
            <p className="mt-1 text-xs text-muted-foreground">Inkråm + inventarier</p>
          </WireBox>

          <WireBox label="Agera">
            <p className="mb-3 text-xs text-muted-foreground">
              Inloggning + BankID krävs för att spara eller anmäla intresse.
            </p>
            <div className="flex flex-col gap-2">
              <WireBtn to="/registrera">Anmäl intresse</WireBtn>
              <WireBtn variant="secondary" to="/registrera">★ Spara som favorit</WireBtn>
              <WireBtn variant="ghost" to="/registrera">Skapa bevakning</WireBtn>
            </div>
            <Annotation>
              <span className="mt-3 block">George når dig via mejl — inga kontaktuppgifter visas mellan parter.</span>
            </Annotation>
          </WireBox>

          <WireBox label="Vad händer härnäst?" variant="ghost">
            <ol className="space-y-2 text-xs">
              <li>1. Du anmäler intresse</li>
              <li>2. George kör UC-kontroll</li>
              <li>3. George matchar dig med säljaren</li>
              <li>4. Handpenning → signering → tillträde</li>
            </ol>
          </WireBox>
        </aside>
      </div>
    </PublicLayout>
  );
}
