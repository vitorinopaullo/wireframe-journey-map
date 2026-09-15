import { Annotation } from "@/components/wire";
import { formatArendeRef, numberToSwedishWords, beloppProcentAvPris } from "@/lib/format";

export type LikvidKvittensDokumentProps = {
  interestId: string;
  annonsId: string;
  /** Vem dokumentet visas för — styr titel, ingress och "Betalt av"/"Mottaget
   * för"-sektionen. Samma belopp (90 % av pris) oavsett mottagare; det är
   * samma transaktion sedd från två håll, inte två olika summor. */
  mottagare: "kopare" | "saljare";
  titel?: string;
  adress?: string;
  ort?: string;
  /** Fullt köpeskilling, formaterat med mellanslag (t.ex. "2 400 000") — resterande likvid räknas som 90 % av detta. */
  pris?: string;
  kopareBolag?: string;
  saljareBolag?: string;
};

/** TreLinks dokument för den resterande likviden (90 % av köpeskillingen) —
 * en kvittens till köparen och en avräkning till säljaren, mejlade i samma
 * åtgärd, ingen signering krävs (till skillnad från
 * HandpenningKvittensDokument). Generiskt utformat, samma visuella språk
 * som övriga kvittens-/avtalsdokument. */
export function LikvidKvittensDokument({
  interestId,
  annonsId,
  mottagare,
  titel,
  adress,
  ort,
  pris,
  kopareBolag,
  saljareBolag,
}: LikvidKvittensDokumentProps) {
  const belopp = beloppProcentAvPris(pris, 90);
  const beloppText = belopp !== undefined ? belopp.toLocaleString("sv-SE") : undefined;
  const beloppOrd = belopp !== undefined ? numberToSwedishWords(belopp) : undefined;

  return (
    <div className="space-y-4 border border-foreground/30 bg-muted/10 p-4">
      <div>
        <h3 className="text-lg font-semibold">
          {mottagare === "kopare" ? "Kvittens — TreLink" : "Avräkning — TreLink"}
        </h3>
        <Annotation>
          {mottagare === "kopare"
            ? "Kvittens för likvid · mejlas till köparen, ej signering"
            : "Avräkning för likvid · mejlas till säljaren, ej signering"}
        </Annotation>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-dashed border-muted-foreground/30 pt-4">
        <div>
          <Annotation>Kvittensnummer</Annotation>
          <p className="mt-1 font-mono text-sm">{formatArendeRef(interestId)}</p>
        </div>
        <div>
          <Annotation>Uppdragsnummer</Annotation>
          <p className="mt-1 font-mono text-sm">{formatArendeRef(annonsId)}</p>
        </div>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        {mottagare === "kopare" ? (
          <>
            <Annotation>Betalt av</Annotation>
            <p className="mt-1 text-sm">{kopareBolag || "—"}</p>
          </>
        ) : (
          <>
            <Annotation>Mottaget för</Annotation>
            <p className="mt-1 text-sm">
              TreLink har mottagit beloppet på klientmedelskontot för {saljareBolag || "säljarens"}{" "}
              räkning och inkluderar det i avräkningen.
            </p>
          </>
        )}
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Specifikation</Annotation>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span>
            Resterande likvid avseende {titel || "objektet"}
            {adress ? ` · ${adress}` : ort ? ` · ${ort}` : ""}
          </span>
          <span className="tabular-nums">{beloppText ? `${beloppText} kr` : "—"}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <div className="flex items-center justify-between">
          <Annotation>Summa</Annotation>
          <span className="text-sm font-semibold tabular-nums">
            {beloppText ? `${beloppText} kr` : "—"}
          </span>
        </div>
        {beloppOrd && (
          <p className="mt-1 text-xs text-muted-foreground">
            {beloppOrd.charAt(0).toUpperCase() + beloppOrd.slice(1)} kronor
          </p>
        )}
      </div>
    </div>
  );
}
