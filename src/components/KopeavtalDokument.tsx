import { Annotation } from "@/components/wire";

export type KopeavtalDokumentProps = {
  saljareBolag?: string;
  saljareOrgnr?: string;
  kopareBolag?: string;
  kopareOrgnr?: string;
  verksamhet?: string;
  adress?: string;
  ort?: string;
  pris?: string;
};

/** Köpeavtalets innehåll — visas vid TreLinks förhandsgranskning innan avtalet
 * skickas till köpare och säljare för signering (se admin.affarer.$id.tsx). */
export function KopeavtalDokument({
  saljareBolag,
  saljareOrgnr,
  kopareBolag,
  kopareOrgnr,
  verksamhet,
  adress,
  ort,
  pris,
}: KopeavtalDokumentProps) {
  return (
    <div className="space-y-4 border border-foreground/30 bg-muted/10 p-4">
      <div>
        <h3 className="text-lg font-semibold">Köpeavtal — TreLink</h3>
        <Annotation>Underlag för signering · upprättas digitalt av TreLink</Annotation>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Säljare/Överlåtare</Annotation>
        <p className="mt-1 text-sm">
          {saljareBolag || "—"}
          {saljareOrgnr ? ` (org.nr ${saljareOrgnr})` : ""}
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Köpare</Annotation>
        <p className="mt-1 text-sm">
          {kopareBolag || "—"}
          {kopareOrgnr ? ` (org.nr ${kopareOrgnr})` : ""}
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
        <p className="mt-1 text-sm">
          {pris ? `${pris} kr` : "—"}, varav handpenning 10 % erläggs till TreLinks
          klientmedelskonto.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Villkor i korthet</Annotation>
        <ul className="mt-2 space-y-2 text-sm">
          <li>· Handpenning erläggs efter signering, till TreLinks klientmedelskonto.</li>
          <li>· Överlåtelsen är villkorad av hyresvärdens godkännande.</li>
          <li>
            · Tillträde sker först när överenskommelse om överlåtelse är signerad av samtliga
            parter.
          </li>
        </ul>
      </div>
    </div>
  );
}
