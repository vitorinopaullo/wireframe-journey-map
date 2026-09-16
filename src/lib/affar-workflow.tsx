// Delad affärs-/ärendemodell för köparens "Mina affärer"-vy — extraherad ur
// kopare.affarer.index.tsx (samma mönster som annons-model.ts) så att typer,
// datahantering och stegindikatorn går att återanvända utan att duplicera
// logik, t.ex. i en framtida detaljvy för en enskild affär.

import { StatusDot } from "@/components/wire";
import { getAnnons, patchAnnons } from "@/lib/annons-workflow";
import {
  patchBuyerInterest,
  logBuyerEntry,
  readBuyerInterests,
  getBuyerInterest,
  type BuyerInterest,
} from "@/lib/kopare-workflow";
import type { CatId } from "@/lib/annons-model";
import { formatDatum, beloppProcentAvPris } from "@/lib/format";
import { addNotis } from "@/lib/admin-notiser";

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
  | "likvid"
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
  bekraftadMottagenAt?: string;
  // TreLinks egen, av TreLink upprättade kvittens för handpenningen — skilt
  // från kvitto ovan, som är köparens eget underlag. Se
  // skapa/skicka/signeraHandpenningKvittens.
  kvittensSkapadAt?: string;
  kvittensSkickadAt?: string;
  kvittensSignerat?: PartSign;
  kvittensSkickadTillSaljareAt?: string;
};

export type HyresvardBesked = "godkand" | "nekad";

export type HyresvardState = {
  skickadAt?: string;
  besked?: HyresvardBesked;
  beskedAt?: string;
};

/** Överenskommelsen har en tredje signerande part — hyresvärden — utöver
 * köpare/säljare, till skillnad från Köpeavtal och Handpenning-kvittens som
 * bara har två. Egen typ istället för att lägga till hyresvard på PartSign,
 * som skulle tvinga på ett oanvänt fält på de andra två dokumenten. */
export type OverenskommelsePartSign = { kopare: boolean; saljare: boolean; hyresvard: boolean };

export type OverenskommelseState = {
  skapadAt?: string;
  skickadAt?: string;
  signerat: OverenskommelsePartSign;
};

export type LikvidState = {
  begartAt?: string;
  belopp?: number;
  inlamnadAt?: string;
  verifieratAt?: string;
  // TreLinks kvittens för den resterande likviden — mejlas till köparen,
  // kräver ingen signering (till skillnad från handpenningskvittensen).
  kvittensSkapadAt?: string;
  kvittensSkickadAt?: string;
};

export type ArvodeState = {
  belopp?: number;
  lyftAt?: string;
  kvittensSkapadAt?: string;
  utbetaldAt?: string;
};

export type GranskningState = {
  foretagspresentation?: string;
  kycDokument?: string;
  firmatecknare?: boolean;
  // Fallback-kontaktuppgifter när köparen inte själv är firmatecknare —
  // samma fältuppsättning som säljarens firmatecknare-fallback i onboarding.tsx.
  ftRoll?: string;
  ftFornamn?: string;
  ftEfternamn?: string;
  ftMail?: string;
  ftMobil?: string;
  komplettering?: { message: string; at: string };
  // "Inget bolag än"-spåret: köparen kan sakna ett köpande bolag vid
  // granskningsstart. harBolag === false spärrar firmatecknare-frågan (ett
  // bolag som inte finns kan inte ha en firmatecknare) tills bolagKlartAt är
  // satt — omedelbart för hyllbolag, efter bekraftaBolagKlart för
  // starta-bolag. Se angeHarBolag/valjBolagsVag/bekraftaBolagKlart.
  harBolag?: boolean;
  bolagsVal?: "hyllbolag" | "starta-bolag";
  bolagKlartAt?: string;
};

