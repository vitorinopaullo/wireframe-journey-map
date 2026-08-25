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
  publicerad: "success",
};

function StatusTag({ status }: { status: WorkflowState | null }) {
  if (!status) {
    return <WireTag>—</WireTag>;
  }
  const tone = STATUS_TONE[status];
  const cls =
    tone === "success"
      ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
      : tone === "danger"
      ? "border-destructive text-destructive bg-destructive/10"
      : tone === "warn"
      ? "border-amber-500/70 text-amber-700 bg-amber-50/60 dark:text-amber-500 dark:bg-amber-500/10"
      : "border-foreground/20 text-muted-foreground";
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}>
      {stateLabel[status]}
    </span>
  );
}

type NextActor = "trelink" | "saljare" | null;

const NEXT_ACTOR: Record<WorkflowState, NextActor> = {
  granskas: "trelink",
  komplettering: "trelink",
  "hyresvard-notifiering": "trelink",
  "avtal-vantar-signering": "saljare",
  publicerad: null,
  avvisad: null,
};

function NextActorTag({ status }: { status: WorkflowState | null }) {
  if (!status) return null;
  const actor = NEXT_ACTOR[status];
  if (!actor) return null;
  if (actor === "trelink") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]" />
        TreLink
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      <span className="inline-block h-2 w-2 rounded-full border border-foreground/50 bg-background" />
      Säljare/Överlåtare
    </span>
  );
}

type TabId = "granskning" | "signering" | "text" | "publicerad" | "avvisad";

const TABS: { id: TabId; label: string; states: (WorkflowState | null)[] }[] = [
  { id: "granskning", label: "Att granska", states: ["granskas", "komplettering", null] },
  { id: "signering", label: "Väntar på signering", states: ["avtal-vantar-signering"] },
  { id: "text", label: "Redo att skriva text", states: ["hyresvard-notifiering"] },
  { id: "publicerad", label: "Publicerade", states: ["publicerad"] },
  { id: "avvisad", label: "Avvisade", states: ["avvisad"] },
];

function tabForStatus(status: WorkflowState | null): TabId {
  return TABS.find((t) => t.states.includes(status))?.id ?? "granskning";
}

function defaultTab(rows: Row[]): TabId {
  const counts = new Map<TabId, number>();
  for (const r of rows) {
    const tab = tabForStatus(r.status);
    counts.set(tab, (counts.get(tab) ?? 0) + 1);
  }
  if ((counts.get("granskning") ?? 0) > 0) return "granskning";
  if ((counts.get("text") ?? 0) > 0) return "text";
  const firstWithContent = TABS.find((t) => (counts.get(t.id) ?? 0) > 0);
  return firstWithContent?.id ?? "granskning";
}

function AdminAnnonser() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>(() => toRows(readAnnonser()));
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(() => defaultTab(toRows(readAnnonser())));

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

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = rows.filter((r) => tabForStatus(r.status) === t.id).length;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-pill border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors duration-150 ${
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-white)]"
                  : "border-foreground/20 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {rows.filter((r) => tabForStatus(r.status) === activeTab).length === 0 && (
          <WireBox variant="dashed">
            <Annotation>Inga ärenden i denna flik.</Annotation>
          </WireBox>
        )}
        {rows.filter((r) => tabForStatus(r.status) === activeTab).map((r) => (
          <div
            key={r.id}
            onClick={() => navigate({ to: "/admin/annonser/$id", params: { id: r.id } })}
            className="cursor-pointer"
          >
            <WireBox
              className={`flex flex-col gap-4 transition-colors duration-500 hover:border-foreground md:flex-row md:items-center ${
                justUpdatedId === r.id ? "bg-[var(--color-primary)]/10" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <WireTag>{r.kat}</WireTag>
                  <StatusTag status={r.status} />
                  <NextActorTag status={r.status} />
                  {r.status === "hyresvard-notifiering" && (
                    <span className="inline-flex items-center border border-[var(--color-primary)] bg-[var(--color-primary)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
                      Redo att skriva annonstext
                    </span>
                  )}
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
