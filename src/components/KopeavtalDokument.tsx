import { Annotation } from "@/components/wire";
import { beloppProcentAvPris } from "@/lib/format";
import type { CatId } from "@/lib/annons-model";

export type KopeavtalDokumentProps = {
  saljareBolag?: string;
  saljareOrgnr?: string;
  kopareBolag?: string;
  kopareOrgnr?: string;
  verksamhet?: string;
  adress?: string;
  ort?: string;
  pris?: string;
  /** Namnet på personen som faktiskt signerar för köparens räkning — antingen
   * köparens egen firmatecknare eller en angiven fallback-kontakt (se
   * DealState.granskning i affar-workflow.tsx). Sektionen visas bara när
   * detta är satt. */
  undertecknareNamn?: string;
  undertecknareRoll?: string;
  /** Styr om Personal-avsnittet visas — den garantin (att ingen personal
   * följer med överlåtelsen) är bara relevant vid inkråmsöverlåtelser, inte
   * vid en hyresrätts- eller aktieöverlåtelse. */
  cat?: CatId;
};

/** Köpeavtalets innehåll — visas vid TreLinks förhandsgranskning innan avtalet
 * skickas till köpare och säljare för signering (se admin.affarer.$id.tsx).
 * Sektionsstrukturen är inspirerad av ett verkligt inkråmsöverlåtelseavtal,
 * men all text nedan är TreLinks egen och innehåller inga uppgifter från
 * något verkligt avtal. Siffror hämtas uteslutande från props/affärsdata —
 * inga påhittade datum eller kontonummer. */
export function KopeavtalDokument({
  saljareBolag,
  saljareOrgnr,
  kopareBolag,
  kopareOrgnr,
  verksamhet,
  adress,
  ort,
  pris,
  undertecknareNamn,
  undertecknareRoll,
  cat,
}: KopeavtalDokumentProps) {
  const plats = adress && ort ? `${adress}, ${ort}` : adress || ort || "—";
  const handpenning = beloppProcentAvPris(pris, 10);
  const resterandeLikvid = beloppProcentAvPris(pris, 90);

  return (
    <div className="space-y-4 border border-foreground/30 bg-muted/10 p-4">
      <div>
        <h3 className="text-lg font-semibold">Köpeavtal — TreLink</h3>
        <Annotation>Underlag för signering · upprättas digitalt av TreLink</Annotation>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Säljare</Annotation>
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

      {undertecknareNamn && (
        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <Annotation>Undertecknare</Annotation>
          <p className="mt-1 text-sm">
            {undertecknareNamn}
            {undertecknareRoll ? ` (${undertecknareRoll})` : ""}
          </p>
        </div>
      )}

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Överlåtelse</Annotation>
        <p className="mt-1 text-sm">
          Säljaren överlåter härmed till Köparen {verksamhet || "rörelsen"}, inklusive hyresrätten
          till lokalen på {plats}. Lokalens inventarier och inredning ingår i överlåtelsen enligt
          punkten Inventarier nedan.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Tillträdesdag</Annotation>
        <p className="mt-1 text-sm">
          Exakt tillträdesdag fastställs i den överenskommelse om överlåtelse som upprättas och
          signeras av parterna senare i affären, när samtliga villkor för tillträde är uppfyllda.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Köpeskilling</Annotation>
        <p className="mt-1 text-sm">
          Köpeskillingen uppgår till {pris ? `${pris} kr` : "—"} och betalas i två steg. En
          handpenning om 10 %
          {handpenning !== undefined ? ` (${handpenning.toLocaleString("sv-SE")} kr)` : ""} erläggs
          till TreLinks klientmedelskonto i samband med signering av detta avtal. Resterande likvid
          om 90 %
          {resterandeLikvid !== undefined
            ? ` (${resterandeLikvid.toLocaleString("sv-SE")} kr)`
            : ""}{" "}
          betalas till samma klientmedelskonto inför tillträdet.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Moms</Annotation>
        <p className="mt-1 text-sm">
          Överlåtelsen avser en pågående verksamhet och omfattas därför inte av mervärdesskatt.
          Skulle Skatteverket göra en annan bedömning svarar Köparen för att moms betalas i
          efterhand.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Fördelning av intäkter och kostnader</Annotation>
        <p className="mt-1 text-sm">
          Intäkter och kostnader som hör till tiden före tillträdesdagen tillfaller respektive
          belastar Säljaren. Från och med tillträdesdagen tillfaller intäkter och belastar kostnader
          Köparen. Har en part lagt ut för en kostnad som egentligen tillhör den andra parten
          regleras detta mellan parterna i samband med tillträdet.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Garantier</Annotation>
        <ul className="mt-2 space-y-2 text-sm">
          <li>
            · Säljaren har full och oinskränkt äganderätt till lokalens inventarier och utrustning,
            fria från panträtt eller andra anspråk från tredje part.
          </li>
          <li>· Hyresavtalet är inte föremål för tvist och samtliga hyror är betalda.</li>
          <li>
            · De tillstånd som krävs för att driva verksamheten finns och gäller vid tillträdet.
          </li>
          <li>· Lokalen och inventarierna är rengjorda och i städat skick vid tillträdet.</li>
          <li>· Verksamheten är försäkrad, med premier betalda till och med tillträdesdagen.</li>
        </ul>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Befintligt skick</Annotation>
        <p className="mt-1 text-sm">
          Utöver garantierna ovan överlåts rörelsen i övrigt i befintligt skick. Köparen har haft
          möjlighet att undersöka verksamheten och lokalen innan avtalet ingås och kan inte i
          efterhand åberopa sådant som då kunde upptäckas.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Inventarier</Annotation>
        <p className="mt-1 text-sm">
          Inventarier och utrustning som ingår i överlåtelsen specificeras i en
          inventarieförteckning (bilaga) som båda parter går igenom innan tillträdet.
        </p>
      </div>

      {cat === "inkram" && (
        <div className="border-t border-dashed border-muted-foreground/30 pt-4">
          <Annotation>Personal</Annotation>
          <p className="mt-1 text-sm">
            Säljaren garanterar att verksamheten inte har någon anställd personal som övergår till
            Köparen vid tillträdet. Uppstår trots det ett krav från en tidigare anställd med
            anledning av förhållanden före tillträdesdagen svarar Säljaren för detta.
          </p>
        </div>
      )}

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Särskilda villkor</Annotation>
        <p className="mt-1 text-sm">
          Överlåtelsen är villkorad av att hyresvärden godkänner Köparen som ny hyresgäst. Nekar
          hyresvärden godkännande avslutas affären och handpenningen återbetalas till Köparen.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Försummelse</Annotation>
        <p className="mt-1 text-sm">
          Uteblir tillträdet på grund av Köparens försummelse tillfaller handpenningen Säljaren.
          Uteblir tillträdet på grund av Säljarens försummelse återbetalas handpenningen till
          Köparen, som därutöver har rätt till skadestånd motsvarande handpenningens belopp.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Sekretess</Annotation>
        <p className="mt-1 text-sm">
          Båda parter åtar sig att behandla information om verksamheten och om varandra
          konfidentiellt, både under och efter det att detta avtal upphör att gälla.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Ändringar</Annotation>
        <p className="mt-1 text-sm">
          Ändringar av och tillägg till detta avtal är bindande endast om de görs skriftligen och
          undertecknas av båda parter.
        </p>
      </div>

      <div className="border-t border-dashed border-muted-foreground/30 pt-4">
        <Annotation>Tvist</Annotation>
        <p className="mt-1 text-sm">Tvist med anledning av detta avtal avgörs i allmän domstol.</p>
      </div>
    </div>
  );
}
