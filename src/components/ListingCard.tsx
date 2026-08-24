import { Link } from "@tanstack/react-router";
import { WireTag } from "@/components/wire";
import { nyckeltalFor } from "@/lib/nyckeltal";
import type { CatId } from "@/lib/annons-model";

export type Listing = {
  id: string;
  kat: string;
  cat: CatId;
  titel: string;
  pris: string;
  stad: string;
  // F-skatt (kr/mån) sätts av TreLink vid granskning — oberoende av kategori/typ.
  fSkattManad?: number;
  typ?: string;
  adress?: string;
  yta?: number;
  hyra?: number;
  // Mat & dryck / Skönhetssalong — se nyckeltalFor
  omsattning?: string;
  antalAnstallda?: number;
  lonsamt?: boolean;
};

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-foreground/20 bg-background p-1.5">
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-xs font-medium tabular-nums">{value}</div>
    </div>
  );
}

export function ListingCard({ l }: { l: Listing }) {
  const nyckeltal = nyckeltalFor(l);

  return (
    <Link
      to="/annons/$id"
      params={{ id: l.id }}
      className="group flex h-full flex-col overflow-hidden rounded-card bg-background shadow-md transition-shadow duration-150 ease-standard hover:shadow-lg"
    >
      <div className="flex h-48 items-center justify-center bg-muted/30 text-xs text-muted-foreground">
        [ Bild · {l.kat} ]
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <WireTag>{l.kat}</WireTag>
          </div>
          <span className="text-xs text-muted-foreground">{l.stad}</span>
        </div>
        <h3 className="mt-2 font-medium group-hover:underline">{l.titel}</h3>

        {nyckeltal.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {nyckeltal.map((n) => (
              <MiniStat key={n.label} label={n.label} value={n.value} />
            ))}
          </div>
        )}

        <p className="mt-3 font-mono text-sm tabular-nums">{l.pris} kr</p>
      </div>
    </Link>
  );
}
