import { Annotation } from "@/components/wire";

export type UppdragsavtalDokumentProps = {
  bolag?: string;
  orgnr?: string;
  firmatecknareNamn?: string;
  firmatecknareRoll?: string;
  verksamhet?: string;
  yta?: string;
  adress?: string;
  ort?: string;
  pris?: string;
  avgift?: string;
};

/** Uppdragsavtalets innehåll — visas för säljaren vid signering och för TreLink
 * vid förhandsgranskning innan avtalet skickas (se annons.$id.tsx / admin.annonser.$id.tsx). */
export function UppdragsavtalDokument({
  bolag,
  orgnr,
  firmatecknareNamn,
  firmatecknareRoll,
  verksamhet,
  yta,
  adress,
  ort,
  pris,
  avgift,
}: UppdragsavtalDokumentProps) {
  return (
    <div className="space-y-4 border border-foreground/30 bg-muted/10 p-4">
      <div>
        <h3 className="text-lg font-semibold">Uppdragsavtal — TreLink</h3>
        <Annotation>Underlag för signering · upprättas digitalt av TreLink</Annotation>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Parter</Annotation>
        <p className="mt-1 text-sm">
          TreLink AB (nedan "TreLink") och {bolag || "—"}
          {orgnr ? ` (org.nr ${orgnr})` : ""} (nedan "Uppdragsgivaren"), företrätt av{" "}
          {firmatecknareNamn || "—"} ({firmatecknareRoll || "Firmatecknare"}).
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Objektet</Annotation>
        <p className="mt-1 text-sm">
          {verksamhet || "—"}
          {yta ? ` · ${yta} m²` : ""} · {adress || ort || "—"}
          {adress && ort ? `, ${ort}` : ""}
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Godkänt pris</Annotation>
        <p className="mt-1 text-sm">{pris ? `${pris} kr` : "—"}</p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Avgift</Annotation>
        <p className="mt-1 text-sm">{avgift || "—"}. Avgiften utgår endast vid genomförd affär.</p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Villkor i korthet</Annotation>
        <ul className="mt-2 space-y-2 text-sm">
          <li>· TreLink skriver annonstexten och sätter priset — Uppdragsgivaren redigerar inte publicerat innehåll.</li>
          <li>· Köpare är anonyma under processen (K-koder). Ingen direktkontakt sker mellan köpare och säljare.</li>
          <li>· TreLink granskar inkommet underlag inom 24 timmar på vardagar.</li>
        </ul>
      </div>
    </div>
  );
}