export type DealState = {
  interestId: string;
  steg: Steg;
  avvisad?: boolean; // hyresvärden nekade — affären avslutas, annonsen läggs tillbaka live
  avvisadAvTrelink?: boolean; // TreLink valde en annan kandidat i granskningssteget
  granskning?: GranskningState;
  kopeavtal?: KopeavtalState;
  handpenning?: HandpenningState;
  hyresvard?: HyresvardState;
  likvid?: LikvidState;
  overenskommelse?: OverenskommelseState;
  arvode?: ArvodeState;
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
  const interest = getBuyerInterest(interestId);
  if (interest) {
    addNotis(
      "saljare-affar",
      `Köpeavtal redo för signering — ${annonsInfo(interest.annonsId).titel}`,
      `/saljare/affarer/${interestId}`,
    );
  }
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

export function laddaUppForetagspresentation(interestId: string, filnamn: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    granskning: { ...d.granskning, foretagspresentation: filnamn },
  }));
  logBoth(interestId, "Köpare", `Laddade upp företagspresentation: ${filnamn}`);
  return deal;
}

export function laddaUppKycDokument(interestId: string, filnamn: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    granskning: { ...d.granskning, kycDokument: filnamn },
  }));
  logBoth(interestId, "Köpare", `Laddade upp KYC-dokument: ${filnamn}`);
  return deal;
}

export function angeHarBolag(interestId: string, harBolag: boolean) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    granskning: { ...d.granskning, harBolag },
  }));
  logBoth(
    interestId,
    "Köpare",
    harBolag ? "Bekräftade att du har ett köpande bolag." : "Uppgav att du inte har ett bolag än.",
  );
  return deal;
}

/** Väljer väg för köpare utan bolag. Ett hyllbolag är klart direkt —
 * bolagKlartAt sätts i samma steg. Att starta ett nytt bolag kräver en
 * separat bekräftelse (bekraftaBolagKlart) när det faktiskt är registrerat. */
export function valjBolagsVag(interestId: string, val: "hyllbolag" | "starta-bolag") {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    granskning: {
      ...d.granskning,
      bolagsVal: val,
      bolagKlartAt: val === "hyllbolag" ? new Date().toISOString() : d.granskning?.bolagKlartAt,
    },
  }));
  logBoth(
    interestId,
    "Köpare",
    val === "hyllbolag" ? "Valde att köpa ett hyllbolag." : "Valde att starta ett nytt bolag.",
  );
  return deal;
}

export function bekraftaBolagKlart(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    granskning: { ...d.granskning, bolagKlartAt: new Date().toISOString() },
  }));
  logBoth(interestId, "Köpare", "Bekräftade att det nya bolaget är registrerat.");
  return deal;
}

export function bekraftaFirmatecknare(
  interestId: string,
  data: {
    firmatecknare: boolean;
    ftRoll?: string;
    ftFornamn?: string;
    ftEfternamn?: string;
    ftMail?: string;
    ftMobil?: string;
  },
) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    granskning: { ...d.granskning, ...data },
  }));
  logBoth(
    interestId,
    "Köpare",
    data.firmatecknare
      ? "Bekräftade att du är firmatecknare för bolaget."
      : `Lämnade kontaktuppgifter för firmatecknare: ${data.ftFornamn} ${data.ftEfternamn}`,
  );
  return deal;
}

export function begarKompletteringKop(interestId: string, message: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    granskning: { ...d.granskning, komplettering: { message, at: new Date().toISOString() } },
  }));
  logBoth(
    interestId,
    "TreLink",
    `Begärde komplettering: "${message.slice(0, 80)}${message.length > 80 ? "…" : ""}"`,
  );
  return deal;
}

export function avvisaKandidat(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({ ...d, avvisadAvTrelink: true }));
  logBoth(interestId, "TreLink", "TreLink valde en annan köpare för det här objektet.");
  return deal;
}

/** Är granskningen klar nog för TreLink att matcha den här kandidaten? Samma
 * krav som checklistan på affärens detaljvy: KYC, företagspresentation, och
 * antingen firmatecknare bekräftad/kontaktuppgifter ifyllda eller — om
 * köparen saknar bolag — att bolaget är klart (ett bolag som inte finns kan
 * inte ha en firmatecknare). Delad mellan detaljvyn och de inline
 * Godkänn-knapparna i granskningslistan (admin.affarer.index.tsx) så
 * spärren är exakt densamma på båda ställena. */
