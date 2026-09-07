// Delade format-/valideringshjälpare för mobilnummer och e-post — används
// överallt i appen där dessa fält förekommer (onboarding, admins
// inline-redigering, hyresvärdskontakt), så att reglerna hålls konsekventa.

/** Formaterar mobilnummer medan användaren skriver: 076 12 34 56 — exakt 9 siffror, inte fler eller färre. */
export function formatTelefon(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  const grupper = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return grupper.join(" ");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Kräver formen namn@domän.tld — täcker .se/.com/.nu/.io osv utan att hårdkoda ändelser. */
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

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
