// Delad affärs-/ärendemodell för köparens "Mina affärer"-vy — extraherad ur
// kopare.affarer.index.tsx (samma mönster som annons-model.ts) så att typer,
// datahantering och stegindikatorn går att återanvända utan att duplicera
// logik, t.ex. i en framtida detaljvy för en enskild affär.

import { StatusDot } from "@/components/wire";
import { getAnnons, patchAnnons } from "@/lib/annons-workflow";
import { patchBuyerInterest, logBuyerEntry, type BuyerInterest } from "@/lib/kopare-workflow";
import type { CatId } from "@/lib/annons-model";

// Samma mönster som KAT_NAMN i admin.annonser.index.tsx/admin.publicerat.tsx
// — de kortare visningsnamnen som används i affärslistorna.
const KAT_NAMN: Record<CatId, "Lokal" | "Inkråm" | "Bolag"> = {
  overlatelse: "Lokal",
  inkram: "Inkråm",
  aktie: "Bolag",
};

export type Steg =
  | "intresse-inskickat"
  | "granskning"
  | "matchad"
  | "handpenning"
  | "hyresvard"
  | "signering"
  | "tilltrade"
  | "klar";

export type Vantar = "dig" | "george" | "saljare" | "hyresvard" | "ingen";

/* ---------- Affärspipeline: köpeavtal → handpenning → hyresvärd → överenskommelse ----------
 * MVP-tillstånd för en enskild affär (kopplad till en BuyerInterest via interestId).
 * Allt simulerat/mockat — inga riktiga betalningar, mail eller e-signeringar. */

export type PartSign = { kopare: boolean; saljare: boolean };

export type KopeavtalState = {
  skapadAt?: string;
  skickadAt?: string;
  signerat: PartSign;
};

export type HandpenningState = {
  kvitto?: string;
  ucUtdrag?: string;
  bekraftadMottagenAt?: string;
};

export type HyresvardBesked = "godkand" | "nekad";

export type HyresvardState = {
  skickadAt?: string;
  besked?: HyresvardBesked;
  beskedAt?: string;
};

export type OverenskommelseState = {
  skapadAt?: string;
  skickadAt?: string;
  signerat: PartSign;
};

export type DealState = {
  interestId: string;
  steg: Steg;
  avvisad?: boolean; // hyresvärden nekade — affären avslutas, annonsen läggs tillbaka live
  kopeavtal?: KopeavtalState;
  handpenning?: HandpenningState;
  hyresvard?: HyresvardState;
  overenskommelse?: OverenskommelseState;
};

export const DEALS_KEY = "trelink-affarer";

export function readDeals(): Record<string, DealState> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DEALS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function writeDeals(deals: Record<string, DealState>) {
  localStorage.setItem(DEALS_KEY, JSON.stringify(deals));
}

export function getDeal(interestId: string): DealState {
  return readDeals()[interestId] ?? { interestId, steg: "granskning" };
}

export function patchDeal(interestId: string, patch: (d: DealState) => DealState): DealState {
  const deals = readDeals();
  const current = deals[interestId] ?? { interestId, steg: "granskning" };
  const next = patch(current);
  deals[interestId] = next;
  writeDeals(deals);
  return next;
}

/** Loggar samma händelse i affärens tillstånd (indirekt via steg) och i
 * intresseanmälans tidslinje, som redan är delad mellan köpar- och
 * säljarvyerna via BuyerInterest.timeline. */
function logBoth(interestId: string, vem: "Köpare" | "TreLink" | "System", text: string) {
  patchBuyerInterest(interestId, (item) => logBuyerEntry(item, vem, text));
}

export function matchaAffar(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({ ...d, steg: "matchad" }));
  logBoth(interestId, "TreLink", "Matchning bekräftad — TreLink upprättar köpeavtalet.");
  return deal;
}

export function skapaKopeavtal(interestId: string) {
  return patchDeal(interestId, (d) => ({
    ...d,
    kopeavtal: { signerat: { kopare: false, saljare: false }, skapadAt: new Date().toISOString() },
  }));
}

