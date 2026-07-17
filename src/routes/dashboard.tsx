import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";
import { ContractExpiryBanner } from "@/components/ContractExpiryBanner";

const searchSchema = z.object({
  mode: z.enum(["kopare", "saljare"]).catch("kopare").default("kopare"),
});

export const Route = createFileRoute("/dashboard")({
  validateSearch: searchSchema,
  component: Dashboard,
});

function Dashboard() {
  const { mode } = Route.useSearch();
  return (
    <AppLayout mode={mode}>
      <PageHeader
        eyebrow={`Anpassad start · ${mode === "kopare" ? "köparläge" : "säljarläge"}`}
        title={mode === "kopare" ? "Välkommen tillbaka" : "Säljarpanel"}
        subtitle={
          mode === "kopare"
            ? "Pågående affärer högst upp. Sparade objekt, bevakningar och affärsstatus alltid nåbara."
            : "Mina annonser, intresse på dem och pågående affärer — speglar köparens panel."
        }
        right={<WireTag>BankID-verifierad</WireTag>}
      />

      <WireBox label="Pågående affär · status" className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Restauranglokal · Södermalm</h3>
            <Annotation>Affär #A-2041 · startad 12 jun 2026</Annotation>
          </div>
          <WireBtn variant="secondary" to="/affar/$id" params={{ id: "A-2041" }}>
            Öppna affärsstatus →
          </WireBtn>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {[
            ["Annons godkänd", "done"],
            ["Köpare matchad", "done"],
            ["Hyresvärd", "active"],
            ["Handpenning", "pending"],
            ["Signering", "pending"],
            ["Tillträde", "pending"],
          ].map(([l, s]) => (
            <div key={l} className="flex flex-col items-center gap-2 border border-dashed border-muted-foreground/30 p-3 text-center">
              <StatusDot state={s as "done" | "active" | "pending"} />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
      </WireBox>

      {mode === "kopare" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashCard title="Sparade objekt" value="7" link="/kopare/favoriter" hint="Favoriter att jämföra" />
          <DashCard title="Bevakningar" value="3" link="/kopare/bevakningar" hint="Aktiva sökningar" />
          <DashCard title="Mina affärer" value="1" link="/kopare/affarer" hint="Pågående" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashCard title="Mina annonser" value="2" link="/saljare/mina-annonser" hint="1 publicerad · 1 granskas" />
          <DashCard title="Intresseanmälningar" value="14" link="/saljare/intressenter" hint="TreLink driver matchning" />
          <DashCard title="Mina affärer" value="1" link="/saljare/affarer" hint="Pågående" />
        </div>
      )}

      <WireBox label={mode === "kopare" ? "Inga pågående? Börja söka." : "Skapa din nästa annons"} variant="dashed" className="mt-8">
        <p className="text-sm text-muted-foreground">
          {mode === "kopare"
            ? "Hitta objekt och spara favoriter — vi hör av oss vid relevanta nyheter."
            : "Gratis att annonsera. Avgiften (29 500 – 79 500 kr) tas ut först vid genomförd affär."}
        </p>
        <div className="mt-4">
          {mode === "kopare" ? (
            <WireBtn to="/">Hitta objekt →</WireBtn>
          ) : (
            <WireBtn to="/saljare/skapa-annons">Skapa annons →</WireBtn>
          )}
        </div>
      </WireBox>
    </AppLayout>
  );
}

function DashCard({ title, value, link, hint }: { title: string; value: string; link: string; hint: string }) {
  return (
    <Link to={link} className="block border border-foreground/30 p-5 hover:border-foreground">
      <Annotation>{title}</Annotation>
      <div className="mt-2 font-mono text-3xl">{value}</div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}