export function kanMatchaKandidat(deal: DealState): boolean {
  const kycOk = !!deal.granskning?.kycDokument;
  const firmatecknareOk =
    deal.granskning?.firmatecknare === true ||
    (deal.granskning?.firmatecknare === false &&
      !!deal.granskning?.ftRoll &&
      !!deal.granskning?.ftFornamn &&
      !!deal.granskning?.ftEfternamn &&
      !!deal.granskning?.ftMail &&
      !!deal.granskning?.ftMobil);
  const foretagspresentationOk = !!deal.granskning?.foretagspresentation;
  const harBolagFalse = deal.granskning?.harBolag === false;
  const bolagKlartOk = !!deal.granskning?.bolagKlartAt;
  const firmatecknareEllerBolagOk = harBolagFalse ? bolagKlartOk : firmatecknareOk;
  return kycOk && firmatecknareEllerBolagOk && foretagspresentationOk;
}

export function laddaUppHandpenningKvitto(interestId: string, filnamn: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    handpenning: { ...d.handpenning, kvitto: filnamn },
  }));
  logBoth(interestId, "Köpare", `Laddade upp kvittens för handpenning: ${filnamn}`);
  return deal;
}

export function reserveraAnnons(annonsId: string) {
  patchAnnons(annonsId, (item) => ({ ...item, reserverad: true }));
}

export function avreserveraAnnons(annonsId: string) {
  patchAnnons(annonsId, (item) => ({ ...item, reserverad: false }));
}

export function skapaHandpenningKvittens(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    handpenning: { ...d.handpenning, kvittensSkapadAt: new Date().toISOString() },
  }));
  logBoth(interestId, "TreLink", "TreLink upprättade kvittens för handpenning.");
  return deal;
}

export function skickaHandpenningKvittensForSignering(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    handpenning: { ...d.handpenning, kvittensSkickadAt: new Date().toISOString() },
  }));
  logBoth(interestId, "TreLink", "Kvittens för handpenning skickad till köparen för signering.");
  return deal;
}

/** Både köpare och säljare signerar kvittensen via Signicat, samma mönster
 * som signeraKopeavtal/signeraOverenskommelse. Till skillnad från dessa två
 * finns dock ingen "skicka till säljare"-steg för kvittensen — den
 * vidarebefordras till säljaren automatiskt när köparen signerar (säljaren
 * kan varken se eller signera den innan dess), så
 * kvittensSkickadTillSaljareAt sätts bara vid köparens signatur, inte vid
 * säljarens. */
export function signeraHandpenningKvittens(interestId: string, part: "kopare" | "saljare") {
  const now = new Date().toISOString();
  const deal = patchDeal(interestId, (d) => {
    const kvittensSignerat = {
      ...(d.handpenning?.kvittensSignerat ?? { kopare: false, saljare: false }),
      [part]: true,
    };
    return {
      ...d,
      handpenning:
        part === "kopare"
          ? { ...d.handpenning, kvittensSignerat, kvittensSkickadTillSaljareAt: now }
          : { ...d.handpenning, kvittensSignerat },
    };
  });
  logBoth(
    interestId,
    part === "kopare" ? "Köpare" : "TreLink",
    part === "kopare"
      ? "Du signerade handpenningskvittensen."
      : "Säljaren signerade handpenningskvittensen.",
  );
  if (part === "kopare") {
    logBoth(interestId, "System", "Kvittensen skickades till säljaren.");
    const interest = getBuyerInterest(interestId);
    if (interest) {
      addNotis(
        "saljare-affar",
        `Handpenningskvittens väntar på din signering — ${annonsInfo(interest.annonsId).titel}`,
        `/saljare/affarer/${interestId}`,
      );
    }
  }
  return deal;
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
    steg: besked === "godkand" ? "likvid" : d.steg,
    avvisad: besked === "nekad" ? true : d.avvisad,
  }));
  if (besked === "godkand") {
    logBoth(
      interestId,
      "TreLink",
      "Hyresvärden godkände överlåtelsen. Nästa steg: resterande likvid.",
    );
    addNotis(
      "saljare-affar",
      `Hyresvärden godkände — ${annonsInfo(annonsId).titel}`,
      `/saljare/affarer/${interestId}`,
    );
    addNotis(
      "kopare-affar",
      `Hyresvärden godkände — ${annonsInfo(annonsId).titel}`,
      `/kopare/affarer/${interestId}`,
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
    addNotis(
      "saljare-affar",
      `Hyresvärden nekade — ${annonsInfo(annonsId).titel}`,
      `/saljare/affarer/${interestId}`,
    );
    addNotis(
      "kopare-affar",
      `Hyresvärden nekade — ${annonsInfo(annonsId).titel}`,
      `/kopare/affarer/${interestId}`,
    );
  }
  return deal;
}

