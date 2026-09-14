// Append-only audit trail for favorit-aktivitet — skiljer sig från de "levande"
// Favorit-posterna i favoriter.ts (som tas bort vid unsave/konvertering): en
// SparadHandelse raderas aldrig, så TreLink kan se en köpares fulla
// sparhistorik även efter att favoriten försvunnit. Historiken visas bara
// per köpare (admin.anvandare.$id.tsx), inte per annons.
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

export function historikForKopare(userId: string): SparadHandelse[] {
  return readAlla().filter((h) => h.userId === userId);
}
