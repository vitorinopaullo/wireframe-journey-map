import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { readBuyerInterests, STORAGE_KEY as KOPARE_STORAGE_KEY, type BuyerInterest } from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { getSession } from "@/lib/mock-auth";
import { buildAffarer, buildAvslutade, Progress, type Vantar, type Affar } from "@/lib/affar-workflow";

export const Route = createFileRoute("/saljare/affarer")({
  component: SellerDeals,
});

/* ---------- små komponenter ---------- */
function SlaPill({ sla }: { sla?: Affar["sla"] }) {
  if (!sla) return null;
  const akut = sla.timmarKvar <= 48;
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
        akut ? "border-[var(--color-danger)] bg-[var(--color-danger)] text-white" : "border-foreground/20"
      }`}
    >
      ⏱ {sla.etikett}
    </span>
  );
}

function VantarTag({ v }: { v: Vantar }) {
  const map: Record<Vantar, string> = {
    dig: "Väntar på dig",
    george: "Väntar på TreLink",
    saljare: "Väntar på säljare",
    hyresvard: "Väntar på hyresvärd",
    ingen: "—",
  };
  return <WireTag>{map[v]}</WireTag>;
}

function AffarsKort({ a }: { a: Affar }) {
  return (
    <WireBox>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <WireTag>{a.kat}</WireTag>
            <span className="text-xs text-muted-foreground">{a.ort}</span>
            <span className="font-mono text-[10px] text-muted-foreground">#{a.id}</span>
          </div>
          <h3 className="font-semibold">{a.titel}</h3>
          <Annotation>
            {a.pris} · uppdaterad {a.uppdaterad}
          </Annotation>
        </div>
        <div className="flex flex-col items-end gap-2">
          <VantarTag v={a.vantar} />
          <SlaPill sla={a.sla} />
        </div>
      </div>

      <Progress steg={a.steg} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-3">
        <div className="flex-1 min-w-0">
          <Annotation>Nästa steg</Annotation>
          <p className="mt-1 text-sm">{a.nastaSteg}</p>
        </div>
        <WireBtn variant="secondary" to="/affar/$id" params={{ id: a.id }}>
          Öppna affärsdetalj →
        </WireBtn>
      </div>
    </WireBox>
  );
}

/* ---------- sida ---------- */
function SellerDeals() {
  const [interests, setInterests] = useState<BuyerInterest[]>(() => readBuyerInterests());

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === KOPARE_STORAGE_KEY) setInterests(readBuyerInterests());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const egna = useMemo(() => {
    const userId = getSession()?.userId;
    if (!userId) return [];
    return interests.filter((i) => getAnnons(i.annonsId)?.agarUserId === userId);
  }, [interests]);

  const affarer = useMemo(() => buildAffarer(egna), [egna]);
  const avslutade = useMemo(() => buildAvslutade(egna), [egna]);

  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow="Säljarläge"
        title="Mina affärer"
        subtitle="Samma statusvy som köparen ser — full transparens från annonsgodkännande till tillträde."
      />

      <div className="space-y-4">
        {affarer.length === 0 && avslutade.length === 0 ? (
          <WireBox variant="dashed">
            <p className="text-sm text-muted-foreground">Inga pågående affärer än</p>
          </WireBox>
        ) : (
          <>
            {affarer.map((a) => (
              <AffarsKort key={a.id} a={a} />
            ))}

            {avslutade.map((a) => (
              <WireBox key={a.id} className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{a.titel}</h3>
                  <Annotation>
                    #{a.id} · {a.pris} · {a.resultat}
                  </Annotation>
                </div>
              </WireBox>
            ))}
          </>
        )}
      </div>
    </AppLayout>
  );
}