export function begarLikvid(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    likvid: { ...d.likvid, begartAt: new Date().toISOString() },
  }));
  logBoth(interestId, "TreLink", "TreLink bad om resterande likvid.");
  return deal;
}

export function lamnaLikvid(interestId: string, belopp: number) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    likvid: { ...d.likvid, belopp, inlamnadAt: new Date().toISOString() },
  }));
  logBoth(
    interestId,
    "Köpare",
    `Lämnade uppgift om betald likvid: ${belopp.toLocaleString("sv-SE")} kr`,
  );
  return deal;
}

export function verifieraLikvid(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    likvid: { ...d.likvid, verifieratAt: new Date().toISOString() },
  }));
  logBoth(interestId, "TreLink", "TreLink verifierade att likvidbeloppet stämmer.");
  return deal;
}

export function skapaLikvidKvittens(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    likvid: { ...d.likvid, kvittensSkapadAt: new Date().toISOString() },
  }));
  logBoth(interestId, "TreLink", "TreLink upprättade kvittens för likvid.");
  return deal;
}

/** Skickar (mejlar) kvittensen till köparen och avräkningen till säljaren —
 * samma belopp, samma kvittensSkickadAt, en enda åtgärd — och avancerar
 * samtidigt till signering. Till skillnad från handpenningskvittensen finns
 * inget separat signeringssteg här, dokumenten är informationella. */
export function skickaLikvidKvittens(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    likvid: { ...d.likvid, kvittensSkickadAt: new Date().toISOString() },
    steg: "signering",
  }));
  logBoth(interestId, "TreLink", "Kvittens för likvid mejlad till köparen.");
  const interest = getBuyerInterest(interestId);
  if (interest) {
    const titel = annonsInfo(interest.annonsId).titel;
    addNotis(
      "kopare-affar",
      `Kvittens för likvid mejlad — ${titel}`,
      `/kopare/affarer/${interestId}`,
    );
    addNotis(
      "saljare-affar",
      `Avräkning för likvid mejlad — ${titel}`,
      `/saljare/affarer/${interestId}`,
    );
  }
  return deal;
}

export function skapaOverenskommelse(interestId: string) {
  return patchDeal(interestId, (d) => ({
    ...d,
    overenskommelse: {
      signerat: { kopare: false, saljare: false, hyresvard: false },
      skapadAt: new Date().toISOString(),
    },
  }));
}

