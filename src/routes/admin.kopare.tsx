import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PageHeader, Annotation, WireTag, WireBtn } from "@/components/wire";
import {
  readBuyerInterests,
  patchBuyerInterest,
  statusLabel,
  type BuyerInterest,
  type BuyerInterestStatus,
} from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { markKategoriRead } from "@/lib/admin-notiser";
import { getAccountByUserId } from "@/lib/mock-auth";
import { formatDatum } from "@/lib/format";
import { AlertTriangle, Check } from "lucide-react";

export const Route = createFileRoute("/admin/kopare")({
  component: AdminKopare,
});

type StatusFilter = "alla" | BuyerInterestStatus;

const FILTER_LABEL: Record<StatusFilter, string> = {
  alla: "Alla",
  "väntar-pdf": "Väntar på köparen",
  "vill-ga-vidare": "Vill köpa",
  avböjt: "Avvisat",
};

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

function AdminKopare() {
  const [interests, setInterests] = useState<BuyerInterest[]>(() => readBuyerInterests());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("alla");

  useEffect(() => {
    markKategoriRead("kopare");
  }, []);

  const rows = interests
    .slice()
    .sort((a, b) => (b.skapadAt || "").localeCompare(a.skapadAt || ""))
    .filter((i) => statusFilter === "alla" || i.status === statusFilter);

  function toggleRemarketing(id: string) {
    patchBuyerInterest(id, (item) => ({ ...item, remarketingTag: !item.remarketingTag }));
    setInterests(readBuyerInterests());
  }

  function avvisaLead(id: string) {
    if (!window.confirm("Avvisa det här leadet? Köparen ser det som avvisat.")) return;
    patchBuyerInterest(id, (item) => ({ ...item, status: "avböjt" }));
    setInterests(readBuyerInterests());
  }

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="TreLink Admin"
        title="Köpare/Intressenter"
        subtitle="Alla lead — från klick till PDF-öppning till beslut. Ring säljaren om underlaget inte öppnats."
      />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Status
          </div>
          <div className="flex gap-1.5">
            {(Object.keys(FILTER_LABEL) as StatusFilter[]).map((s) => (
              <WireTag key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {FILTER_LABEL[s]}
              </WireTag>
            ))}
          </div>
        </div>
        <Annotation>
          {rows.length} av {interests.length} lead
        </Annotation>
      </div>

      {rows.length === 0 ? (
        <Annotation>Inga intresseanmälningar än</Annotation>
      ) : (
        <div className="overflow-x-auto border border-foreground/30 bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-foreground/30 bg-muted/30">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Annons
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  K-kod
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Köpare
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Bolag
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  PDF
                </th>
                <th
                  className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground"
                  title="Endast relevant för avvisade leads"
                >
                  Ombokning
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-muted-foreground/30">
              {rows.map((i) => {
                const account = getAccountByUserId(i.userId);
                const bolag = account?.profil?.bolag;
                const forsokteKopaUtanBolag =
                  i.status === "väntar-pdf" &&
                  !bolag &&
                  i.timeline?.some((t) => t.text.includes("Försökte köpa"));
                return (
                  <tr key={i.id} className="transition-colors duration-150 hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <Link
                        to="/admin/annonser/$id"
                        params={{ id: i.annonsId }}
                        className="underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
                      >
                        {getAnnons(i.annonsId)?.titel || `Annons #${i.annonsId}`}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono">{i.kKod}</td>
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
                    <td className="px-3 py-2">
                      {bolag ? (
                        <span className="text-sm">{bolag}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Ej ifyllt</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusTag status={i.status} />
                        {i.status !== "avböjt" && (
                          <WireBtn variant="secondary" onClick={() => avvisaLead(i.id)}>
                            Avvisa
                          </WireBtn>
                        )}
                      </div>
                      {forsokteKopaUtanBolag && (
                        <span className="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-500">
                          <AlertTriangle className="h-3 w-3" /> Försökte köpa — väntar på
                          bolagsuppgifter
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
                    <td className="px-3 py-2">
                      {i.status !== "avböjt" ? (
                        <span className="text-xs text-muted-foreground">–</span>
                      ) : i.remarketingTag ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Check className="h-3.5 w-3.5" /> Märkt
                        </span>
                      ) : (
                        <WireBtn variant="secondary" onClick={() => toggleRemarketing(i.id)}>
                          Märk för ombokning
                        </WireBtn>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{formatDatum(i.skapadAt)}</td>
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
