import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, WireTag, Annotation } from "@/components/wire";
import { markKategoriRead } from "@/lib/admin-notiser";
import { readBuyerInterests, STORAGE_KEY as KOPARE_STORAGE_KEY, type BuyerInterest } from "@/lib/kopare-workflow";
import { buildAffarer, buildAvslutade, Progress, type Vantar, type Affar } from "@/lib/affar-workflow";

export const Route = createFileRoute("/admin/affarer")({
  component: AdminAffarer,
});

function VantarTag({ v }: { v: Vantar }) {
  const map: Record<Vantar, string> = {
    dig: "Väntar på köparen",
    george: "Väntar på TreLink",
    saljare: "Väntar på säljare",
    hyresvard: "Väntar på hyresvärd",
    ingen: "—",
  };
  return <WireTag>{map[v]}</WireTag>;
}

function AffarsRad({ a }: { a: Affar }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate({ to: "/admin/annonser/$id", params: { id: a.annonsId } })}
      className="cursor-pointer"
    >
      <WireBox className="flex flex-col gap-4 transition-colors hover:border-foreground">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <WireTag>{a.kat}</WireTag>
              <span className="text-xs text-muted-foreground">{a.ort}</span>
              <span className="font-mono text-[10px] text-muted-foreground">#{a.id}</span>
            </div>
            <h3 className="font-medium">{a.titel}</h3>
            <Annotation>
              {a.pris} · uppdaterad {a.uppdaterad}
            </Annotation>
          </div>
          <VantarTag v={a.vantar} />
        </div>

        <Progress steg={a.steg} />
      </WireBox>
    </div>
  );
}

function AdminAffarer() {
  const [interests, setInterests] = useState<BuyerInterest[]>(() => readBuyerInterests());

  useEffect(() => {
    markKategoriRead("affarer");
  }, []);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === KOPARE_STORAGE_KEY) setInterests(readBuyerInterests());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const affarer = useMemo(() => buildAffarer(interests), [interests]);
  const avslutade = useMemo(() => buildAvslutade(interests), [interests]);

  return (
    <AdminLayout>
      <PageHeader eyebrow="TreLink Admin" title="Affärer/Uppdrag" subtitle="Alla pågående och avslutade affärer, över samtliga säljare och köpare." />

      {affarer.length === 0 && avslutade.length === 0 ? (
        <WireBox variant="dashed">
          <Annotation>Inga aktiva affärer än.</Annotation>
        </WireBox>
      ) : (
        <div className="space-y-6">
          {affarer.length > 0 && (
            <div className="space-y-3">
              {affarer.map((a) => (
                <AffarsRad key={a.id} a={a} />
              ))}
            </div>
          )}

          {avslutade.length > 0 && (
            <div>
              <Annotation>Avslutade</Annotation>
              <div className="mt-3 space-y-3">
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
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