export function skickaKopeavtalForSignering(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    kopeavtal: {
      ...(d.kopeavtal ?? { signerat: { kopare: false, saljare: false } }),
      skickadAt: new Date().toISOString(),
    },
  }));
  logBoth(interestId, "TreLink", "Köpeavtal skickat till köpare och säljare för signering.");
  return deal;
}

export function signeraKopeavtal(interestId: string, part: "kopare" | "saljare") {
  const deal = patchDeal(interestId, (d) => {
    const signerat = {
      ...(d.kopeavtal?.signerat ?? { kopare: false, saljare: false }),
      [part]: true,
    };
    const bada = signerat.kopare && signerat.saljare;
    return {
      ...d,
      kopeavtal: { ...d.kopeavtal, signerat },
      steg: bada ? "handpenning" : d.steg,
    };
  });
  logBoth(
    interestId,
    part === "kopare" ? "Köpare" : "TreLink",
    part === "kopare" ? "Du signerade köpeavtalet." : "Säljaren signerade köpeavtalet.",
  );
  if (deal.kopeavtal?.signerat.kopare && deal.kopeavtal?.signerat.saljare) {
    logBoth(
      interestId,
      "System",
      "Köpeavtalet är signerat av båda parter. Nästa steg: handpenning.",
    );
  }
  return deal;
}

export function laddaUppHandpenningKvitto(interestId: string, filnamn: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    handpenning: { ...d.handpenning, kvitto: filnamn },
  }));
  logBoth(interestId, "Köpare", `Laddade upp kvittens för handpenning: ${filnamn}`);
  return deal;
}

export function laddaUppUcUtdrag(interestId: string, filnamn: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    handpenning: { ...d.handpenning, ucUtdrag: filnamn },
  }));
  logBoth(interestId, "Köpare", `Laddade upp UC-utdrag: ${filnamn}`);
  return deal;
}

export function reserveraAnnons(annonsId: string) {
  patchAnnons(annonsId, (item) => ({ ...item, reserverad: true }));
}

export function avreserveraAnnons(annonsId: string) {
  patchAnnons(annonsId, (item) => ({ ...item, reserverad: false }));
}

export function bekraftaHandpenningMottagen(interestId: string, annonsId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    handpenning: { ...d.handpenning, bekraftadMottagenAt: new Date().toISOString() },
    steg: "hyresvard",
  }));
  reserveraAnnons(annonsId);
  logBoth(
    interestId,
    "TreLink",
    "Handpenning mottagen och bekräftad. Annonsen är nu reserverad. Ärendet går vidare till hyresvärden.",
  );
  return deal;
}

export function skickaTillHyresvard(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    hyresvard: { ...d.hyresvard, skickadAt: new Date().toISOString() },
  }));
  logBoth(interestId, "TreLink", "Sammanställning skickad till hyresvärden för godkännande.");
  return deal;
}

export function hyresvardBesked(interestId: string, annonsId: string, besked: HyresvardBesked) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    hyresvard: { ...d.hyresvard, besked, beskedAt: new Date().toISOString() },
    steg: besked === "godkand" ? "signering" : d.steg,
    avvisad: besked === "nekad" ? true : d.avvisad,
  }));
  if (besked === "godkand") {
    logBoth(
      interestId,
      "TreLink",
      "Hyresvärden godkände överlåtelsen. Nästa steg: signering av överenskommelse.",
    );
  } else {
    const annonsFinns = getAnnons(annonsId) !== undefined;
    avreserveraAnnons(annonsId);
    logBoth(
      interestId,
      "TreLink",
      annonsFinns
        ? "Hyresvärden nekade överlåtelsen. Affären avslutas och handpenningen återbetalas. Annonsen är åter publik."
        : "Hyresvärden nekade överlåtelsen. Affären avslutas och handpenningen återbetalas.",
    );
  }
  return deal;
}

