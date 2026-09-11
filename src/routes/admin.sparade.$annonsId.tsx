import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PageHeader, Annotation } from "@/components/wire";
import { readFavoriter } from "@/lib/favoriter";
import { getAnnons } from "@/lib/annons-workflow";
import { readBuyerInterests } from "@/lib/kopare-workflow";
import { getDeal } from "@/lib/affar-workflow";
import { getAccountByUserId, getOrCreateBuyerKod } from "@/lib/mock-auth";
import { historikForAnnons, HANDELSE_LABEL } from "@/lib/sparade-historik";
import { formatArendeRef, formatDatum } from "@/lib/format";
import { Check } from "lucide-react";

export const Route = createFileRoute("/admin/sparade/$annonsId")({
  component: AdminSparadeDetail,
});

/** Företagspresentation existerar bara från och med att en affär nått
 * granskningssteget (se affar-workflow.tsx) — en köpare som bara sparat
 * annonsen som favorit, utan intresseanmälan eller affär, har helt enkelt
 * ingen sådan status att visa. */
function ForetagspresentationStatus({ userId, annonsId }: { userId?: string; annonsId: string }) {
  const interest = readBuyerInterests().find((i) => i.annonsId === annonsId && i.userId === userId);
  if (!interest) {
    return <span className="text-xs text-muted-foreground">Ej tillämpligt</span>;
  }
  const deal = getDeal(interest.id);
  if (deal.granskning?.foretagspresentation) {
    return (
      <span className="flex items-center gap-1 text-sm">
        <Check className="h-3.5 w-3.5" /> Uppladdad
      </span>
    );
  }
  if (deal.steg === "granskning") {
    return <span className="text-xs text-muted-foreground">Väntar på uppladdning</span>;
  }
  return <span className="text-xs text-muted-foreground">Ej tillämpligt</span>;
}

function AdminSparadeDetail() {
  const navigate = useNavigate();
  const { annonsId } = Route.useParams();
  const annons = getAnnons(annonsId);
  const titel = annons?.titel || `Annons #${annonsId}`;
  const favoriter = readFavoriter().filter((f) => f.annonsId === annonsId);
  const historik = historikForAnnons(annonsId)
    .slice()
    .sort((a, b) => b.ts.localeCompare(a.ts));

  return (
    <AdminLayout>
      <Link
        to="/admin/sparade"
        className="mb-4 inline-block text-xs text-muted-foreground hover:underline"
      >
        ← Tillbaka till Sparade
      </Link>

      <PageHeader eyebrow={`Sparade · ${formatArendeRef(annonsId)}`} title={titel} />

      {favoriter.length === 0 ? (
        <Annotation>Inga sparade favoriter kvar för den här annonsen.</Annotation>
      ) : (
        <div className="overflow-x-auto border border-foreground/30 bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/30 bg-muted/30">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Köpar-ID
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Förnamn
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Efternamn
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Mobil
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Mail
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Företagspresentation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-muted-foreground/30">
              {favoriter.map((f) => {
                const account = getAccountByUserId(f.userId);
                const kKod = getOrCreateBuyerKod(f.userId);
                return (
                  <tr
                    key={f.userId}
                    onClick={
                      account
                        ? () => navigate({ to: "/admin/anvandare/$id", params: { id: account.id } })
                        : undefined
                    }
                    className={`transition-colors duration-150 hover:bg-muted/20 ${
                      account ? "cursor-pointer" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-mono">{kKod}</td>
                    <td className="px-3 py-2">
                      {account ? (
                        account.bankid.fornamn
                      ) : (
                        <span className="text-xs text-muted-foreground">Okänt konto</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{account ? account.bankid.efternamn : "—"}</td>
                    <td className="px-3 py-2">{account?.profil?.telefon || "—"}</td>
                    <td className="px-3 py-2">{account?.profil?.epost || "—"}</td>
                    <td className="px-3 py-2">
                      <ForetagspresentationStatus userId={f.userId} annonsId={annonsId} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-medium">Historik</h2>

      {historik.length === 0 ? (
        <Annotation>Ingen historik för den här annonsen än.</Annotation>
      ) : (
        <div className="overflow-x-auto border border-foreground/30 bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/30 bg-muted/30">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Köpar-ID
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Händelse
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-muted-foreground/30">
              {historik.map((h) => (
                <tr key={h.id} className="transition-colors duration-150 hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono">{getOrCreateBuyerKod(h.userId)}</td>
                  <td className="px-3 py-2">{HANDELSE_LABEL[h.handelse]}</td>
                  <td className="px-3 py-2 font-mono text-xs">{formatDatum(h.ts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
