// Simple buyer-side favorites state + localStorage helpers.
// Prototype only — data lives in the browser. Mirrors the pattern in kopare-workflow.ts.

export type Favorit = {
  userId: string;
  annonsId: string;
  titel: string;
  pris: number;
  ort: string;
  kategori: string;
  savedAt: string;
};

export const STORAGE_KEY = "kopare-favoriter";

function readAllFavoriter(): Favorit[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Utan userId returneras hela listan (samtliga köpares favoriter). Med
 * userId filtreras listan till den inloggade köparens egna — se
 * Favorit.userId. */
export function readFavoriter(userId?: string): Favorit[] {
  const all = readAllFavoriter();
  return userId === undefined ? all : all.filter((f) => f.userId === userId);
}

export function writeFavoriter(list: Favorit[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function isFavorit(annonsId: string, userId?: string): boolean {
  return readFavoriter(userId).some((f) => f.annonsId === annonsId);
}

export function toggleFavorit(entry: Favorit): Favorit[] {
  const all = readAllFavoriter();
  const idx = all.findIndex((f) => f.annonsId === entry.annonsId && f.userId === entry.userId);
  const next = idx >= 0 ? all.filter((_, i) => i !== idx) : [...all, entry];
  writeFavoriter(next);
  return next.filter((f) => f.userId === entry.userId);
}

export function removeFavorit(annonsId: string, userId: string): Favorit[] {
  const next = readAllFavoriter().filter((f) => !(f.annonsId === annonsId && f.userId === userId));
  writeFavoriter(next);
  return next.filter((f) => f.userId === userId);
}
