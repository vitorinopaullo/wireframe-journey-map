// Append-only audit trail for favorit-aktivitet — skiljer sig från de "levande"
// Favorit-posterna i favoriter.ts (som tas bort vid unsave/konvertering): en
// SparadHandelse raderas aldrig, så TreLink kan se hela sparhistoriken för en
// annons eller köpare även efter att alla favoriter försvunnit.
// Prototyp/mock — data lever i webbläsaren, precis som favoriter.ts.

export type SparadHandelse = {
  id: string;
  userId: string;
  annonsId: string;
  ts: string;
  handelse: "sparad" | "borttagen" | "omvandlad-till-intresse";
};

export const STORAGE_KEY = "trelink-sparade-historik";

export const HANDELSE_LABEL: Record<SparadHandelse["handelse"], string> = {
  sparad: "Sparade som favorit",
  borttagen: "Tog bort favorit",
  "omvandlad-till-intresse": "Omvandlades till intresseanmälan",
};

function readAlla(): SparadHandelse[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function skrivAlla(list: SparadHandelse[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function loggaHandelse(
  userId: string,
  annonsId: string,
  handelse: SparadHandelse["handelse"],
) {
  const list = readAlla();
  list.push({
    id: `sh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    annonsId,
    ts: new Date().toISOString(),
    handelse,
  });
  skrivAlla(list);
}

export function historikForAnnons(annonsId: string): SparadHandelse[] {
  return readAlla().filter((h) => h.annonsId === annonsId);
}

export function historikForKopare(userId: string): SparadHandelse[] {
  return readAlla().filter((h) => h.userId === userId);
}

/** Alla annons-ID:n som förekommer i historiken, oavsett om de fortfarande
 * har aktiva favoriter — se admin.sparade.index.tsx:s gruppering, som ska
 * visa objekt vars enda spår är historiken (alla favoriter borttagna eller
 * omvandlade till intresse). */
export function annonsIdMedHistorik(): string[] {
  return [...new Set(readAlla().map((h) => h.annonsId))];
}
