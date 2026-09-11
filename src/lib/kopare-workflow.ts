// Simple buyer-side interest/decision state + localStorage helpers.
// Prototype only — data lives in the browser. Mirrors the pattern in annons-workflow.ts.

import { removeFavorit } from "@/lib/favoriter";
import { getAnnons } from "@/lib/annons-workflow";
import { addNotis } from "@/lib/admin-notiser";
import { formatArendeRef } from "@/lib/format";
import { getOrCreateBuyerKod } from "@/lib/mock-auth";

export type BuyerInterestStatus = "väntar-pdf" | "vill-ga-vidare" | "avböjt";

export type BuyerTimelineEntry = { ts: string; vem: "Köpare" | "TreLink" | "System"; text: string };

export type BuyerInterest = {
  id: string;
  annonsId: string;
  kKod: string;
  status: BuyerInterestStatus;
  skapadAt: string;
  beslutAt?: string;
  timeline?: BuyerTimelineEntry[];
  pdfOppnadAt?: string;
  remarketingTag?: boolean;
  // Länkar intresset till kontot som skapade det — inte synligt för säljaren
  // (som bara ser K-koden), men gör att TreLink admin kan slå upp t.ex.
  // köparens bolagsuppgifter för det aktuella intresset.
  userId?: string;
};

export const statusLabel: Record<BuyerInterestStatus, string> = {
  "väntar-pdf": "Väntar på ditt beslut",
  "vill-ga-vidare": "Du vill köpa",
  "avböjt": "Avvisat",
};

export const statusHint: Record<BuyerInterestStatus, string> = {
  "väntar-pdf": "Öppna underlaget och ta ställning.",
  "vill-ga-vidare": "TreLink kontaktar dig när nästa steg är klart.",
  "avböjt": "Du avvisade det här objektet.",
};

export const STORAGE_KEY = "kopare-intressen";

/** Utan userId returneras hela listan (t.ex. för TreLink admin, som ska se
 * alla köpares intresseanmälningar). Med userId filtreras listan till den
 * inloggade köparens egna anmälningar — se BuyerInterest.userId. */
export function readBuyerInterests(userId?: string): BuyerInterest[] {
  if (typeof window === "undefined") return [];
  try {
    const all: BuyerInterest[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return userId === undefined ? all : all.filter((i) => i.userId === userId);
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

export function logBuyerEntry(
  interest: BuyerInterest,
  vem: BuyerTimelineEntry["vem"],
  text: string,
): BuyerInterest {
  return {
    ...interest,
    timeline: [
      { ts: new Date().toISOString(), vem, text },
      ...(interest.timeline ?? []),
    ],
  };
}

/** Hittar en befintlig intresseanmälan för annonsen, eller skapar en ny.
 * Delas mellan annons.$id.index.tsx (inline "Interesserad"-flöde) och
 * annons.$id.intresse.tsx (äldre redirect-flöde) så att skapandelogiken
 * inte divergerar mellan de två ställena. */
export function findOrCreateInterest(
  annonsId: string,
  userId?: string,
): { interest: BuyerInterest; created: boolean } {
  const interests = readBuyerInterests();
  const existing = interests.find((i) => i.annonsId === annonsId && i.userId === userId);
  // En sparad favorit och ett aktivt intresse för samma annons är ömsesidigt
  // uteslutande — en intresseanmälan (ny eller redan befintlig) innebär att
  // objektet inte längre bara är "sparat", så favoriten tas bort här,
  // oavsett om anropet skapade ett nytt intresse eller hittade ett gammalt.
  if (userId !== undefined) removeFavorit(annonsId, userId);
  if (existing) return { interest: existing, created: false };
  const interest: BuyerInterest = {
    id: `bi-${Date.now()}`,
    annonsId,
    // Köpar-ID:t är knutet till kontot (se getOrCreateBuyerKod i mock-auth.ts),
    // inte slumpat per intresseanmälan, så samma köpare håller samma kod över
    // flera annonser. userId saknas bara i det (i praktiken ouppnåeliga)
    // fallet att den här anropas utan inloggad session — se anropsställena i
    // annons.$id.index.tsx/annons.$id.intresse.tsx, som redan spärrar på
    // isAuthed innan de kallar hit.
    kKod: userId ? getOrCreateBuyerKod(userId) : `K-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "väntar-pdf",
    skapadAt: new Date().toISOString(),
    timeline: [{ ts: new Date().toISOString(), vem: "Köpare", text: "Skickade intresseanmälan" }],
    userId,
  };
  writeBuyerInterests([...interests, interest]);
  return { interest, created: true };
}

/** Köparens beslut om ett objekt (köp eller avböj) — delas mellan
 * annons.$id.index.tsx och annons.$id.underlag.tsx, som tidigare höll varsin
 * kopia av exakt samma logik synkad bara via en kommentar. Patchar intresset
 * med beslutet, loggar det i tidslinjen, och vid "vill-ga-vidare": tar bort
 * en ev. sparad favorit för samma annons (se findOrCreateInterest ovan för
 * samma invariant) och notifierar TreLink admin. */
export function besluta(
  interestId: string,
  status: "vill-ga-vidare" | "avböjt",
): BuyerInterest | undefined {
  const beslutText = status === "vill-ga-vidare" ? "Vill köpa objektet" : "Avvisade objektet";
  patchBuyerInterest(interestId, (item) =>
    logBuyerEntry({ ...item, status, beslutAt: new Date().toISOString() }, "Köpare", beslutText),
  );
  const interest = getBuyerInterest(interestId);
  if (status === "vill-ga-vidare" && interest) {
    if (interest.userId !== undefined) removeFavorit(interest.annonsId, interest.userId);
    const annonsTitel =
      getAnnons(interest.annonsId)?.titel || `Annons ${formatArendeRef(interest.annonsId)}`;
    addNotis(
      "kopare",
      `${interest.kKod} vill köpa "${annonsTitel}" — redo för matchning`,
      "/admin/kopare",
    );
  }
  return interest;
}
