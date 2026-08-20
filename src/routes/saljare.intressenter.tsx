import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireTag, Annotation } from "@/components/wire";
import { readBuyerInterests, type BuyerInterestStatus } from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { markKategoriRead } from "@/lib/admin-notiser";

export const Route = createFileRoute("/saljare/intressenter")({
  component: Interest,
});

const STATUS_LABEL: Record<BuyerInterestStatus, string> = {
  "väntar-pdf": "Ny",
  "vill-ga-vidare": "Matchad",
  avböjt: "Avvisad",
};

function formatDatum(ts: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function Interest() {
  useEffect(() => {
    markKategoriRead("saljare-intresse");
  }, []);

  const rows = readBuyerInterests()
    .slice()
    .sort((a, b) => (b.skapadAt || "").localeCompare(a.skapadAt || ""))
    .map((i) => ({
      date: formatDatum(i.skapadAt),
      annons: getAnnons(i.annonsId)?.titel || `Annons #${i.annonsId}`,
      code: i.kKod,
      state: STATUS_LABEL[i.status],
    }));

  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow="Säljarläge"
        title="Intresse på mina annonser"
        subtitle="Du ser ATT det finns intresse — TreLink driver matchningen. Köparens identitet skyddas tills signering."
      />
      <WireBox>
        {rows.length === 0 ? (
          <Annotation>Inga intresseanmälningar än.</Annotation>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 border-b border-foreground/30 bg-background text-left text-muted-foreground">
                <th className="py-2 font-mono text-[10px] uppercase tracking-[0.02em]">Datum</th>
                <th className="font-mono text-[10px] uppercase tracking-[0.02em]">Annons</th>
                <th className="font-mono text-[10px] uppercase tracking-[0.02em]">Köpare</th>
                <th className="font-mono text-[10px] uppercase tracking-[0.02em]">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-dashed border-muted-foreground/30 transition-colors duration-150 hover:bg-muted/20">
                  <td className="py-3">{r.date}</td>
                  <td>{r.annons}</td>
                  <td className="font-mono">{r.code}</td>
                  <td><WireTag>{r.state}</WireTag></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Annotation>
          <span className="mt-4 block">Inga kontaktuppgifter visas. Besked från TreLink kommer via mejl.</span>
        </Annotation>
      </WireBox>
    </AppLayout>
  );
}
