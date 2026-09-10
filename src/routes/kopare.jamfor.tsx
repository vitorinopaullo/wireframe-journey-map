import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";
import { Check } from "lucide-react";
import { readFavoriter } from "@/lib/favoriter";
import { getAnnons } from "@/lib/annons-workflow";
import { getSession } from "@/lib/mock-auth";

export const Route = createFileRoute("/kopare/jamfor")({
  component: Compare,
  validateSearch: (s: Record<string, unknown>) => ({
    ids: (s.ids as string | undefined) ?? "",
  }),
});

type Annons = {
  id: string;
  titel: string;
  kat: string;
  stad: string;
  pris: number;
  hyra: number | null;
  yta: number | null;
  verifierad: boolean;
  bilder: number;
};

/** Bygger jämförelse-raden från köparens sparade favorit, berikad med data från
 * den riktiga annonsen (yta/hyra/bilder/publiceringsstatus) när den fortfarande
 * finns kvar. Fält utan motsvarighet i en riktig annons (omsättning, resultat,
 * hyreskontrakt, inventarier, säljarens svarstid) fanns bara i den gamla
 * hårdkodade ALLA-listan och har tagits bort istället för att fejkas här. */
function toAnnons(f: {
  annonsId: string;
  titel: string;
  pris: number;
  ort: string;
  kategori: string;
}): Annons {
  const live = getAnnons(f.annonsId);
  const draft = live?.draft;
  const yta = draft?.yta ? Number(draft.yta) : null;
  const hyra = draft?.hyra ? Number(draft.hyra) : null;
  return {
    id: f.annonsId,
    titel: live?.titel || f.titel,
    kat: f.kategori,
    stad: live?.draft?.ort || f.ort,
    pris: live?.pris ? Number(live.pris) : f.pris,
    hyra: hyra !== null && !Number.isNaN(hyra) ? hyra : null,
    yta: yta !== null && !Number.isNaN(yta) ? yta : null,
    verifierad: live?.workflow?.state === "publicerad",
    bilder: Array.isArray(draft?.bilder) ? draft.bilder.length : 0,
  };
}

function fmt(n: number) {
  return n.toLocaleString("sv-SE");
}

type Row = {
  label: string;
  get: (a: Annons) => string | number;
  highlight?: "low" | "high"; // lägst eller högst är bäst
  format?: (v: number) => string;
};

const rows: Row[] = [
  { label: "Kategori", get: (a) => a.kat },
  { label: "Stad", get: (a) => a.stad },
  { label: "Pris", get: (a) => a.pris, highlight: "low", format: (v) => `${fmt(v)} kr` },
  {
    label: "Månadshyra",
    get: (a) => a.hyra ?? "—",
    highlight: "low",
    format: (v) => `${fmt(v)} kr`,
  },
  { label: "Yta", get: (a) => (a.yta !== null ? a.yta : "—"), format: (v) => `${v} m²` },
  { label: "Verifierad av TreLink", get: (a) => (a.verifierad ? "Ja" : "Granskas") },
  { label: "Antal bilder", get: (a) => a.bilder },
];

