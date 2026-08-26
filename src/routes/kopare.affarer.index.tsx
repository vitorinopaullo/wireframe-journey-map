import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { readBuyerInterests, STORAGE_KEY as KOPARE_STORAGE_KEY, type BuyerInterest } from "@/lib/kopare-workflow";
import {
  buildAffarer,
  buildAvslutade,
  Progress,
  type Vantar,
  type Affar,
} from "@/lib/affar-workflow";

export const Route = createFileRoute("/kopare/affarer/")({
  component: BuyerDeals,
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
  const dinTur = a.vantar === "dig";
  return (
    <WireBox className={dinTur ? "border-2 border-foreground" : ""}>
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
        <div className="flex gap-2">
          {a.cta && dinTur && (
            <WireBtn to="/annons/$id/underlag" params={{ id: a.annonsId }}>
              {a.cta.label}
            </WireBtn>
          )}
          <WireBtn variant="secondary" to="/kopare/affarer/$id" params={{ id: a.id }}>
            Öppna affär →
          </WireBtn>
        </div>
      </div>
    </WireBox>
  );
}

/* ---------- sida ---------- */
function BuyerDeals() {
  const [flik, setFlik] = useState<"dig" | "andra" | "klar">("dig");
  const [interests, setInterests] = useState<BuyerInterest[]>(() => readBuyerInterests());

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === KOPARE_STORAGE_KEY) setInterests(readBuyerInterests());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const affarer = useMemo(() => buildAffarer(interests), [interests]);
  const avslutade = useMemo(() => buildAvslutade(interests), [interests]);

  const grupper = useMemo(
    () => ({
      dig: affarer.filter((a) => a.vantar === "dig"),
      andra: affarer.filter((a) => a.vantar !== "dig"),
    }),
    [affarer]
  );

  return (
    <AppLayout mode="kopare">
      <PageHeader
        eyebrow="Köparläge"
        title="Mina affärer"
        subtitle="Allt på ett ställe. Affärer där du behöver agera ligger överst."
        right={
          <div className="flex flex-wrap gap-2">
            <WireTag>{grupper.dig.length} väntar på dig</WireTag>
            <WireTag>{grupper.andra.length} pågår</WireTag>
            <WireTag>{avslutade.length} avslutade</WireTag>
          </div>
        }
      />

      {/* KPI-rad */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Din tur", grupper.dig.length, "Agera nu för att inte tappa platsen"],
          ["Hos TreLink", affarer.filter((a) => a.vantar === "george").length, "TreLink driver framåt"],
          ["Hos hyresvärd", affarer.filter((a) => a.vantar === "hyresvard").length, "Inväntar godkännande"],
          [
            "Akut SLA",
            affarer.filter((a) => a.sla && a.sla.timmarKvar <= 48).length,
            "Förfaller inom 48 h",
          ],
        ].map(([k, v, t]) => (
          <WireBox key={k as string} variant="dashed">
            <Annotation>{k}</Annotation>
            <div className="mt-1 font-mono text-2xl">{v}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t}</p>
          </WireBox>
        ))}
      </div>

      {/* Flikar */}
      <div className="mb-4 flex border-b border-foreground/20">
        {(
          [
            ["dig", `Väntar på dig (${grupper.dig.length})`],
            ["andra", `Pågår hos andra (${grupper.andra.length})`],
            ["klar", `Avslutade (${avslutade.length})`],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFlik(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm transition ${
              flik === k
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Innehåll */}
      <div className="space-y-4">
        {flik === "dig" &&
          (grupper.dig.length === 0 ? (
            <WireBox variant="dashed">
              <p className="text-sm text-muted-foreground">
                Inget kräver din uppmärksamhet just nu. ✓
              </p>
            </WireBox>
          ) : (
            grupper.dig.map((a) => <AffarsKort key={a.id} a={a} />)
          ))}

        {flik === "andra" &&
          (grupper.andra.length === 0 ? (
            <WireBox variant="dashed">
              <p className="text-sm text-muted-foreground">Inga pågående affärer hos andra.</p>
            </WireBox>
          ) : (
            grupper.andra.map((a) => <AffarsKort key={a.id} a={a} />)
          ))}

        {flik === "klar" &&
          avslutade.map((a) => (
            <WireBox key={a.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{a.titel}</h3>
                <Annotation>
                  #{a.id} · {a.pris} · {a.resultat}
                </Annotation>
              </div>
              <Link
                to="/kopare/affarer/$id"
                params={{ id: a.id }}
                className="text-xs text-muted-foreground hover:underline"
              >
                Visa kvitto →
              </Link>
            </WireBox>
          ))}
      </div>
    </AppLayout>
  );
}
