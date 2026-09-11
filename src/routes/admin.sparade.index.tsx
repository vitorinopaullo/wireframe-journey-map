import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PageHeader, Annotation } from "@/components/wire";
import { readFavoriter, type Favorit } from "@/lib/favoriter";
import { getAnnons } from "@/lib/annons-workflow";
import { historikForAnnons, annonsIdMedHistorik } from "@/lib/sparade-historik";
import { formatArendeRef } from "@/lib/format";
import { markKategoriRead } from "@/lib/admin-notiser";

export const Route = createFileRoute("/admin/sparade/")({
  component: AdminSparade,
});

type AnnonsGrupp = {
  annonsId: string;
  titel: string;
  ort: string;
  pris: number;
  antalNu: number;
  antalHistorik: number;
  senasteSparad: string;
};

/** Grupperar favoriter per annons — flera köpare kan spara samma objekt (t.ex.
 * flera restauranglokaler i Södermalm delar titel), och TreLink behöver se
 * alla i ett svep istället för utspridda, orelaterade rader (samma princip
 * som admin.kopare.tsx:s gruppering av intresseanmälningar). Tar även med
 * annonser som saknar aktiva favoriter men har historik (alla favoriter
 * borttagna eller omvandlade till intresse) — TreLink ska aldrig tappa
 * tråden bara för att listan över levande favoriter blev tom. */
function groupByAnnons(rows: Favorit[]): AnnonsGrupp[] {
  const map = new Map<string, Favorit[]>();
  for (const f of rows) {
    const list = map.get(f.annonsId) ?? [];
    list.push(f);
    map.set(f.annonsId, list);
  }
  for (const annonsId of annonsIdMedHistorik()) {
    if (!map.has(annonsId)) map.set(annonsId, []);
  }
  const grupper = [...map.entries()].map(([annonsId, favoriter]) => {
    const historik = historikForAnnons(annonsId);
    const senasteSparad =
      favoriter.length > 0
        ? favoriter.reduce(
            (nyast, f) => (f.savedAt > nyast ? f.savedAt : nyast),
            favoriter[0].savedAt,
          )
        : historik.reduce((nyast, h) => (h.ts > nyast ? h.ts : nyast), historik[0]?.ts ?? "");
    return {
      annonsId,
      titel: getAnnons(annonsId)?.titel || favoriter[0]?.titel || `Annons #${annonsId}`,
      ort: favoriter[0]?.ort || "—",
      pris: favoriter[0]?.pris ?? 0,
      antalNu: favoriter.length,
      antalHistorik: historik.length,
      senasteSparad,
    };
  });
  grupper.sort((a, b) => b.senasteSparad.localeCompare(a.senasteSparad));
  return grupper;
}

function AdminSparade() {
  useEffect(() => {
    markKategoriRead("sparade");
  }, []);

  const grupper = groupByAnnons(readFavoriter());

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="TreLink Admin"
        title="Sparade"
        subtitle="Objekt köpare har sparat — utan att (ännu) ha anmält intresse."
      />

      {grupper.length === 0 ? (
        <Annotation>Inga sparade objekt än</Annotation>
      ) : (
        <div className="overflow-x-auto border border-foreground/30 bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-foreground/30 bg-muted/30">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  TRL-ref
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Annons
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Sparade
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Ort
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Pris
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-muted-foreground/30">
              {grupper.map((g) => (
                <tr key={g.annonsId} className="transition-colors duration-150 hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono text-xs">{formatArendeRef(g.annonsId)}</td>
                  <td className="px-3 py-2">
                    <Link
                      to="/admin/sparade/$annonsId"
                      params={{ annonsId: g.annonsId }}
                      className="underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
                    >
                      {g.titel}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {g.antalNu} sparade nu
                    {g.antalNu === 0 && g.antalHistorik > 0 && ` · ${g.antalHistorik} i historik`}
                  </td>
                  <td className="px-3 py-2">{g.ort}</td>
                  <td className="px-3 py-2 font-mono">
                    {g.pris ? `${g.pris.toLocaleString("sv-SE")} kr` : "—"}
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
