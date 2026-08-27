import { createFileRoute } from "@tanstack/react-router";
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

function formatTid(ts: string) {
  return new Date(ts).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
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

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="TreLink Admin"
        title="Köpare/Intressenter"
        subtitle="Alla lead — från klick till PDF-öppning till beslut. Ring säljaren om underlaget inte öppnats."
      />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
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
                  Datum
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Annons
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  K-kod
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  PDF
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Ombokning
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-muted-foreground/30">
              {rows.map((i) => (
                <tr key={i.id} className="transition-colors duration-150 hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono text-xs">{formatTid(i.skapadAt)}</td>
                  <td className="px-3 py-2">{getAnnons(i.annonsId)?.titel || `Annons #${i.annonsId}`}</td>
                  <td className="px-3 py-2 font-mono">{i.kKod}</td>
                  <td className="px-3 py-2">
                    <WireTag>{statusLabel[i.status]}</WireTag>
                  </td>
                  <td className="px-3 py-2">
                    {i.pdfOppnadAt ? (
                      <span className="text-sm">✓ Öppnat</span>
                    ) : (
                      <span className="inline-flex items-center border border-destructive/60 bg-destructive/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-destructive">
                        Ej öppnat — ring säljaren
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {i.status === "avböjt" &&
                      (i.remarketingTag ? (
                        <span className="text-sm">✓ Märkt</span>
                      ) : (
                        <WireBtn variant="secondary" onClick={() => toggleRemarketing(i.id)}>
                          Märk för ombokning
                        </WireBtn>
                      ))}
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
