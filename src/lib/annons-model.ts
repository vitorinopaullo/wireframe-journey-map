// Delad datamodell för säljarflödets annonsutkast (Draft) — flyttad hit så att
// säljarflödet och admin-vyerna alltid utgår från exakt samma källa för
// avgiftskategorier, dokumentkrav, verksamhetstyper och fältgruppernas struktur.

import { placeholderImage } from "@/lib/placeholder-image";

export type CatId = "overlatelse" | "inkram" | "aktie";

export const cats: {
  id: CatId;
  name: string;
  one: string;
  avgift: string;
  tid: string;
  trelink: string;
  who: string;
}[] = [
  {
    id: "overlatelse",
    name: "Överlåtelse",
    one: "Du överlåter rätten till en hyreslokal — inget bolag, ingen verksamhet byter ägare.",
    avgift: "29 900 kr vid genomförd affär",
    tid: "Typiskt 3–6 veckor",
    trelink: "TreLink kommer att granska de bifogade dokumenten för att sammanställa en annons och avtal och komma igång med processen.",
    who: "Bäst för: restauranger, butiker, salonger som vill släppa lokalen vidare.",
  },
  {
    id: "inkram",
    name: "Inkråm",
    one: "Tillgångar och verksamhet säljs till köparens bolag — du behåller ditt AB.",
    avgift: "39 900 kr vid genomförd affär",
    tid: "Typiskt 6–10 veckor",
    trelink: "TreLink granskar dokument: tillgångar, ekonomi, avtal.",
    who: "Bäst för: när du vill sälja verksamheten men behålla bolagsmanteln.",
  },
  {
    id: "aktie",
    name: "Aktieöverlåtelse",
    one: "Hela bolaget byter ägare. Alla avtal, anställda och historik följer med.",
    avgift: "79 900 kr vid genomförd affär",
    tid: "Typiskt 8–14 veckor",
    trelink: "TreLink kör full DD: AML, verklig huvudman, årsredovisningar, avtal.",
    who: "Bäst för: lönsamma bolag med substans där köparen vill ta över allt.",
  },
];

export type DocState = "saknas" | "uppladdad" | "granskas" | "godkant" | "komplettera";

export type DocSpec = { name: string; krav: string; required: boolean };

export const docsByCat: Record<CatId, DocSpec[]> = {
  overlatelse: [
    { name: "Hyresavtal", krav: "PDF · alla sidor · signerat", required: true },
    { name: "Hyresavi", krav: "PDF · senaste, max 3 mån gammal", required: true },
    { name: "Bilder på lokalen", krav: "JPG/PNG · minst 8 st · dagsljus", required: true },
  ],
  inkram: [
    { name: "Hyresavtal", krav: "PDF · alla sidor · signerat", required: true },
    { name: "Hyresavi", krav: "PDF · senaste, max 3 mån gammal", required: true },
    { name: "Rörelseresultat", krav: "PDF från bokföring · senaste perioden", required: true },
    { name: "Bilder på verksamheten", krav: "JPG/PNG · minst 8 st · dagsljus", required: true },
    { name: "Balansräkning", krav: "PDF · senaste perioden", required: false },
    { name: "Årsredovisning", krav: "PDF · signerad", required: false },
  ],
  aktie: [
    { name: "Hyresavtal", krav: "PDF · alla sidor · signerat", required: true },
    { name: "Hyresavi", krav: "PDF · senaste, max 3 mån gammal", required: true },
    { name: "Rörelseresultat", krav: "PDF från bokföring", required: true },
    { name: "Bilder", krav: "JPG/PNG · minst 8 st · dagsljus", required: true },
    { name: "Balansräkning", krav: "PDF · senaste perioden", required: false },
    { name: "Årsredovisning", krav: "PDF · signerad", required: false },
    { name: "Registreringsbevis", krav: "PDF · max 1 mån gammalt", required: false },
    { name: "Bolagsordning", krav: "PDF · aktuell", required: false },
    { name: "Aktiebrev / aktiebok", krav: "PDF/bild · aktuell", required: false },
    { name: "Bolagspärm", krav: "PDF · protokoll m.m.", required: false },
    { name: "Företagsinteckning", krav: "PDF · om det finns", required: false },
    { name: "Anställningsavtal", krav: "PDF per anställd · personuppgifter maskas av TreLink", required: false },
    { name: "Sociala medier", krav: "Länkar/handles till konton som följer med", required: false },
  ],
};

// Samma 13 undertyper som sökfiltret (@/components/SearchFilters) och
// nyckeltalslogiken (@/lib/nyckeltal) — en källa som båda importerar från,
// så att listorna inte kan glida isär.
export const VERKSAMHETSTYP_TAGGAR = [
  "Butik",
  "Kontor",
  "Lager",
  "Restaurang",
  "Café",
  "Bageri",
  "Bistro",
  "Pub",
  "Vinbar",
  "Frisör",
  "Nagelsalong",
  "Massage",
  "Estetisk",
];

export type KontorFalt = {
  lage: string;
  interior: string;
  planlosning: string;
  ekonomi: string;
  taggar: string;
  beskrivning: string;
};

export type ButikFalt = {
  lage: string;
  interior: string;
  planlosning: string;
  ekonomi: string;
  taggar: string;
  beskrivning: string;
};

export type LagerFalt = {
  lage: string;
  interior: string;
  planlosning: string;
  ekonomi: string;
  taggar: string;
  beskrivning: string;
};

