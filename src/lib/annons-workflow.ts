// Simple workflow state machine + localStorage helpers for the
// seller/TreLink annons flow. Prototype only — data lives in the browser.

import type { CatId } from "@/lib/annons-model";

export type WorkflowState =
  | "granskas" // TreLink granskar underlaget
  | "komplettering" // TreLink har begärt info av säljaren
  | "avvisad" // TreLink har avvisat annonsen
  | "avtal-vantar-signering" // TreLink har skickat uppdragsavtal till säljaren
  | "hyresvard-notifiering" // Avtal signerat — TreLink ska meddela hyresvärden
  | "publicerad" // Annonsen är live
  | "opublicerad"; // Säljaren har tagit bort annonsen från trelink.se igen

export const stateLabel: Record<WorkflowState, string> = {
  "granskas": "Granskas av TreLink",
  "komplettering": "Väntar på din komplettering",
  "avvisad": "Avvisad",
  "avtal-vantar-signering": "Uppdragsavtal — väntar på signering",
  "hyresvard-notifiering": "TreLink kontaktar hyresvärden",
  "publicerad": "Publicerad",
  "opublicerad": "Avpublicerad",
};

/** Kort statusrad för säljaren. */
export const stateHint: Record<WorkflowState, string> = {
  "granskas":
    "Låst för redigering. TreLink återkommer inom 24h på vardagar.",
  "komplettering":
    "TreLink behöver mer information. När du lämnat den skickas annonsen tillbaka till granskning.",
  "avvisad": "Ärendet är stängt. Se motivering nedan.",
  "avtal-vantar-signering":
    "Uppdragsavtalet är skickat till din e-post. Du kan också signera direkt här — via Signicat + BankID.",
  "hyresvard-notifiering":
    "TreLink skickar ett informationsmail till hyresvärden om att en överlåtelseprocess påbörjats.",
  "publicerad": "Annonsen är live och synlig för köpare.",
  "opublicerad": "Annonsen är borttagen från trelink.se. Publicera igen när du vill.",
};

export type TimelineEntry = {
  ts: string; // ISO
  vem: "Säljare" | "TreLink" | "System";
  text: string;
};

export type AnnonsUtkast = {
  rubrik: string;
  beskrivning: string;
  pris: string;
  yta: string;
  sentAt: string;
};

export type WorkflowData = {
  state: WorkflowState;
  timeline: TimelineEntry[];
  komplettering?: { message: string; at: string };
  avvisadReason?: { orsak: string; note: string; at: string };
  avtalSentAt?: string;
  reminderSentAt?: string;
  avtalSignedAt?: string;
  hyresvardNotifieradAt?: string;
  utkast?: AnnonsUtkast;
  publiceradAt?: string;
};

export const STORAGE_KEY = "saljare-annonser";

export function initialWorkflow(now = new Date()): WorkflowData {
  return {
    state: "granskas",
    timeline: [
      {
        ts: now.toISOString(),
        vem: "Säljare",
        text: "Skickade in underlag för granskning",
      },
      {
        ts: now.toISOString(),
        vem: "System",
        text: "Ärendet är låst för redigering under granskning · SLA 24h",
      },
    ],
  };
}

export function logEntry(
  wf: WorkflowData,
  vem: TimelineEntry["vem"],
  text: string,
): WorkflowData {
  return {
    ...wf,
    timeline: [
      { ts: new Date().toISOString(), vem, text },
      ...wf.timeline,
    ],
  };
}

/** Säljaren får redigera vid komplettering eller avvisad — samt en publicerad
 * annons, men bara om ingen aktiv affär pågår för den (annars skulle en
 * redigering ändra villkoren under en köpare som redan gått vidare, eftersom
 * hela affärspipelinen läser annonsdata live). Anropare som redan vet att en
 * affär pågår skickar in det via harAktivAffar snarare än att den här filen
 * importerar affar-workflow.tsx (som redan importerar härifrån). */
export function canSellerEdit(state: WorkflowState, harAktivAffar = false) {
  return state === "komplettering" || state === "avvisad" || (state === "publicerad" && !harAktivAffar);
}

/** Läs & skriv annonslistan i localStorage. */
export function readAnnonser(): any[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function writeAnnonser(list: any[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
export function patchAnnons(id: string, patch: (item: any) => any) {
  const list = readAnnonser();
  const idx = list.findIndex((i: any) => i.id === id);
  if (idx < 0) return;
  list[idx] = patch(list[idx]);
  writeAnnonser(list);
}

export function getAnnons(id: string): any | undefined {
  return readAnnonser().find((i: any) => i.id === id);
}

/** Begär komplettering av en annons — samma logik som tidigare var inline i
 * admin.annonser.$id.tsx's submitKomplettering, nu delad så att både den
 * knappen och t.ex. en kategori-uppgradering (uppgraderaKategori nedan) kan
 * återanvända den istället för att duplicera patch-koden. */
export function begarKomplettering(annonsId: string, message: string) {
  patchAnnons(annonsId, (it) => ({
    ...it,
    workflow: logEntry(
      {
        ...it.workflow,
        state: "komplettering",
        komplettering: { message, at: new Date().toISOString() },
      },
      "TreLink",
      `Begärde komplettering: "${message.slice(0, 80)}${message.length > 80 ? "…" : ""}"`,
    ),
  }));
}

/** Uppgraderar en annons kategori (t.ex. Inkråm → Aktieöverlåtelse när
 * köparens bolagsval ändrar affärens karaktär under granskningen) — patchar
 * både cat och draft.cat så att prissättnings-/dokumentlogiken (docsByCat/
 * avgift i admin.annonser.$id.tsx) transparent följer den nya kategorin. */
export function uppgraderaKategori(annonsId: string, nyCat: CatId) {
  patchAnnons(annonsId, (it) => ({
    ...it,
    cat: nyCat,
    draft: { ...it.draft, cat: nyCat },
    workflow: logEntry(
      it.workflow,
      "TreLink",
      "TreLink uppgraderade annonsen till Aktieöverlåtelse — köparens bolag ändrades under processen",
    ),
  }));
}
