// Prototyp/mock av BankID-baserad auth + TreLink admin-kö.
// Persistas i localStorage. Ingen riktig backend.

import { addNotis } from "@/lib/admin-notiser";

export type BankIdPayload = {
  personnr: string;
  fornamn: string;
  efternamn: string;
  verifieradAt: number;
};

export type Session = {
  userId: string;
  bankid: BankIdPayload;
  role?: "kopare" | "saljare";
  createdAt: number;
};

const SESSION_KEY = "trelink-session";
const ADMIN_QUEUE_KEY = "trelink-admin-nya-konton";
export const ADMIN_ACCOUNTS_STORAGE_KEY = ADMIN_QUEUE_KEY;

// Fast set av testpersoner — personnumret är stabilt per person så att samma
// testperson alltid matchar samma konto (se upsertAdminAccount).
export const BANKID_TESTPERSONER: BankIdPayload[] = [
  { personnr: "19850312-4455", fornamn: "Anna", efternamn: "Bergström", verifieradAt: 0 },
  { personnr: "19790914-1122", fornamn: "Erik", efternamn: "Lindqvist", verifieradAt: 0 },
  { personnr: "19920128-7788", fornamn: "Sara", efternamn: "Andersson", verifieradAt: 0 },
];

export function mockBankIdVerify(testperson: BankIdPayload): BankIdPayload {
  return { ...testperson, verifieradAt: Date.now() };
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
export function subscribeSession(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else window.sessionStorage.removeItem(SESSION_KEY);
  emit();
}

export function signInWithBankId(bankid: BankIdPayload): Session {
  const existing = getSession();
  const s: Session =
    existing && existing.bankid.personnr === bankid.personnr
      ? { ...existing, bankid }
      : {
          userId: `u_${bankid.personnr.replace(/\D/g, "")}`,
          bankid,
          createdAt: Date.now(),
        };
  setSession(s);
  upsertAdminAccount(s.userId, { bankid: s.bankid });
  return s;
}

export function signOut() {
  setSession(null);
}

export function updateSession(patch: Partial<Session>) {
  const s = getSession();
  if (!s) return;
  setSession({ ...s, ...patch });
}

/* ---------- Admin-kö: konton skapas vid BankID-inloggning, fylls på successivt ---------- */
export type AdminAccountEvent = {
  id: string;
  userId: string;
  bankid: BankIdPayload;
  createdAt: number; // tidpunkt för BankID-inloggning
  updatedAt: number;
  role?: "kopare" | "saljare";
  profil?: Record<string, string>;
};

/** Skapar kontot vid första inloggning, uppdaterar samma post vid roll-val och onboarding-slut. */
export function upsertAdminAccount(
  userId: string,
  patch: { bankid?: BankIdPayload; role?: "kopare" | "saljare"; profil?: Record<string, string> },
) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(ADMIN_QUEUE_KEY);
  const list: AdminAccountEvent[] = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const idx = list.findIndex((a) => a.userId === userId);
  if (idx >= 0) {
    const roleChanged = !!patch.role && list[idx].role !== patch.role;
    list[idx] = { ...list[idx], ...patch, updatedAt: now };
    if (roleChanged) {
      const { fornamn, efternamn } = list[idx].bankid;
      addNotis(
        "anvandare",
        `${fornamn} ${efternamn} valde roll: ${patch.role === "saljare" ? "Säljare/Överlåtare" : "Köpare"}`,
        `/admin/anvandare/${list[idx].id}`,
      );
    }
  } else if (patch.bankid) {
    const id = `acc_${now}`;
    list.unshift({
      id,
      userId,
      bankid: patch.bankid,
      createdAt: now,
      updatedAt: now,
      role: patch.role,
      profil: patch.profil,
    });
    addNotis(
      "anvandare",
      `Nytt konto: ${patch.bankid.fornamn} ${patch.bankid.efternamn}`,
      `/admin/anvandare/${id}`,
    );
  }
  window.localStorage.setItem(ADMIN_QUEUE_KEY, JSON.stringify(list));
}

export function readAdminAccounts(): AdminAccountEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ADMIN_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAccountByUserId(userId: string | undefined): AdminAccountEvent | undefined {
  if (!userId) return undefined;
  return readAdminAccounts().find((a) => a.userId === userId);
}