export function skapaOverenskommelse(interestId: string) {
  return patchDeal(interestId, (d) => ({
    ...d,
    overenskommelse: {
      signerat: { kopare: false, saljare: false },
      skapadAt: new Date().toISOString(),
    },
  }));
}

export function skickaOverenskommelseForSignering(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    overenskommelse: {
      ...(d.overenskommelse ?? { signerat: { kopare: false, saljare: false } }),
      skickadAt: new Date().toISOString(),
    },
  }));
  logBoth(
    interestId,
    "TreLink",
    "Överenskommelse om överlåtelse skickad till köpare, säljare och TreLink för signering.",
  );
  return deal;
}

export function signeraOverenskommelse(interestId: string, part: "kopare" | "saljare") {
  const deal = patchDeal(interestId, (d) => {
    const signerat = {
      ...(d.overenskommelse?.signerat ?? { kopare: false, saljare: false }),
      [part]: true,
    };
    const bada = signerat.kopare && signerat.saljare;
    return {
      ...d,
      overenskommelse: { ...d.overenskommelse, signerat },
      steg: bada ? "tilltrade" : d.steg,
    };
  });
  logBoth(
    interestId,
    part === "kopare" ? "Köpare" : "TreLink",
    part === "kopare"
      ? "Du signerade överenskommelsen om överlåtelse."
      : "Säljaren signerade överenskommelsen om överlåtelse.",
  );
  if (deal.overenskommelse?.signerat.kopare && deal.overenskommelse?.signerat.saljare) {
    logBoth(
      interestId,
      "System",
      "Överenskommelsen är signerad av alla parter. Nästa steg: tillträde.",
    );
  }
  return deal;
}

export function bekraftaTilltrade(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({ ...d, steg: "klar" }));
  logBoth(interestId, "TreLink", "Tillträde genomfört. Affären är klar.");
  return deal;
}

export type Affar = {
  id: string;
  annonsId: string;
  titel: string;
  ort: string;
  kat: string;
  pris: string;
  steg: Steg;
  vantar: Vantar;
  nastaSteg: string;
  cta?: { label: string };
  sla?: { timmarKvar: number; etikett: string };
  uppdaterad: string;
};

const STEG_ORDNING: Steg[] = [
  "intresse-inskickat",
  "granskning",
  "matchad",
  "handpenning",
  "hyresvard",
  "signering",
  "tilltrade",
  "klar",
];
const STEG_LABEL: Record<Steg, string> = {
  "intresse-inskickat": "Intresse inskickat",
  granskning: "Granskning",
  matchad: "Matchad",
  handpenning: "Handpenning",
  hyresvard: "Hyresvärd",
  signering: "Signering",
  tilltrade: "Tillträde",
  klar: "Klar",
};

export function annonsInfo(annonsId: string) {
  const annons = getAnnons(annonsId);
  return {
    titel: annons?.titel ?? `Annons #${annonsId}`,
    pris: annons?.pris ?? "Pris ej tillgängligt",
    ort: annons?.ort ?? "—",
    kat: annons?.cat ? KAT_NAMN[annons.cat as CatId] : "—",
  };
}

export function senasteUppdatering(interest: BuyerInterest): string {
  const ts = interest.timeline?.[0]?.ts ?? interest.skapadAt;
  return new Date(ts).toLocaleString("sv-SE");
}

export function buildAffarer(interests: BuyerInterest[]): Affar[] {
  return interests
    .filter(
      (i) => i.status === "väntar-pdf" || (i.status === "vill-ga-vidare" && !getDeal(i.id).avvisad),
    )
    .map((i) => {
      const info = annonsInfo(i.annonsId);
      if (i.status === "väntar-pdf") {
        return {
          id: i.id,
          annonsId: i.annonsId,
          titel: info.titel,
          ort: info.ort,
          kat: info.kat,
          pris: info.pris,
          steg: "intresse-inskickat" as Steg,
          vantar: "dig" as Vantar,
          nastaSteg: "Öppna underlaget och ta ställning.",
          cta: { label: "Öppna underlaget →" },
          uppdaterad: senasteUppdatering(i),
        };
      }
      const deal = getDeal(i.id);
      const { vantar, nastaSteg } = vantarFor(deal);
      return {
        id: i.id,
        annonsId: i.annonsId,
        titel: info.titel,
        ort: info.ort,
        kat: info.kat,
        pris: info.pris,
        steg: deal.steg,
        vantar,
        nastaSteg,
        uppdaterad: senasteUppdatering(i),
      };
    });
}

