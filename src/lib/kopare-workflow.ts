// Simple buyer-side interest/decision state + localStorage helpers.
// Prototype only — data lives in the browser. Mirrors the pattern in annons-workflow.ts.

export type BuyerInterestStatus = "väntar-pdf" | "vill-ga-vidare" | "avböjt";

export type BuyerInterest = {
  id: string;
  annonsId: string;
  kKod: string;
  status: BuyerInterestStatus;
  skapadAt: string;
  beslutAt?: string;
};

export const STORAGE_KEY = "kopare-intressen";

export function readBuyerInterests(): BuyerInterest[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function writeBuyerInterests(list: BuyerInterest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function patchBuyerInterest(id: string, patch: (item: BuyerInterest) => BuyerInterest) {
  const list = readBuyerInterests();
  const idx = list.findIndex((i) => i.id === id);
  if (idx < 0) return;
  list[idx] = patch(list[idx]);
  writeBuyerInterests(list);
}

export function getBuyerInterest(id: string): BuyerInterest | undefined {
  return readBuyerInterests().find((i) => i.id === id);
}

/** "K-" + 4 slumpsiffror, unik mot befintliga poster. */
export function genererateKKod(): string {
  const existing = new Set(readBuyerInterests().map((i) => i.kKod));
  let kod: string;
  do {
    kod = `K-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (existing.has(kod));
  return kod;
}