export type ServeringFalt = {
  underrubrik: string;
  lage: string;
  interior: string;
  planlosning: string;
  ekonomi: string;
  koksutrustning: string;
  alkoholtillstand: string;
  utvecklingsmojlighet: string;
  anledningTillForsaljning: string;
  taggar: string;
  typAvKok: string;
  skickILokal: string;
  myndighetskrav: string;
  ovrigInfo: string;
};

export type FrisorFalt = {
  underrubrik: string;
  lage: string;
  interior: string;
  planlosning: string;
  ekonomi: string;
  antalStolar: string;
  taggar: string;
  beskrivning: string;
};

// Mappning fältgrupp-id → vilka Verksamhetstyp-taggar som visar den. En grupp kan delas av flera taggar
// (t.ex. Servering delas av Café & bageri och Restaurang) — den visas då bara en gång.
export const FALTGRUPP_TYPER: Record<string, string[]> = {
  Kontor: ["Kontor"],
  Butik: ["Butik"],
  Lager: ["Lager"],
  Servering: ["Restaurang", "Café", "Bageri", "Bistro", "Pub", "Vinbar"],
  Frisor: ["Frisör", "Nagelsalong", "Massage", "Estetisk"],
};

export type Draft = {
  cat: CatId;
  ort: string;
  adress: string;
  yta: string;
  // Fastighetsinfo & prissättning — sätts av TreLink under Granskning.
  hyra: string;
  fastighetsskatt: string;
  fastighetsbeteckning: string;
  verksamhet: string;
  orgnr: string;
  // Hyresvärd & BRF
  hyresvardNamn: string;
  hyresvardEmail: string;
  hyresvardTel: string;
  brfKontakt: string;
  // Säljande info till TreLink (används för att skriva annonstexten)
  verksamhetSedan: string;
  oppettider: string;
  anstallda: string;
  omsattning: string;
  resultat: string;
  usp: string;
  kundunderlag: string;
  laget: string;
  inventarier: string;
  anledning: string;
  potential: string;
  premium: boolean;
  docs: Record<string, DocState>;
  // Platshållarbilder för galleriuppladdningen i Underlag-steget — se docsByCat's bild-dokument.
  bilder: string[];
  // Fältgrupper per vald Verksamhetstyp — en nyckel per typ som har en egen fältkonfiguration.
  typFalt: {
    Kontor: KontorFalt;
    Butik: ButikFalt;
    Lager: LagerFalt;
    Servering: ServeringFalt;
    Frisor: FrisorFalt;
  };
};

// Delad exempel-annons för den publika sök-/detaljsidan (annons.$id.index.tsx
// och startsidans annonskort) — EN källa för titel/adress/pris/yta osv, så att
// kortet och detaljsidan aldrig kan visa olika uppgifter för samma annons.
export type ExempelAnnons = {
  id: string;
  cat: CatId;
  typ: string;
  titel: string;
  underrubrik: string;
  ort: string;
  adress: string;
  yta: number;
  hyra: number;
  hasFTax: boolean;
  pris: number;
  lonsamt: boolean;
  beskrivning: string[];
  bilder: string[];
  planskiss: string;
};

export const exempelAnnons: ExempelAnnons = {
  id: "1",
  cat: "overlatelse",
  typ: "Restaurang",
  titel: "Restauranglokal · Södermalm",
  underrubrik:
    "Fullt utrustad restauranglokal med uteservering. Lång hyresperiod kvar, fungerande ventilation, A-läge.",
  ort: "Stockholm · Södermalm",
  adress: "Folkungagatan 22",
  yta: 180,
  hyra: 63_000,
  hasFTax: true,
  pris: 1_950_000,
  lonsamt: true,
  beskrivning: [
    "Välskött restauranglokal i ett av Södermalms mest eftertraktade lägen, med högt gångflöde dagtid och kvällstid och gångavstånd till både tunnelbana och buss. Lokalen är fullt utrustad och redo för direkt drift — ingen ombyggnation krävs innan tillträde.",
    "Köket håller professionell standard med kommersiell ventilation, kylrum och diskutrymme dimensionerat för á la carte-verksamhet. Serveringsytan rymmer ca 45 sittplatser inomhus samt ytterligare 20 platser på den uppvärmda uteserveringen under sommarhalvåret.",
    "Hyresavtalet löper med goda villkor och lång återstående löptid, vilket ger en ny ägare stabilitet att bygga vidare på ett redan etablerat kundunderlag. Inventarier, inredning och befintliga leverantörsavtal ingår enligt bifogad inventarielista.",
    "Ägaren har drivit verksamheten i över tio år och säljer i samband med pensionering. Driftpersonal är positiv till att stanna kvar vid ägarbyte, vilket underlättar en smidig övergång.",
  ],
  bilder: [
    placeholderImage("Bild 1", "Fasad & entré"),
    placeholderImage("Bild 2", "Sittplatser"),
    placeholderImage("Bild 3", "Bardisk"),
    placeholderImage("Bild 4", "Kök"),
    placeholderImage("Bild 5", "Uteservering"),
    placeholderImage("Bild 6", "Förråd"),
    placeholderImage("Bild 7", "Toaletter"),
    placeholderImage("Bild 8", "Kvällsbelysning"),
  ],
  planskiss: placeholderImage("Planlösning", "180 m² · skalenlig ritning"),
};