/** Bestämmer vem affären väntar på och vad nästa steg är, utifrån affärens
 * DealState. Grov approximation per steg — tillräckligt för transparens i
 * listvyerna, den fullständiga bilden finns i affärsdetaljvyerna. */
function vantarFor(deal: DealState): { vantar: Vantar; nastaSteg: string } {
  switch (deal.steg) {
    case "granskning":
      return { vantar: "george", nastaSteg: "TreLink granskar och matchar dig med säljaren." };
    case "matchad": {
      if (!deal.kopeavtal?.skickadAt) {
        return { vantar: "george", nastaSteg: "TreLink upprättar köpeavtalet." };
      }
      if (!deal.kopeavtal.signerat.kopare) {
        return { vantar: "dig", nastaSteg: "Signera köpeavtalet." };
      }
      return { vantar: "saljare", nastaSteg: "Väntar på att säljaren signerar köpeavtalet." };
    }
    case "handpenning": {
      if (!deal.handpenning?.kvitto || !deal.handpenning?.ucUtdrag) {
        return {
          vantar: "dig",
          nastaSteg: "Betala handpenning och ladda upp kvittens samt UC-utdrag.",
        };
      }
      return { vantar: "george", nastaSteg: "TreLink bekräftar mottagen handpenning." };
    }
    case "hyresvard": {
      if (!deal.hyresvard?.skickadAt) {
        return { vantar: "george", nastaSteg: "TreLink skickar underlag till hyresvärden." };
      }
      return { vantar: "hyresvard", nastaSteg: "Väntar på hyresvärdens svar." };
    }
    case "signering": {
      if (!deal.overenskommelse?.skickadAt) {
        return {
          vantar: "george",
          nastaSteg: "TreLink upprättar överenskommelsen om överlåtelse.",
        };
      }
      if (!deal.overenskommelse.signerat.kopare) {
        return { vantar: "dig", nastaSteg: "Signera överenskommelsen om överlåtelse." };
      }
      return { vantar: "saljare", nastaSteg: "Väntar på att säljaren signerar överenskommelsen." };
    }
    case "tilltrade":
      return { vantar: "george", nastaSteg: "TreLink bekräftar tillträdet." };
    case "klar":
      return { vantar: "ingen", nastaSteg: "Affären är klar." };
    default:
      return { vantar: "george", nastaSteg: "—" };
  }
}

export function buildAvslutade(interests: BuyerInterest[]) {
  return interests
    .filter((i) => i.status === "avböjt" || getDeal(i.id).avvisad)
    .map((i) => {
      const info = annonsInfo(i.annonsId);
      const deal = getDeal(i.id);
      return {
        id: i.id,
        titel: info.titel,
        pris: info.pris,
        resultat: deal.avvisad
          ? "Nekad av hyresvärden — handpenning återbetalas"
          : "Avvisat av dig",
      };
    });
}

export function Progress({ steg }: { steg: Steg }) {
  const idx = STEG_ORDNING.indexOf(steg);
  return (
    <div className="grid grid-cols-4 gap-1 md:grid-cols-8">
      {STEG_ORDNING.map((s, i) => (
        <div
          key={s}
          className="flex flex-col items-center gap-1 rounded-card border border-foreground/15 bg-background p-2 text-center"
        >
          <StatusDot state={i < idx ? "done" : i === idx ? "active" : "pending"} />
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {STEG_LABEL[s]}
          </span>
        </div>
      ))}
    </div>
  );
}
