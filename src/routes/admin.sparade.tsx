import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PageHeader, Annotation } from "@/components/wire";
import { readFavoriter } from "@/lib/favoriter";
import { getAnnons } from "@/lib/annons-workflow";
import { getAccountByUserId } from "@/lib/mock-auth";
import { formatDatum } from "@/lib/format";

export const Route = createFileRoute("/admin/sparade")({
  component: AdminSparade,
});

function AdminSparade() {
  const rows = readFavoriter()
    .slice()
    .sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="TreLink Admin"
        title="Sparade"
        subtitle="Objekt köpare har sparat som favorit — utan att (ännu) ha anmält intresse."
      />

      {rows.length === 0 ? (
        <Annotation>Inga sparade objekt än</Annotation>
      ) : (
        <div className="overflow-x-auto border border-foreground/30 bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-foreground/30 bg-muted/30">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Datum sparad
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Annons
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Köpare
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
              {rows.map((f) => {
                const account = getAccountByUserId(f.userId);
                return (
                  <tr
                    key={`${f.userId}-${f.annonsId}`}
                    className="transition-colors duration-150 hover:bg-muted/20"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{formatDatum(f.savedAt)}</td>
                    <td className="px-3 py-2">
                      <Link
                        to="/admin/annonser/$id"
                        params={{ id: f.annonsId }}
                        className="underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
                      >
                        {getAnnons(f.annonsId)?.titel || f.titel || `Annons #${f.annonsId}`}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {account ? (
                        <Link
                          to="/admin/anvandare/$id"
                          params={{ id: account.id }}
                          className="text-sm underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
                        >
                          {account.bankid.fornamn} {account.bankid.efternamn}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">Okänt konto</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{f.ort || "—"}</td>
                    <td className="px-3 py-2 font-mono">
                      {f.pris ? `${f.pris.toLocaleString("sv-SE")} kr` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
