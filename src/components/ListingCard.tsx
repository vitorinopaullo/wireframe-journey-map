import { Link } from "@tanstack/react-router";
import { WireTag } from "@/components/wire";

export type Listing = { id: string; kat: string; titel: string; pris: string; stad: string; size: string };

export function ListingCard({ l }: { l: Listing }) {
  return (
    <Link
      to="/annons/$id"
      params={{ id: l.id }}
      className="group block border border-foreground/30 bg-background p-4 hover:border-foreground transition h-full"
    >
      <div className="mb-3 flex h-32 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-xs text-muted-foreground">
        [ Bild · {l.kat} ]
      </div>
      <div className="mb-1 flex items-center justify-between">
        <WireTag>{l.kat}</WireTag>
        <span className="text-xs text-muted-foreground">{l.stad}</span>
      </div>
      <h3 className="mt-2 font-medium group-hover:underline">{l.titel}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{l.size}</p>
      <p className="mt-3 font-mono text-sm">{l.pris} kr</p>
    </Link>
  );
}
