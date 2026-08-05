import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TreLinkLayout } from "@/components/layouts/TreLinkLayout";
import { WireBox, PageHeader, WireTag, Annotation } from "@/components/wire";
import { readAnnonser, STORAGE_KEY, stateLabel, type WorkflowState } from "@/lib/annons-workflow";
import { docsByCat, type CatId } from "@/lib/annons-model";

export const Route = createFileRoute("/george/annonser/")({
  component: ReviewListings,
});

const KAT_NAMN: Record<CatId, "Lokal" | "Inkråm" | "Bolag"> = {
  overlatelse: "Lokal",
  inkram: "Inkråm",
  aktie: "Bolag",
};

type Row = {
  id: string;
  titel: string;
  kat: "Lokal" | "Inkråm" | "Bolag";
  status: WorkflowState | null;
  inkommen: string;
  docsOk: number;
  docsTotal: number;
  docsMissing: number;
};

function toRows(list: any[]): Row[] {
  return list
    .map((item) => {
      const catId: CatId | undefined = item.draft?.cat;
      const specs = catId ? docsByCat[catId] ?? [] : [];
      const docs = item.draft?.docs ?? {};
      return {
        id: item.id,
        titel: item.titel || "—",
        kat: catId ? KAT_NAMN[catId] : "Lokal",
        status: (item.workflow?.state as WorkflowState) ?? null,
        inkommen: item.skickadAt || "",
        docsOk: specs.filter((d) => docs[d.name] === "godkant").length,
        docsTotal: specs.length,
        docsMissing: specs.filter((d) => d.required && (docs[d.name] ?? "saknas") === "saknas").length,
      };
    })
    .sort((a, b) => (b.inkommen || "").localeCompare(a.inkommen || ""));
}

function StatusBadge({ status }: { status: WorkflowState | null }) {
  if (!status) {
    return (
      <span className="border border-foreground/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        —
      </span>
    );
  }
  const filled = status === "publicerad";
  return (
    <span
      className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        filled ? "border-foreground bg-foreground text-background" : "border-foreground/50 text-foreground"
      }`}
    >
      {stateLabel[status]}
    </span>
  );
}

function ReviewListings() {
  const [rows, setRows] = useState<Row[]>(() => toRows(readAnnonser()));
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      const next = toRows(readAnnonser());
      setRows(next);
      const top = next[0];
      if (top) {
        setJustUpdatedId(top.id);
        window.setTimeout(() => {
          setJustUpdatedId((id) => (id === top.id ? null : id));
        }, 2500);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <TreLinkLayout>
      <PageHeader
        eyebrow="TreLink · adminzon"
        title="Inkorg · granska annonser"
        subtitle="Inget publiceras ogranskat. Varje dokument godkänns separat. SLA: nya annonser granskas inom 24h."
      />

      <div className="space-y-3">
        {rows.length === 0 && (
          <WireBox variant="dashed">
            <Annotation>Inga ärenden att granska ännu.</Annotation>
          </WireBox>
        )}
        {rows.map((r) => (
          <WireBox
            key={r.id}
            className={`flex flex-col gap-4 transition-colors duration-500 md:flex-row md:items-center ${
              justUpdatedId === r.id ? "bg-foreground/10" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <WireTag>{r.kat}</WireTag>
                <StatusBadge status={r.status} />
                <span className="font-mono text-[10px] text-muted-foreground">#{r.id}</span>
                {justUpdatedId === r.id && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    ● nytt
                  </span>
                )}
              </div>
              <h3 className="font-medium">{r.titel}</h3>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <span>
                  Dokument: {r.docsOk}/{r.docsTotal} godkända{r.docsMissing > 0 ? ` · ${r.docsMissing} saknas` : ""}
                </span>
                <span>Inkommen: {r.inkommen ? new Date(r.inkommen).toLocaleString("sv-SE") : "—"}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 md:items-end">
              <Link
                to="/george/annonser/$id"
                params={{ id: r.id }}
                className="border border-foreground bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-80"
              >
                {r.status === "publicerad" ? "Visa →" : "Öppna granskning →"}
              </Link>
            </div>
          </WireBox>
        ))}
      </div>

      <Annotation>
        <span className="mt-6 block">
          Alla beslut loggas med tidsstämpel och syns för säljaren. Komplettering måste ha motivering. Avvisning kräver mall + fri text.
        </span>
      </Annotation>
    </TreLinkLayout>
  );
}
