import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, WireTag, Annotation } from "@/components/wire";
import { readAnnonser, STORAGE_KEY } from "@/lib/annons-workflow";
import { type CatId } from "@/lib/annons-model";

export const Route = createFileRoute("/admin/publicerat")({
  component: AdminPublicerat,
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
  ort: string;
  publicerad: string;
  pris: string;
};

function toRows(list: any[]): Row[] {
  return list
    .filter((item) => item.workflow?.state === "publicerad")
    .map((item) => {
      const catId: CatId | undefined = item.draft?.cat;
      return {
        id: item.id,
        titel: item.titel || "—",
        kat: catId ? KAT_NAMN[catId] : "Lokal",
        ort: item.draft?.ort || "",
        publicerad: item.workflow?.publiceradAt || "",
        pris: item.pris || "—",
      };
    })
    .sort((a, b) => (b.publicerad || "").localeCompare(a.publicerad || ""));
}

function formatDatum(ts: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("sv-SE");
}

function AdminPublicerat() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>(() => toRows(readAnnonser()));

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      setRows(toRows(readAnnonser()));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="TreLink Admin"
        title="Publicerat"
        subtitle="Alla annonser som är live på trelink.se."
      />

      <div className="space-y-3">
        {rows.length === 0 && (
          <WireBox variant="dashed">
            <Annotation>Inga publicerade annonser än.</Annotation>
          </WireBox>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            onClick={() => navigate({ to: "/annons/$id", params: { id: r.id } })}
            className="cursor-pointer"
          >
            <WireBox className="flex flex-col gap-4 transition-colors duration-150 hover:border-foreground md:flex-row md:items-center">
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <WireTag>{r.kat}</WireTag>
                  <span className="inline-flex items-center rounded-pill border border-[var(--color-success)] bg-[var(--color-success)] px-3 py-1 text-sm text-white">
                    ● LIVE
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">#{r.id}</span>
                </div>
                <h3 className="font-medium">{r.titel}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                  <span>Ort: {r.ort || "—"}</span>
                  <span>Publicerad: {formatDatum(r.publicerad)}</span>
                  <span>Pris: {r.pris} kr</span>
                </div>
              </div>
            </WireBox>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
