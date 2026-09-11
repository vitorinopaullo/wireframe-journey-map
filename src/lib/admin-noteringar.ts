// TreLink-adminens fritextanteckningar om en köpare/säljare (t.ex. loggade
// samtal). Prototyp/mock — data lever i webbläsaren, precis som mock-auth.ts.

export type AdminNotering = {
  id: string;
  userId: string;
  ts: string;
  text: string;
};

export const STORAGE_KEY = "trelink-admin-noteringar";

function readAlla(): AdminNotering[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function skrivAlla(list: AdminNotering[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Nyast först. */
export function readNoteringar(userId: string): AdminNotering[] {
  return readAlla()
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.ts.localeCompare(a.ts));
}

export function addNotering(userId: string, text: string): AdminNotering {
  const notering: AdminNotering = {
    id: `not-${Date.now()}`,
    userId,
    ts: new Date().toISOString(),
    text,
  };
  skrivAlla([...readAlla(), notering]);
  return notering;
}
