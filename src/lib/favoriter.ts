// Simple buyer-side favorites state + localStorage helpers.
// Prototype only — data lives in the browser. Mirrors the pattern in kopare-workflow.ts.

export type Favorit = {
  annonsId: string;
  titel: string;
  pris: number;
  ort: string;
  kategori: string;
  savedAt: string;
};

export const STORAGE_KEY = "kopare-favoriter";

export function readFavoriter(): Favorit[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function writeFavoriter(list: Favorit[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function isFavorit(annonsId: string): boolean {
  return readFavoriter().some((f) => f.annonsId === annonsId);
}

export function toggleFavorit(entry: Favorit): Favorit[] {
  const list = readFavoriter();
  const idx = list.findIndex((f) => f.annonsId === entry.annonsId);
  const next = idx >= 0 ? list.filter((f) => f.annonsId !== entry.annonsId) : [...list, entry];
  writeFavoriter(next);
  return next;
}

export function removeFavorit(annonsId: string): Favorit[] {
  const next = readFavoriter().filter((f) => f.annonsId !== annonsId);
  writeFavoriter(next);
  return next;
}
