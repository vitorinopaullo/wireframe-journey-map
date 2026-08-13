// Simple workflow state machine + localStorage helpers for the
// seller/TreLink annons flow. Prototype only — data lives in the browser.

export type WorkflowState =
  | "granskas" // TreLink granskar underlaget
  | "komplettering" // TreLink har begärt info av säljaren
  | "avvisad" // TreLink har avvisat annonsen
  | "avtal-vantar-signering" // TreLink har skickat uppdragsavtal till säljaren
  | "hyresvard-notifiering" // Avtal signerat — TreLink ska meddela hyresvärden
  | "publicerad"; // Annonsen är live

export const stateLabel: Record<WorkflowState, string> = {
  "granskas": "Granskas av TreLink",
  "komplettering": "Väntar på din komplettering",
  "avvisad": "Avvisad",
  "avtal-vantar-signering": "Uppdragsavtal — väntar på signering",
  "hyresvard-notifiering": "TreLink kontaktar hyresvärden",
  "publicerad": "Publicerad",
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

/** Säljaren får redigera bara vid komplettering eller avvisad. */
export function canSellerEdit(state: WorkflowState) {
  return state === "komplettering" || state === "avvisad";
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
