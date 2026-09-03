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
