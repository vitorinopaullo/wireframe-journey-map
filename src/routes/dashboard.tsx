import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";
import { ContractExpiryBanner } from "@/components/ContractExpiryBanner";
import { readAnnonser, stateLabel, STORAGE_KEY, type WorkflowState } from "@/lib/annons-workflow";

const searchSchema = z.object({
  mode: z.enum(["kopare", "saljare"]).catch("kopare").default("kopare"),
});

export const Route = createFileRoute("/dashboard")({
  validateSearch: searchSchema,
  component: Dashboard,
});

// Ingen workflow-state representerar ännu en verklig pågående affär
// (köpare matchad, handpenning, signering, tillträde) — se annons-workflow.ts.
// Listan är avsiktligt tom tills en sådan state finns; "Mina affärer" och
// "Pågående affär"-kortet ska då visa 0 / döljas, inte hårdkodad exempeldata.
const DEAL_STATES: WorkflowState[] = [];

function annonserSummary(list: any[]) {
  if (list.length === 0) return "Inga annonser än";
  const counts = new Map<string, number>();
  for (const a of list) {
    const st = a.workflow?.state as WorkflowState | undefined;
    const label = st ? stateLabel[st] : a.status || "Okänd status";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, n]) => `${n} × ${label}`)
    .join(" · ");
}

function Dashboard() {
  const { mode } = Route.useSearch();
  const [annonser, setAnnonser] = useState<any[]>(() => readAnnonser());

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      setAnnonser(readAnnonser());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const affar = annonser.find((a) => DEAL_STATES.includes(a.workflow?.state));

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

      {mode === "saljare" && (
        <ContractExpiryBanner daysLive={80} objectLabel="Inkråm · Café · Stockholm" />
      )}

      {affar && (
        <WireBox label="Pågående affär · status" className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{affar.titel}</h3>
              <Annotation>Affär #{affar.id}</Annotation>
            </div>
            <WireBtn variant="secondary" to="/affar/$id" params={{ id: affar.id }}>
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
      )}

      {mode === "kopare" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashCard title="Sparade objekt" value="7" link="/kopare/favoriter" hint="Favoriter att jämföra" />
          <DashCard title="Bevakningar" value="3" link="/kopare/bevakningar" hint="Aktiva sökningar" />
          <DashCard title="Mina affärer" value="1" link="/kopare/affarer" hint="Pågående" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashCard
            title="Mina annonser"
            value={String(annonser.length)}
            link="/saljare/mina-annonser"
            hint={annonserSummary(annonser)}
          />
          <DashCard
            title="Intresseanmälningar"
            value="0"
            link="/saljare/intressenter"
            hint="Inga intresseanmälningar än"
          />
          <DashCard
            title="Mina affärer"
            value={affar ? "1" : "0"}
            link="/saljare/affarer"
            hint={affar ? "Pågående" : "Inga affärer än"}
          />
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
