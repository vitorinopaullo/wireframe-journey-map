import { Annotation } from "@/components/wire";
import { formatArendeRef, numberToSwedishWords, beloppProcentAvPris } from "@/lib/format";

export type ArvodeKvittensDokumentProps = {
  interestId: string;
  annonsId: string;
  titel?: string;
  adress?: string;
  ort?: string;
  /** Fullt köpeskilling, formaterat med mellanslag (t.ex. "2 400 000") — förmedlingsarvodet räknas som 10 % av detta. */
  pris?: string;
  saljareBolag?: string;
};

/** TreLinks kvittens för det lyfta förmedlingsarvodet — adresserad till
 * säljaren, mejlas/informationell, ingen signering. Samma generiska
 * visuella mönster som Handpenning-/LikvidKvittensDokument. */
export function ArvodeKvittensDokument({
  interestId,
  annonsId,
  titel,
  adress,
  ort,
  pris,
  saljareBolag,
}: ArvodeKvittensDokumentProps) {
  const belopp = beloppProcentAvPris(pris, 10);
  const beloppText = belopp !== undefined ? belopp.toLocaleString("sv-SE") : undefined;
  const beloppOrd = belopp !== undefined ? numberToSwedishWords(belopp) : undefined;

  return (
    <div className="space-y-4 border border-foreground/30 bg-muted/10 p-4">
      <div>
        <h3 className="text-lg font-semibold">Arvodeskvittens — TreLink</h3>
        <Annotation>
          Kvittens för lyft förmedlingsarvode · mejlas till säljaren, ej signering
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
        <Annotation>Adresserad till</Annotation>
        <p className="mt-1 text-sm">{saljareBolag || "—"}</p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Specifikation</Annotation>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span>
            Förmedlingsarvode, 10 % av köpeskilling — {titel || "objektet"}
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
