import { Link } from "@tanstack/react-router";
import { WireTag } from "@/components/wire";

export type Listing = {
  id: string;
  kat: string;
  titel: string;
  pris: string;
  stad: string;
  // F-Skatt är ett fristående fält satt av säljaren — oberoende av kategori/typ.
  hasFTax?: boolean;
  // Lokal
  typ?: string;
  yta?: number;
  hyra?: number;
  // Inkråm
  lokalyta?: number;
  etablerat?: number;
  // Bolag
  omsattning?: string;
  arr?: string;
  bolagsform?: string;
  grundat?: number;
};

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-foreground/20 bg-background p-1.5">
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-xs font-medium">{value}</div>
    </div>
  );
}

function nyckeltalFor(l: Listing): { label: string; value: string }[] {
  if (l.kat === "Lokal" && l.typ != null && l.yta != null && l.hyra != null) {
    return [
      { label: "Yta", value: `${l.yta} kvm` },
      { label: "Hyra", value: `${l.hyra.toLocaleString("sv-SE")} kr/mån` },
      { label: "Typ", value: l.typ },
      { label: "Hyra/kvm", value: `${Math.round(l.hyra / l.yta)} kr/kvm` },
    ];
  }
  if (l.kat === "Inkråm" && l.lokalyta != null && l.etablerat != null) {
    return [
      { label: "Lokalyta", value: `${l.lokalyta} kvm` },
      { label: "Etablerat", value: `${l.etablerat}` },
    ];
  }
  if (l.kat === "Bolag" && l.omsattning && l.arr && l.bolagsform && l.grundat != null) {
    return [
      { label: "Omsättning", value: l.omsattning },
      { label: "ARR", value: l.arr },
      { label: "Bolagsform", value: l.bolagsform },
      { label: "Grundat", value: `${l.grundat}` },
    ];
  }
  return [];
}

export function ListingCard({ l }: { l: Listing }) {
  const nyckeltal = nyckeltalFor(l);

  return (
    <Link
      to="/annons/$id"
      params={{ id: l.id }}
      className="group flex h-full flex-col border border-foreground/30 bg-background hover:border-foreground transition"
    >
      <div className="flex h-48 items-center justify-center border-b border-dashed border-muted-foreground/40 bg-muted/30 text-xs text-muted-foreground">
        [ Bild · {l.kat} ]
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <WireTag>{l.kat}</WireTag>
            {l.hasFTax && <WireTag>F-skatt</WireTag>}
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

        <p className="mt-3 font-mono text-sm">{l.pris} kr</p>
      </div>
    </Link>
  );
}
