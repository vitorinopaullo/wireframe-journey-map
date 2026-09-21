import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, Annotation } from "@/components/wire";
import { readAnnonser, stateLabel, STORAGE_KEY, type WorkflowState } from "@/lib/annons-workflow";
import { readBuyerInterests, STORAGE_KEY as KOPARE_STORAGE_KEY } from "@/lib/kopare-workflow";
import { buildAffarer } from "@/lib/affar-workflow";
import { getSession } from "@/lib/mock-auth";
import { readFavoriter, STORAGE_KEY as FAVORITER_STORAGE_KEY, type Favorit } from "@/lib/favoriter";

const searchSchema = z.object({
  mode: z.enum(["kopare", "saljare"]).catch("kopare").default("kopare"),
});

export const Route = createFileRoute("/dashboard")({
  validateSearch: searchSchema,
  component: Dashboard,
});

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

function intresseanmalningarHint(list: ReturnType<typeof readBuyerInterests>) {
  if (list.length === 0) return "Inga intresseanmälningar än";
  const vantarPdf = list.filter((i) => i.status === "väntar-pdf").length;
  if (vantarPdf === 0) return `${list.length} intresseanmälningar totalt`;
  return `${vantarPdf} väntar på PDF-granskning`;
}

function Dashboard() {
  const { mode } = Route.useSearch();
  const [annonser, setAnnonser] = useState<any[]>(() => readAnnonser());
  const [buyerInterests, setBuyerInterests] = useState(() => readBuyerInterests());
  const [favoriter, setFavoriter] = useState<Favorit[]>(() => readFavoriter());

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setAnnonser(readAnnonser());
      if (e.key === KOPARE_STORAGE_KEY) setBuyerInterests(readBuyerInterests());
      if (e.key === FAVORITER_STORAGE_KEY) setFavoriter(readFavoriter());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const userId = getSession()?.userId;
  const minaAnnonser = annonser.filter((a) => a.agarUserId === userId);
  const minaFavoriter = favoriter.filter((f) => f.userId === userId);
  const minaIntresseanmalningar = buyerInterests.filter((i) =>
    minaAnnonser.some((a) => a.id === i.annonsId),
  );

  // Samma beräkning som respektive roll använder på sin egen
  // affärslista (kopare.affarer.index.tsx / saljare.affarer.index.tsx),
  // så korten här alltid speglar samma antal.
  const minaKopareAffarer = useMemo(
    () => buildAffarer(buyerInterests.filter((i) => i.userId === userId)),
    [buyerInterests, userId],
  );
  const minaSaljareInteressen = useMemo(
    () => buyerInterests.filter((i) => minaAnnonser.some((a) => a.id === i.annonsId)),
    [buyerInterests, minaAnnonser],
  );
  const minaSaljareAffarer = useMemo(
    () => buildAffarer(minaSaljareInteressen),
    [minaSaljareInteressen],
  );

  return (
    <AppLayout mode={mode}>
      <PageHeader
        title={mode === "kopare" ? "Välkommen tillbaka" : "Säljarpanel"}
        subtitle={
          mode === "kopare"
            ? "Pågående affärer högst upp. Sparade objekt och affärsstatus alltid nåbara."
            : "Mina annonser, intresse på dem och pågående affärer — speglar köparens panel."
        }
      />

      {mode === "kopare" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashCard
            title="Sparade objekt"
            value={String(minaFavoriter.length)}
            link="/kopare/favoriter"
            hint="Spara och jämför"
          />
          <DashCard
            title="Mina affärer"
            value={String(minaKopareAffarer.length)}
            link="/kopare/affarer"
            hint="Pågående"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashCard
            title="Mina annonser"
            value={String(minaAnnonser.length)}
            link="/saljare/mina-annonser"
            hint={annonserSummary(minaAnnonser)}
          />
          <DashCard
            title="Intresseanmälningar"
            value={String(minaIntresseanmalningar.length)}
            link="/saljare/intressenter"
            hint={intresseanmalningarHint(minaIntresseanmalningar)}
          />
          <DashCard
            title="Mina affärer"
            value={String(minaSaljareAffarer.length)}
            link="/saljare/affarer"
            hint={minaSaljareAffarer.length === 0 ? "Inga affärer än" : "Pågående"}
          />
        </div>
      )}

      {mode === "kopare" && (
        <CrossRoleSummary
          label="Som säljare"
          stats={
            minaAnnonser.length === 0 && minaSaljareAffarer.length === 0
              ? null
              : `${minaAnnonser.length} annonser · ${minaSaljareAffarer.length} pågående affärer`
          }
          emptyText="Vill du också sälja en verksamhet?"
          targetMode="saljare"
          targetLabel="Byt till säljarläge"
        />
      )}

      {mode === "saljare" && (
        <CrossRoleSummary
          label="Som köpare"
          stats={
            minaKopareAffarer.length === 0 && minaFavoriter.length === 0
              ? null
              : `${minaKopareAffarer.length} pågående affärer · ${minaFavoriter.length} sparade objekt`
          }
          emptyText="Vill du också köpa en verksamhet?"
          targetMode="kopare"
          targetLabel="Byt till köparläge"
        />
      )}

      <WireBox label={mode === "kopare" ? "Inga pågående? Börja söka." : "Skapa din nästa annons"} className="mt-8">
        <p className="text-sm text-muted-foreground">
          {mode === "kopare"
            ? "Hitta objekt och spara dem — vi hör av oss vid relevanta nyheter."
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
    <Link to={link} className="block rounded-card border border-foreground/30 bg-card p-5 hover:border-foreground">
      <Annotation>{title}</Annotation>
      <div className="mt-2 font-mono text-3xl">{value}</div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}

/** Small cross-role activity summary shown on the current dashboard for
 * whichever role isn't active — e.g. the buyer's own affärer/favoriter
 * counts shown on the seller's dashboard. `stats` is the summary line
 * to show when there's activity on the other side; passing null falls
 * back to `emptyText`, an invite to try the other role instead of an
 * empty "0 affärer" box. */
function CrossRoleSummary({
  label,
  stats,
  emptyText,
  targetMode,
  targetLabel,
}: {
  label: string;
  stats: string | null;
  emptyText: string;
  targetMode: "kopare" | "saljare";
  targetLabel: string;
}) {
  return (
    <WireBox label={label} className="mt-6">
      <p className="text-sm text-muted-foreground">{stats ?? emptyText}</p>
      <div className="mt-3">
        <Link
          to="/dashboard"
          search={{ mode: targetMode }}
          className="text-sm text-[var(--color-interactive)] hover:underline"
        >
          {targetLabel} →
        </Link>
      </div>
    </WireBox>
  );
}
