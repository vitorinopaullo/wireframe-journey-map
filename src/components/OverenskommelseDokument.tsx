import { Annotation } from "@/components/wire";

export type OverenskommelseDokumentProps = {
  saljareBolag?: string;
  kopareBolag?: string;
  verksamhet?: string;
  adress?: string;
  ort?: string;
  pris?: string;
};

/** Överenskommelse om överlåtelse — det avslutande avtalet, upprättas och
 * signeras av köpare, säljare och TreLink efter att hyresvärden godkänt
 * överlåtelsen (se admin.affarer.$id.tsx). */
export function OverenskommelseDokument({
  saljareBolag,
  kopareBolag,
  verksamhet,
  adress,
  ort,
  pris,
}: OverenskommelseDokumentProps) {
  return (
    <div className="space-y-4 border border-foreground/30 bg-muted/10 p-4">
      <div>
        <h3 className="text-lg font-semibold">Överenskommelse om överlåtelse — TreLink</h3>
        <Annotation>
          Underlag för signering · upprättas digitalt av TreLink efter hyresvärdens godkännande
        </Annotation>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Parter</Annotation>
        <p className="mt-1 text-sm">
          {saljareBolag || "—"} (Säljare/Överlåtare) och {kopareBolag || "—"} (Köpare), genom
          TreLink AB.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Objektet</Annotation>
        <p className="mt-1 text-sm">
          {verksamhet || "—"} · {adress || ort || "—"}
          {adress && ort ? `, ${ort}` : ""}
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Köpeskilling</Annotation>
        <p className="mt-1 text-sm">{pris ? `${pris} kr` : "—"}</p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Villkor i korthet</Annotation>
        <ul className="mt-2 space-y-2 text-sm">
          <li>· Hyresvärden har godkänt överlåtelsen av hyreskontraktet.</li>
          <li>· Resterande köpeskilling regleras vid tillträde.</li>
          <li>· TreLinks förmedlingsavgift dras från klientmedel vid tillträde.</li>
        </ul>
      </div>
    </div>
  );
}
