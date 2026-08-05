import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PageHeader, Annotation, WireTag } from "@/components/wire";
import { readAnnonser, STORAGE_KEY, stateLabel, type WorkflowState } from "@/lib/annons-workflow";

export const Route = createFileRoute("/admin/annonser/")({
  component: AdminAnnonser,
});

type Row = {
  id: string;
  objektBolag: string;
  verksamhetstyp: string;
  ort: string;
  status: WorkflowState | null;
  senastSparad: number;
};

function toRows(list: any[]): Row[] {
  return list
    .map((item) => {
      const timelineTs = item.workflow?.timeline?.[0]?.ts;
      const senastSparad = timelineTs
        ? new Date(timelineTs).getTime()
        : item.skickadAt
        ? new Date(item.skickadAt).getTime()
        : 0;
      return {
        id: item.id,
        objektBolag: item.titel || "—",
        verksamhetstyp: item.draft?.verksamhet || "—",
        ort: item.ort || item.draft?.ort || "—",
        status: (item.workflow?.state as WorkflowState) ?? null,
        senastSparad,
      };
    })
    .sort((a, b) => b.senastSparad - a.senastSparad);
}

function formatTid(ts: number) {
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

function StatusTag({ state }: { state: WorkflowState }) {
  const tone = STATUS_TONE[state];
  const cls =
    tone === "success"
      ? "border-foreground bg-foreground text-background"
      : tone === "danger"
      ? "border-destructive text-destructive bg-destructive/10"
      : tone === "warn"
      ? "border-amber-500/70 text-amber-700 bg-amber-50/60 dark:text-amber-500 dark:bg-amber-500/10"
      : "border-foreground/40 text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}
    >
      {stateLabel[state]}
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
        title="Annonser"
        subtitle="Annonser inskickade av säljare, sorterade efter senast sparad."
      />

      {rows.length === 0 ? (
        <Annotation>Inga annonser inkomna än</Annotation>
      ) : (
        <div className="overflow-x-auto border border-foreground/30 bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/30 bg-muted/30">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Objekt/Bolag
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Verksamhetstyp
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Ort
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Senast sparad
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-muted-foreground/30">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate({ to: "/admin/annonser/$id", params: { id: r.id } })}
                  className={`cursor-pointer transition-colors duration-500 hover:bg-muted/40 ${
                    justUpdatedId === r.id ? "bg-foreground/10" : ""
                  }`}
                >
                  <td className="px-3 py-2">{r.objektBolag}</td>
                  <td className="px-3 py-2">{r.verksamhetstyp}</td>
                  <td className="px-3 py-2">{r.ort}</td>
                  <td className="px-3 py-2">
                    {r.status ? <StatusTag state={r.status} /> : <WireTag>—</WireTag>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {formatTid(r.senastSparad)}
                    {justUpdatedId === r.id && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        ● nytt
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