function Compare() {
  const { ids } = Route.useSearch();
  const userId = getSession()?.userId;
  const favoriter = useMemo(() => readFavoriter(userId), [userId]);
  const alla = useMemo(() => {
    const map: Record<string, Annons> = {};
    for (const f of favoriter) map[f.annonsId] = toAnnons(f);
    return map;
  }, [favoriter]);

  const initial = ids
    .split(",")
    .filter((i: string) => Boolean(alla[i]))
    .slice(0, 3);
  const [selected, setSelected] = useState<string[]>(initial);

  const annonser = useMemo(() => selected.map((id) => alla[id]).filter(Boolean), [selected, alla]);

  const removeOne = (id: string) => setSelected((s) => s.filter((x) => x !== id));
  const addOne = (id: string) =>
    setSelected((s) => (s.includes(id) || s.length >= 3 ? s : [...s, id]));

  // best-värde per rad
  const bestPerRow = useMemo(() => {
    return rows.map((r) => {
      if (!r.highlight) return null;
      const vals = annonser.map((a) => Number(r.get(a))).filter((v) => !Number.isNaN(v));
      if (vals.length === 0) return null;
      return r.highlight === "low" ? Math.min(...vals) : Math.max(...vals);
    });
  }, [annonser]);

  const available = Object.values(alla).filter((a) => !selected.includes(a.id));

  return (
    <AppLayout mode="kopare">
      <PageHeader
        eyebrow="Köparläge · Jämför"
        title={`Jämför ${annonser.length} objekt`}
        subtitle="Lägg sida vid sida, se vad som faktiskt skiljer. Bäst värde per rad markeras."
        right={
          <Link
            to="/kopare/favoriter"
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            ← Tillbaka till favoriter
          </Link>
        }
      />

      {/* Lägg till */}
      {available.length > 0 && selected.length < 3 && (
        <WireBox label="Lägg till objekt" variant="dashed" className="mb-6">
          <div className="flex flex-wrap gap-2">
            {available.map((a) => (
              <button
                key={a.id}
                onClick={() => addOne(a.id)}
                className="rounded-button border border-foreground/15 px-3 py-1.5 text-xs transition-colors duration-150 hover:border-foreground/30"
              >
                + {a.titel}
              </button>
            ))}
          </div>
        </WireBox>
      )}

      {favoriter.length === 0 ? (
        <WireBox variant="dashed">
          <p className="text-sm text-muted-foreground">
            Du har inga sparade favoriter än. Gå till Favoriter för att spara objekt att jämföra.
          </p>
          <WireBtn to="/kopare/favoriter" className="mt-3">
            Till Favoriter →
          </WireBtn>
        </WireBox>
      ) : annonser.length === 0 ? (
        <WireBox>
          <p className="text-sm text-muted-foreground">
            Inga objekt valda. Gå till favoriter och välj något att jämföra.
          </p>
        </WireBox>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th className="w-48 border-b border-foreground/30 p-3 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                  Egenskap
                </th>
                {annonser.map((a) => (
                  <th key={a.id} className="border-b border-foreground/30 p-3 text-left align-top">
                    <div className="space-y-2">
                      <div className="flex h-24 items-center justify-center rounded-card border border-foreground/15 bg-muted/20 text-[10px] text-muted-foreground">
                        [ Bild · {a.bilder} st ]
                      </div>
                      <div className="flex items-center gap-2">
                        <WireTag>{a.kat}</WireTag>
                        {a.verifierad && (
                          <WireTag>
                            <Check className="inline-block h-3 w-3 align-middle" /> Verifierad
                          </WireTag>
                        )}
                      </div>
                      <Link
                        to="/annons/$id"
                        params={{ id: a.id }}
                        className="block font-medium hover:underline"
                      >
                        {a.titel}
                      </Link>
                      <div className="flex flex-wrap gap-1">
                        <WireBtn
                          variant="secondary"
                          to="/annons/$id/intresse"
                          params={{ id: a.id }}
                        >
                          Anmäl intresse
                        </WireBtn>
                        <WireBtn
                          variant="tertiary"
                          className="text-xs"
                          onClick={() => removeOne(a.id)}
                        >
                          Ta bort
                        </WireBtn>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const best = bestPerRow[i];
                return (
                  <tr
                    key={r.label}
                    className="border-b border-foreground/10 transition-colors duration-150 hover:bg-muted/20"
                  >
                    <td className="p-3 align-top font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {r.label}
                    </td>
                    {annonser.map((a) => {
                      const raw = r.get(a);
                      const num = Number(raw);
                      const isNumeric = !!r.format && !Number.isNaN(num);
                      const isBest =
                        best !== null && !Number.isNaN(num) && num === best && annonser.length > 1;
                      const display = r.format && !Number.isNaN(num) ? r.format(num) : String(raw);
                      return (
                        <td
                          key={a.id}
                          className={`p-3 align-top text-sm ${isNumeric ? "text-right" : ""}`}
                        >
                          <div
                            className={`flex items-center gap-2 ${isNumeric ? "justify-end" : ""}`}
                          >
                            <span
                              className={`font-mono ${isNumeric ? "tabular-nums" : ""} ${isBest ? "font-semibold" : ""}`}
                            >
                              {display}
                            </span>
                            {isBest && <WireTag>Bäst</WireTag>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Sammanfattning-rad */}
              <tr>
                <td className="p-3 align-top font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Helhet
                </td>
                {annonser.map((a) => (
                  <td key={a.id} className="p-3 align-top">
                    <ul className="space-y-1 text-xs">
                      <li className="flex items-center gap-2">
                        <StatusDot state={a.verifierad ? "done" : "active"} />{" "}
                        {a.verifierad ? "Granskad av TreLink" : "Granskning pågår"}
                      </li>
                      <li className="flex items-center gap-2">
                        <StatusDot state="done" /> Säkert klientmedel
                      </li>
                      <li className="flex items-center gap-2">
                        <StatusDot state="done" /> Anonym tills signering
                      </li>
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <Annotation>
        <span className="mt-6 block">
          Jämförelsen är vägledande. Slutgiltiga uppgifter visas på respektive annons och i due
          diligence-paketet efter intresseanmälan.
        </span>
      </Annotation>
    </AppLayout>
  );
}
