import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, WireTag, Annotation } from "@/components/wire";
import { readAnnonser, STORAGE_KEY, stateLabel, type WorkflowState } from "@/lib/annons-workflow";
import { docsByCat, type CatId } from "@/lib/annons-model";

export const Route = createFileRoute("/admin/annonser/")({
  component: AdminAnnonser,
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
  docsInlamnade: number;
  docsTotal: number;
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
        docsInlamnade: specs.filter((d) => (docs[d.name] ?? "saknas") !== "saknas").length,
        docsTotal: specs.length,
      };
    })
    .sort((a, b) => (b.inkommen || "").localeCompare(a.inkommen || ""));
}

function formatTid(ts: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

const STATUS_TONE: Record<WorkflowState, "neutral" | "warn" | "success" | "danger"> = {
  granskas: "neutral",
  komplettering: "warn",
  avvisad: "danger",
  "avtal-vantar-signering": "warn",
  "hyresvard-notifiering": "neutral",
  "utkast-till-saljare": "warn",
  "utkast-feedback": "neutral",
  publicerad: "success",
};

function StatusTag({ status }: { status: WorkflowState | null }) {
  if (!status) {
    return <WireTag>—</WireTag>;
  }
  const tone = STATUS_TONE[status];
  const cls =
    tone === "success"
      ? "border-foreground bg-foreground text-background"
      : tone === "danger"
      ? "border-destructive text-destructive bg-destructive/10"
      : tone === "warn"
      ? "border-amber-500/70 text-amber-700 bg-amber-50/60 dark:text-amber-500 dark:bg-amber-500/10"
      : "border-foreground/40 text-muted-foreground";
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}>
      {stateLabel[status]}
    </span>
  );
}

function AdminAnnonser() {
  const navigate = useNavigate();
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
    <AdminLayout>
      <PageHeader
        eyebrow="TreLink Admin"
        title="Granskning"
        subtitle="Alla ärenden som skickats in via säljarflödet, sorterade efter senast inkommen."
      />

      <div className="space-y-3">
        {rows.length === 0 && (
          <WireBox variant="dashed">
            <Annotation>Inga ärenden inkomna än.</Annotation>
          </WireBox>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            onClick={() => navigate({ to: "/admin/annonser/$id", params: { id: r.id } })}
            className="cursor-pointer"
          >
            <WireBox
              className={`flex flex-col gap-4 transition-colors duration-500 hover:border-foreground md:flex-row md:items-center ${
                justUpdatedId === r.id ? "bg-foreground/10" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <WireTag>{r.kat}</WireTag>
                  <StatusTag status={r.status} />
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
                    Dokument: {r.docsInlamnade}/{r.docsTotal} inlämnade
                  </span>
                  <span>Inkommen: {formatTid(r.inkommen)}</span>
                </div>
              </div>
            </WireBox>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
