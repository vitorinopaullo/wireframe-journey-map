// Delad datamodell för säljarflödets annonsutkast (Draft) — flyttad hit så att
// säljarflödet och admin-vyerna alltid utgår från exakt samma källa för
// avgiftskategorier, dokumentkrav, verksamhetstyper och fältgruppernas struktur.

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
    { name: "Överlåtelseavtal", krav: "PDF · signerat av båda parter (mall finns hos TreLink)", required: true },
    { name: "Hyresavtal", krav: "PDF · alla sidor · signerat", required: true },
    { name: "Hyresavi", krav: "PDF · senaste, max 3 mån gammal", required: true },
    { name: "Bilder på lokalen", krav: "JPG/PNG · minst 6 st · dagsljus", required: true },
  ],
  inkram: [
    { name: "Hyresavtal", krav: "PDF · alla sidor · signerat", required: true },
    { name: "Hyresavi", krav: "PDF · senaste, max 3 mån gammal", required: true },
    { name: "Rörelseresultat", krav: "PDF från bokföring · senaste perioden", required: true },
    { name: "Bilder på verksamheten", krav: "JPG/PNG · minst 6 st · dagsljus", required: true },
    { name: "Balansräkning", krav: "PDF · senaste perioden", required: false },
    { name: "Årsredovisning", krav: "PDF · signerad", required: false },
  ],
  aktie: [
    { name: "Köpeavtal / aktieöverlåtelseavtal", krav: "PDF · mall finns hos TreLink", required: true },
    { name: "Hyresavtal", krav: "PDF · alla sidor · signerat", required: true },
    { name: "Hyresavi", krav: "PDF · senaste, max 3 mån gammal", required: true },
    { name: "Rörelseresultat", krav: "PDF från bokföring", required: true },
    { name: "Bilder", krav: "JPG/PNG · minst 6 st · dagsljus", required: true },
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

// Samma kategorier som TYP-fältet på annonskorten (@/components/ListingCard).
export const VERKSAMHETSTYP_TAGGAR = ["Butik", "Kontor", "Lager", "Mat och dryck", "Skönhetssalong"];

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
  Servering: ["Mat och dryck"],
  Frisor: ["Skönhetssalong"],
};

export type Draft = {
  cat: CatId;
  ort: string;
  adress: string;
  yta: string;
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
  // Fältgrupper per vald Verksamhetstyp — en nyckel per typ som har en egen fältkonfiguration.
  typFalt: {
    Kontor: KontorFalt;
    Butik: ButikFalt;
    Lager: LagerFalt;
    Servering: ServeringFalt;
    Frisor: FrisorFalt;
  };
};
