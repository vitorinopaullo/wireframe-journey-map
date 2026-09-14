import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PageHeader, Annotation, WireTag } from "@/components/wire";
import { readFavoriter, type Favorit } from "@/lib/favoriter";
import { getAnnons } from "@/lib/annons-workflow";
import { readBuyerInterests } from "@/lib/kopare-workflow";
import { getDeal, annonsInfo } from "@/lib/affar-workflow";
import { getAccountByUserId, getOrCreateBuyerKod } from "@/lib/mock-auth";
import { formatArendeRef } from "@/lib/format";
import { markKategoriRead } from "@/lib/admin-notiser";
import { Check } from "lucide-react";

export const Route = createFileRoute("/admin/sparade")({
  component: AdminSparade,
});

type AnnonsGrupp = {
  annonsId: string;
  titel: string;
  ort: string;
  kategori: string;
  adress: string;
  pris: string;
  favoriter: Favorit[];
};

/** Grupperar favoriter per annons — flera köpare kan spara samma objekt (t.ex.
 * flera restauranglokaler i Södermalm delar titel), och TreLink behöver se
 * alla i ett svep istället för utspridda, orelaterade rader. Samma
 * gruppering/expand-mönster och samma korthuvud (titel, TRL-ref, adress,
 * pris, antal) som Intressenter (admin.kopare.tsx) och Affärer/Uppdrags
 * granskningsgrupper (admin.affarer.index.tsx) — se annonsInfo i
 * affar-workflow.tsx, samma källa som de använder. */
function groupByAnnons(rows: Favorit[]): AnnonsGrupp[] {
  const map = new Map<string, Favorit[]>();
  for (const f of rows) {
    const list = map.get(f.annonsId) ?? [];
    list.push(f);
    map.set(f.annonsId, list);
  }
  const grupper = [...map.entries()].map(([annonsId, favoriter]) => {
    const info = annonsInfo(annonsId);
    return {
      annonsId,
      titel: info.titel,
      ort: info.ort,
      kategori: info.kat,
      adress: getAnnons(annonsId)?.draft?.adress || "Ingen adress angiven",
      pris: info.pris,
      favoriter,
    };
  });
  const nyckel = (g: AnnonsGrupp) =>
    g.favoriter.reduce(
      (nyast, f) => (f.savedAt > nyast ? f.savedAt : nyast),
      g.favoriter[0]?.savedAt ?? "",
    );
  grupper.sort((a, b) => nyckel(b).localeCompare(nyckel(a)));
  return grupper;
}

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

function KandidatRad({ f }: { f: Favorit }) {
  const navigate = useNavigate();
  const account = getAccountByUserId(f.userId);
  const kKod = getOrCreateBuyerKod(f.userId);
  return (
    <tr
      onClick={
        account
          ? () => navigate({ to: "/admin/anvandare/$id", params: { id: account.id } })
          : undefined
      }
      className={`transition-colors duration-150 hover:bg-muted/20 ${account ? "cursor-pointer" : ""}`}
    >
      <td className="px-3 py-2 text-sm">
        {account ? (
          `${account.bankid.fornamn} ${account.bankid.efternamn}`
        ) : (
          <span className="text-xs text-muted-foreground">Okänt konto</span>
        )}
      </td>
      <td className="px-3 py-2 font-mono">{kKod}</td>
      <td className="px-3 py-2">{account?.profil?.telefon || "—"}</td>
      <td className="px-3 py-2">{account?.profil?.epost || "—"}</td>
      <td className="px-3 py-2">
        <ForetagspresentationStatus userId={f.userId} annonsId={f.annonsId} />
      </td>
    </tr>
  );
}

function AnnonsGruppKort({ grupp }: { grupp: AnnonsGrupp }) {
  return (
    <details className="group border border-foreground/30 bg-background">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <WireTag>{grupp.kategori}</WireTag>
            <span className="text-xs text-muted-foreground">{grupp.ort}</span>
          </div>
          <Link
            to="/admin/annonser/$id"
            params={{ id: grupp.annonsId }}
            onClick={(e) => e.stopPropagation()}
            className="underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
          >
            {grupp.titel}
          </Link>
          <div className="font-mono text-[10px] text-muted-foreground">
            {formatArendeRef(grupp.annonsId)}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
            <span>{grupp.adress}</span>
            <span>{grupp.pris}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WireTag>{grupp.favoriter.length} sparade</WireTag>
          <span className="font-mono text-xs text-muted-foreground transition group-open:rotate-45">
            +
          </span>
        </div>
      </summary>
      <div className="overflow-x-auto border-t border-foreground/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/30 bg-muted/30">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                Köpare
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                Köpar-ID
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
            {grupp.favoriter.map((f) => (
              <KandidatRad key={f.userId} f={f} />
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
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
        <div className="space-y-3">
          {grupper.map((grupp) => (
            <AnnonsGruppKort key={grupp.annonsId} grupp={grupp} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