export function skickaOverenskommelseForSignering(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    overenskommelse: {
      ...(d.overenskommelse ?? {
        signerat: { kopare: false, saljare: false, hyresvard: false },
      }),
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

/** Hyresvärden har ingen inloggning i appen, så TreLink simulerar hens
 * Signicat-signatur åt dem (admin.affarer.$id.tsx), på samma sätt som
 * TreLink redan simulerar hyresvärdens ja/nej-besked om själva
 * överlåtelsen. Alla tre parter — inte bara köpare/säljare — måste ha
 * signerat innan steg avancerar till tillträde. */
export function signeraOverenskommelse(
  interestId: string,
  part: "kopare" | "saljare" | "hyresvard",
) {
  const deal = patchDeal(interestId, (d) => {
    const signerat = {
      ...(d.overenskommelse?.signerat ?? { kopare: false, saljare: false, hyresvard: false }),
      [part]: true,
    };
    const alla = signerat.kopare && signerat.saljare && signerat.hyresvard;
    return {
      ...d,
      overenskommelse: { ...d.overenskommelse, signerat },
      steg: alla ? "tilltrade" : d.steg,
    };
  });
  logBoth(
    interestId,
    part === "kopare" ? "Köpare" : "TreLink",
    part === "kopare"
      ? "Du signerade överenskommelsen om överlåtelse."
      : part === "saljare"
        ? "Säljaren signerade överenskommelsen om överlåtelse."
        : "Hyresvärdens signering av överenskommelsen om överlåtelse registrerades av TreLink.",
  );
  if (
    deal.overenskommelse?.signerat.kopare &&
    deal.overenskommelse?.signerat.saljare &&
    deal.overenskommelse?.signerat.hyresvard
  ) {
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

/** Bara meningsfullt när deal.steg === "klar" (styrs av admin-vyn, inte
 * spärrat här) — TreLink lyfter sitt arvode, 10 % av full köpeskilling, och
 * upprättar samtidigt arvodeskvittensen som mejlas till säljaren. */
export function lyftArvode(interestId: string) {
  const interest = getBuyerInterest(interestId);
  const pris = interest ? annonsInfo(interest.annonsId).pris : undefined;
  const belopp = beloppProcentAvPris(pris, 10);
  const now = new Date().toISOString();
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    arvode: { ...d.arvode, belopp, lyftAt: now, kvittensSkapadAt: now },
  }));
  logBoth(interestId, "TreLink", "TreLink lyfte arvode och skickade arvodeskvittens till säljaren.");
  if (interest) {
    addNotis(
      "saljare-affar",
      `Arvodeskvittens skickad — ${annonsInfo(interest.annonsId).titel}`,
      `/saljare/affarer/${interestId}`,
    );
  }
  return deal;
}

/** Bara meningsfullt när deal.arvode?.lyftAt redan är satt (spärras av den
 * anropande vyn, samma konvention som lyftArvode själv redan använder) —
 * markerar att nettoutbetalningen till säljaren faktiskt har skett. */
export function bekraftaUtbetalning(interestId: string) {
  const deal = patchDeal(interestId, (d) => ({
    ...d,
    arvode: { ...d.arvode, utbetaldAt: new Date().toISOString() },
  }));
  logBoth(interestId, "TreLink", "TreLink bekräftade utbetalning till säljaren.");
  const interest = getBuyerInterest(interestId);
  if (interest) {
    addNotis(
      "saljare-affar",
      `Utbetalning genomförd — ${deal.arvode?.belopp?.toLocaleString("sv-SE")} kr till ${annonsInfo(interest.annonsId).titel}`,
      `/saljare/affarer/${interestId}`,
    );
  }
  return deal;
}

/** Dev-only genväg — hoppar direkt till ett valfritt steg i affärspipelinen
 * för testning, och backfyller varje mellanliggande stegs undertillstånd
 * (kopeavtal.signerat, handpenningens kvittensfält, osv.) med rimliga
 * dummyvärden. Andra delar av UI:t läser dessa fält direkt, så att bara
 * sätta `steg` utan att fylla i dem visar trasiga/ofullständiga vyer.
 * Fyller ingenting för steg efter target (t.ex. ingen handpenning-data om
 * target är "matchad"). "tilltrade" har inget eget undertillstånd i den
 * riktiga flödet (bekraftaTilltrade hoppar direkt till "klar"), så både
 * "tilltrade" och "klar" som target landar på steg "klar" — konsekvent med
 * det. */
export function devJumpToSteg(interestId: string, target: Steg): DealState {
  const now = new Date().toISOString();
  const targetIdx = STEG_ORDNING.indexOf(target);
  const atOrBefore = (s: Steg) => STEG_ORDNING.indexOf(s) <= targetIdx;

  const interest = getBuyerInterest(interestId);
  const pris = interest ? annonsInfo(interest.annonsId).pris : undefined;
  const likvidBelopp = beloppProcentAvPris(pris, 90);

  const deal = patchDeal(interestId, (d) => {
    const next: DealState = { ...d };

    if (atOrBefore("granskning")) {
      next.granskning = {
        ...next.granskning,
        kycDokument: "dev-kyc.pdf",
        firmatecknare: true,
        foretagspresentation: "dev-presentation.pdf",
      };
    }
    if (atOrBefore("matchad")) {
      next.kopeavtal = {
        skapadAt: now,
        skickadAt: now,
        signerat: { kopare: true, saljare: true },
      };
    }
    if (atOrBefore("handpenning")) {
      next.handpenning = {
        kvitto: "dev-kvitto.pdf",
        bekraftadMottagenAt: now,
        kvittensSkapadAt: now,
        kvittensSkickadAt: now,
        kvittensSignerat: { kopare: true, saljare: true },
        kvittensSkickadTillSaljareAt: now,
      };
    }
    if (atOrBefore("hyresvard")) {
      // Landar man exakt på "hyresvard" ska svaret INTE redan finnas — i
      // det riktiga flödet hoppar hyresvardBesked direkt vidare till
      // "likvid" så fort ett besked sätts, så steg="hyresvard" med ett
      // besked redan ifyllt är ett tillstånd som aldrig kan nås på riktigt
      // och renderar en tom sektion (den sista grenen i kaskaden är `null`).
      next.hyresvard =
        target === "hyresvard"
          ? { skickadAt: now }
          : { skickadAt: now, besked: "godkand", beskedAt: now };
    }
    if (atOrBefore("likvid")) {
      next.likvid = {
        begartAt: now,
        belopp: likvidBelopp,
        inlamnadAt: now,
        verifieratAt: now,
        kvittensSkapadAt: now,
        kvittensSkickadAt: now,
      };
    }
    if (atOrBefore("signering")) {
      // Precis som hyresvard ovan — att redan stå på steg "signering" med
      // ALLA tre (inklusive hyresvard) redan signerat är omöjligt i det
      // riktiga flödet, eftersom signeraOverenskommelse avancerar steg till
      // "tilltrade" i samma anrop som den tredje signaturen sätts.
      next.overenskommelse = {
        skapadAt: now,
        skickadAt: now,
        signerat:
          target === "signering"
            ? { kopare: true, saljare: true, hyresvard: false }
            : { kopare: true, saljare: true, hyresvard: true },
      };
    }

    next.steg = target === "tilltrade" ? "klar" : target;
    return next;
  });

  logBoth(interestId, "TreLink", `TreLink (dev): hoppade till steg ${STEG_LABEL[target]}`);
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

export const STEG_ORDNING: Steg[] = [
  "intresse-inskickat",
  "granskning",
  "matchad",
  "handpenning",
  "hyresvard",
  "likvid",
  "signering",
  "tilltrade",
  "klar",
];
export const STEG_LABEL: Record<Steg, string> = {
  "intresse-inskickat": "Intresse inskickat",
  granskning: "Granskning",
  matchad: "Köpavtal",
  handpenning: "Handpenning",
  hyresvard: "Hyresvärd",
  likvid: "Insättning likvid",
  signering: "Hyresavtal",
  tilltrade: "Tillträde",
  klar: "Klar",
};

export type GranskningKandidat = {
  interestId: string;
  userId?: string;
  kKod: string;
  foretagspresentation?: string;
};

/** Alla köpare som fortfarande konkurrerar om samma annons i
 * granskningssteget — delas mellan listvyn (admin.affarer.index.tsx) och
 * en enskild affärs detaljvy (admin.affarer.$id.tsx) så att TreLink kan
 * jämföra kandidater innan matchning, med samma definition på båda ställena. */
export function granskningKandidater(annonsId: string): GranskningKandidat[] {
  return readBuyerInterests()
    .filter(
      (i) =>
        i.annonsId === annonsId &&
        i.status === "vill-ga-vidare" &&
        !getDeal(i.id).avvisad &&
        !getDeal(i.id).avvisadAvTrelink &&
        getDeal(i.id).steg === "granskning",
    )
    .map((i) => ({
      interestId: i.id,
      userId: i.userId,
      kKod: i.kKod,
      foretagspresentation: getDeal(i.id).granskning?.foretagspresentation,
    }));
}

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
  return formatDatum(ts);
}

/** Finns det en pågående affär (köparen vill gå vidare, affären inte avvisad)
 * för denna annons? Används för att spärra redigering/avpublicering — samma
 * "aktiv affär"-definition som buildAffarer använder för att räkna in en affär. */
export function harAktivAffar(annonsId: string): boolean {
  return readBuyerInterests().some(
    (i) =>
      i.annonsId === annonsId &&
      i.status === "vill-ga-vidare" &&
      !getDeal(i.id).avvisad &&
      !getDeal(i.id).avvisadAvTrelink,
  );
}

export function buildAffarer(
  interests: BuyerInterest[],
  viewer: "kopare" | "saljare" | "admin" = "kopare",
): Affar[] {
  return interests
    .filter(
      (i) =>
        (i.status === "väntar-pdf" && viewer !== "admin") ||
        (i.status === "vill-ga-vidare" && !getDeal(i.id).avvisad && !getDeal(i.id).avvisadAvTrelink),
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
      if (!deal.handpenning?.kvitto) {
        return {
          vantar: "dig",
          nastaSteg: "Betala handpenning och ladda upp kvittens.",
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
    case "likvid": {
      if (!deal.likvid?.begartAt) {
        return { vantar: "george", nastaSteg: "TreLink begär resterande likvid." };
      }
      if (!deal.likvid?.inlamnadAt) {
        return { vantar: "dig", nastaSteg: "Betala resterande likvid." };
      }
      if (!deal.likvid?.kvittensSkickadAt) {
        return { vantar: "george", nastaSteg: "TreLink verifierar beloppet och skickar kvittens." };
      }
      return { vantar: "george", nastaSteg: "—" };
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

export function buildAvslutade(
  interests: BuyerInterest[],
  viewer: "kopare" | "saljare" | "admin" = "kopare",
) {
  return interests
    .filter((i) => i.status === "avböjt" || getDeal(i.id).avvisad || getDeal(i.id).avvisadAvTrelink)
    .map((i) => {
      const info = annonsInfo(i.annonsId);
      const deal = getDeal(i.id);
      const typ: "avbojt" | "hyresvard-nekad" | "trelink-nekad" = deal.avvisadAvTrelink
        ? "trelink-nekad"
        : deal.avvisad
          ? "hyresvard-nekad"
          : "avbojt";
      return {
        id: i.id,
        titel: info.titel,
        pris: info.pris,
        typ,
        remarketingTag: i.remarketingTag ?? false,
        resultat: deal.avvisadAvTrelink
          ? "TreLink valde en annan köpare"
          : deal.avvisad
            ? "Nekad av hyresvärden — handpenning återbetalas"
            : viewer === "kopare"
              ? "Avvisat av dig"
              : "Köparen tackade nej",
      };
    });
}

// Tillträde och Klar visas inte längre som egna rutor i steppern — en
// affär på något av dessa två steg ritar istället Signering som det sista,
// fullt avklarade steget (se Progress nedan).
const SYNLIGA_STEG = STEG_ORDNING.slice(0, STEG_ORDNING.indexOf("signering") + 1);

export function Progress({ steg }: { steg: Steg }) {
  const idx = STEG_ORDNING.indexOf(steg);
  return (
    <div className="grid grid-cols-4 gap-1 md:grid-cols-7">
      {SYNLIGA_STEG.map((s, i) => (
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
