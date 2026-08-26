import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, Annotation } from "@/components/wire";
import { readAnnonser, STORAGE_KEY, stateLabel, type WorkflowState } from "@/lib/annons-workflow";

export const Route = createFileRoute("/admin/")({
  component: AdminOversikt,
});

type QueueId = "granskning" | "signering" | "text" | "publicerad";

// Samma indelning som flikarna i Granskning-listan (admin.annonser.index.tsx).
const QUEUES: { id: QueueId; label: string; states: (WorkflowState | null)[] }[] = [
  { id: "granskning", label: "Att granska", states: ["granskas", "komplettering", null] },
  { id: "signering", label: "Väntar på signering", states: ["avtal-vantar-signering"] },
  { id: "text", label: "Redo att skriva text", states: ["hyresvard-notifiering"] },
  { id: "publicerad", label: "Publicerade", states: ["publicerad"] },
];

// Vem som förväntas agera näst per state — samma logik som i admin.annonser.index.tsx.
const NEXT_ACTOR: Record<WorkflowState, "trelink" | "saljare" | null> = {
  granskas: "trelink",
  komplettering: "trelink",
  "hyresvard-notifiering": "trelink",
  "avtal-vantar-signering": "saljare",
  publicerad: null,
  avvisad: null,
};

type Row = {
  id: string;
  titel: string;
  status: WorkflowState | null;
  waitingSince: string;
};

function toRows(list: any[]): Row[] {
  return list.map((item) => ({
    id: item.id,
    titel: item.titel || "—",
    status: (item.workflow?.state as WorkflowState) ?? null,
    waitingSince: item.workflow?.timeline?.[0]?.ts || item.skickadAt || "",
  }));
}

function formatTid(ts: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

function queueForStatus(status: WorkflowState | null): QueueId | null {
  return QUEUES.find((q) => q.states.includes(status))?.id ?? null;
}

function AdminOversikt() {
  const [rows, setRows] = useState<Row[]>(() => toRows(readAnnonser()));

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setRows(toRows(readAnnonser()));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const waitingOnTreLink = rows
    .filter((r) => r.status && NEXT_ACTOR[r.status] === "trelink")
    .sort((a, b) => (a.waitingSince || "").localeCompare(b.waitingSince || ""));

  return (
    <AdminLayout>
      <PageHeader eyebrow="TreLink Admin" title="Översikt" subtitle="Sammanfattning av plattformens aktivitet." />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {QUEUES.map((q) => {
          const count = rows.filter((r) => queueForStatus(r.status) === q.id).length;
          return (
            <WireBox key={q.id} variant="dashed" className="text-center">
              <div className="text-2xl font-semibold">{count}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {q.label}
              </div>
            </WireBox>
          );
        })}
      </div>

      <Annotation>Väntar på TreLink · äldsta ärendet överst</Annotation>

      <div className="mt-3 space-y-3">
        {waitingOnTreLink.length === 0 ? (
          <WireBox variant="dashed">
            <div className="text-center text-sm text-muted-foreground">
              Allt är åtgärdat — inget väntar på dig just nu
            </div>
          </WireBox>
        ) : (
          waitingOnTreLink.map((r) => (
            <Link key={r.id} to="/admin/annonser/$id" params={{ id: r.id }} className="block">
              <WireBox className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-foreground">
                <div className="min-w-0">
                  <div className="mb-1 font-mono text-[10px] text-muted-foreground">#{r.id}</div>
                  <h3 className="font-medium">{r.titel}</h3>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {r.status ? stateLabel[r.status] : "—"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Väntar sedan {formatTid(r.waitingSince)}</div>
                </div>
              </WireBox>
            </Link>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
