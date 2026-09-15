// Delade format-/valideringshjälpare för mobilnummer och e-post — används
// överallt i appen där dessa fält förekommer (onboarding, admins
// inline-redigering, hyresvärdskontakt), så att reglerna hålls konsekventa.

/** Formaterar mobilnummer medan användaren skriver: 076 12 345 67 — exakt 10 siffror, inte fler eller färre. */
export function formatTelefon(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  const grupper = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 8), digits.slice(8, 10)].filter(Boolean);
  return grupper.join(" ");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Kräver formen namn@domän.tld — täcker .se/.com/.nu/.io osv utan att hårdkoda ändelser. */
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Infogar bindestrecket efter 6 siffror medan användaren skriver: 555555-5555. */
export function formatOrgnr(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  return digits.length <= 6 ? digits : `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

/** Giltigt org.nr-format: exakt 6 siffror, bindestreck, 4 siffror. */
export const ORGNR_REGEX = /^\d{6}-\d{4}$/;

/** Mänskligt läsbar ärendereferens för annonser/affärer/ärenden — samma format
 * överallt så att admin och köpare/säljare pratar om exakt samma referens. */
export function formatArendeRef(id: string): string {
  return "TRL-" + id.slice(-6).toUpperCase();
}

/** Datum utan klockslag, sv-SE — klienten vill aldrig se en exakt tid, bara
 * datumet, i listor, tidslinjer och beslutsloggar. */
export function formatDatum(ts: string | number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("sv-SE", { dateStyle: "short" });
}

/** Ett belopp som en given procentandel av ett formaterat prisvärde (t.ex.
 * "2 400 000") — delad mellan HandpenningKvittensDokument/
 * LikvidKvittensDokument/ArvodeKvittensDokument och admin-vyer som behöver
 * räkna fram samma belopp för visning (t.ex. förväntad likvid). */
export function beloppProcentAvPris(pris: string | undefined, procent: number): number | undefined {
  if (!pris) return undefined;
  const num = Number(pris.replace(/\s/g, ""));
  if (!Number.isFinite(num) || num <= 0) return undefined;
  return Math.round(num * (procent / 100));
}

const ONES = [
  "",
  "ett",
  "två",
  "tre",
  "fyra",
  "fem",
  "sex",
  "sju",
  "åtta",
  "nio",
  "tio",
  "elva",
  "tolv",
  "tretton",
  "fjorton",
  "femton",
  "sexton",
  "sjutton",
  "arton",
  "nitton",
];
const TENS = [
  "",
  "",
  "tjugo",
  "trettio",
  "fyrtio",
  "femtio",
  "sextio",
  "sjuttio",
  "åttio",
  "nittio",
];

/** 0–999 i ord, utan mellanslag (svenska tal skrivs ihop). */
function chunkToWords(num: number): string {
  if (num === 0) return "";
  if (num < 20) return ONES[num];
  if (num < 100) {
    const t = Math.floor(num / 10);
    const o = num % 10;
    return TENS[t] + ONES[o];
  }
  const h = Math.floor(num / 100);
  const rest = num % 100;
  return (h === 1 ? "" : ONES[h]) + "hundra" + chunkToWords(rest);
}

/** Heltal utskrivet i ord på svenska, t.ex. 240000 → "tvåhundrafyrtiotusen".
 * Täcker 0 till strax under en miljard — gott nog för belopp i kronor i den
 * här prototypen, inte en fullständig lingvistisk implementation. */
export function numberToSwedishWords(n: number): string {
  const num = Math.round(Math.abs(n));
  if (num === 0) return "noll";
  const miljoner = Math.floor(num / 1_000_000);
  const tusen = Math.floor((num % 1_000_000) / 1000);
  const rest = num % 1000;
  let out = "";
  if (miljoner > 0) {
    out +=
      (miljoner === 1 ? "en" : chunkToWords(miljoner)) +
      " miljon" +
      (miljoner === 1 ? "" : "er") +
      " ";
  }
  if (tusen > 0) {
    out += (tusen === 1 ? "" : chunkToWords(tusen)) + "tusen ";
  }
  if (rest > 0) {
    out += chunkToWords(rest);
  }
  return out.trim();
}
