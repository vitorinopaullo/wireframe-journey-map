import { Annotation } from "@/components/wire";
import { formatArendeRef, numberToSwedishWords } from "@/lib/format";

export type HandpenningKvittensDokumentProps = {
  interestId: string;
  annonsId: string;
  titel?: string;
  adress?: string;
  ort?: string;
  /** Fullt köpeskilling, formaterat med mellanslag (t.ex. "2 400 000") — handpenningen räknas som 10 % av detta. */
  pris?: string;
  kopareBolag?: string;
  /** Sätts när köparen har signerat — visas som datum i underskriftsfältet istället för en tom rad. */
  kopareSigneradAt?: string;
};

function belopp10Procent(pris?: string): number | undefined {
  if (!pris) return undefined;
  const num = Number(pris.replace(/\s/g, ""));
  if (!Number.isFinite(num) || num <= 0) return undefined;
  return Math.round(num * 0.1);
}

/** TreLinks kvittens för mottagen handpenning — ett eget, av TreLink upprättat
 * dokument, skilt från köparens eget uppladdade kvitto. Generiskt utformat
 * (inte en kopia av något verkligt bolags kvittenslayout), samma visuella
 * språk som KopeavtalDokument/OverenskommelseDokument. */
export function HandpenningKvittensDokument({
  interestId,
  annonsId,
  titel,
  adress,
  ort,
  pris,
  kopareBolag,
  kopareSigneradAt,
}: HandpenningKvittensDokumentProps) {
  const belopp = belopp10Procent(pris);
  const beloppText = belopp !== undefined ? belopp.toLocaleString("sv-SE") : undefined;
  const beloppOrd = belopp !== undefined ? numberToSwedishWords(belopp) : undefined;

  return (
    <div className="space-y-4 border border-foreground/30 bg-muted/10 p-4">
      <div>
        <h3 className="text-lg font-semibold">Kvittens — TreLink</h3>
        <Annotation>Kvittens för mottagen handpenning · upprättas digitalt av TreLink</Annotation>
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
        <Annotation>Betalt av</Annotation>
        <p className="mt-1 text-sm">{kopareBolag || "—"}</p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Specifikation</Annotation>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span>
            Handpenning avseende {titel || "objektet"}
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

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Underskrift</Annotation>
        <div className="mt-2 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="mb-1 border-b border-foreground/30 pb-6" />
            <span className="text-xs text-muted-foreground">
              {kopareBolag || "Köpare"}
              {kopareSigneradAt ? ` · signerat ${kopareSigneradAt}` : ""}
            </span>
          </div>
          <div>
            <div className="mb-1 border-b border-foreground/30 pb-6" />
            <span className="text-xs text-muted-foreground">TreLink AB · förifylld</span>
          </div>
        </div>
      </div>
    </div>
  );
}
