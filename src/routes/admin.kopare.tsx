import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PageHeader, Annotation, WireTag } from "@/components/wire";
import {
  readBuyerInterests,
  statusLabel,
  type BuyerInterest,
  type BuyerInterestStatus,
} from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { markKategoriRead } from "@/lib/admin-notiser";
import { getAccountByUserId } from "@/lib/mock-auth";
import { formatDatum, formatArendeRef } from "@/lib/format";
import { AlertTriangle, Check } from "lucide-react";

export const Route = createFileRoute("/admin/kopare")({
  component: AdminKopare,
});

const STATUS_TONE: Record<BuyerInterestStatus, "success" | "danger" | "warn"> = {
  "väntar-pdf": "warn",
  "vill-ga-vidare": "success",
  avböjt: "danger",
};

export function StatusTag({ status }: { status: BuyerInterestStatus }) {
  const tone = STATUS_TONE[status];
  const cls =
    tone === "success"
      ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
      : tone === "danger"
        ? "border-destructive text-destructive bg-destructive/10"
        : "border-amber-500/70 text-amber-700 bg-amber-50/60 dark:text-amber-500 dark:bg-amber-500/10";
  return (
    <span className={`inline-flex items-center rounded-pill border px-3 py-1 text-sm ${cls}`}>
      {statusLabel[status]}
    </span>
  );
}

type SortOrder = "nyast" | "aldst";

type AnnonsGrupp = {
  annonsId: string;
  titel: string;
  interests: BuyerInterest[];
};

/** Grupperar intresseanmälningar per annons — en annons med flera kandidater
 * ska gå att jämföra i ett svep, inte spridas ut som platta, orelaterade rader. */
function groupByAnnons(rows: BuyerInterest[], sortOrder: SortOrder): AnnonsGrupp[] {
  const map = new Map<string, BuyerInterest[]>();
  for (const i of rows) {
    const list = map.get(i.annonsId) ?? [];
    list.push(i);
    map.set(i.annonsId, list);
  }
  const grupper = [...map.entries()].map(([annonsId, interests]) => ({
    annonsId,
    titel: getAnnons(annonsId)?.titel || `Annons #${annonsId}`,
    interests,
  }));
  const nyckel = (g: AnnonsGrupp) =>
    g.interests.reduce(
      (nyast, i) => (i.skapadAt > nyast ? i.skapadAt : nyast),
      g.interests[0]?.skapadAt ?? "",
    );
  grupper.sort((a, b) =>
    sortOrder === "nyast" ? nyckel(b).localeCompare(nyckel(a)) : nyckel(a).localeCompare(nyckel(b)),
  );
  return grupper;
}

function KandidatRad({ i }: { i: BuyerInterest }) {
  const account = getAccountByUserId(i.userId);
  const bolag = account?.profil?.bolag;
  const forsokteKopaUtanBolag = !bolag && i.timeline?.some((t) => t.text.includes("Försökte köpa"));
  return (
    <tr className="transition-colors duration-150 hover:bg-muted/20">
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
      <td className="px-3 py-2 font-mono">{i.kKod}</td>
      <td className="px-3 py-2">
        {bolag ? (
          <span className="text-sm">{bolag}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Ej ifyllt</span>
        )}
        {forsokteKopaUtanBolag && (
          <span className="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-500">
            <AlertTriangle className="h-3 w-3" /> Försökte köpa — väntar på bolagsuppgifter
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        {i.pdfOppnadAt ? (
          <span className="flex items-center gap-1 text-sm">
            <Check className="h-3.5 w-3.5" /> Öppnat
          </span>
        ) : (
          <span className="inline-flex items-center border border-destructive/60 bg-destructive/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-destructive">
            Ej öppnat — ring säljaren
          </span>
        )}
      </td>
      <td className="px-3 py-2 font-mono text-xs">{formatDatum(i.skapadAt)}</td>
    </tr>
  );
}

function AnnonsGruppKort({ grupp }: { grupp: AnnonsGrupp }) {
  return (
    <details className="group border border-foreground/30 bg-background">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
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
        </div>
        <div className="flex items-center gap-2">
          <WireTag>{grupp.interests.length} intresserade</WireTag>
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
                Bolag
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                PDF
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                Datum
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-muted-foreground/30">
            {grupp.interests.map((i) => (
              <KandidatRad key={i.id} i={i} />
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function AdminKopare() {
  const [interests] = useState<BuyerInterest[]>(() => readBuyerInterests());
  const [sortOrder, setSortOrder] = useState<SortOrder>("nyast");

  useEffect(() => {
    markKategoriRead("kopare");
  }, []);

  const rows = interests.filter((i) => i.status === "väntar-pdf");
  const grupper = groupByAnnons(rows, sortOrder);

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="TreLink Admin"
        title="Intressenter"
        subtitle="Alla lead — från klick till PDF-öppning till beslut. Ring säljaren om underlaget inte öppnats."
      />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <Annotation>{rows.length} väntande lead</Annotation>
        <WireTag onClick={() => setSortOrder((s) => (s === "nyast" ? "aldst" : "nyast"))}>
          Sortera: {sortOrder === "nyast" ? "Nyast" : "Äldst"}
        </WireTag>
      </div>

      {grupper.length === 0 ? (
        <Annotation>Inga väntande lead just nu</Annotation>
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
