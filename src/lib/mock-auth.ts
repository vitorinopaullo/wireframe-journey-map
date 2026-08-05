// Prototyp/mock av BankID-baserad auth + TreLink admin-kö.
// Persistas i localStorage. Ingen riktig backend.

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

const FIXTURES: BankIdPayload[] = [
  { personnr: "19850312-4455", fornamn: "Anna", efternamn: "Bergström", verifieradAt: 0 },
  { personnr: "19790914-1122", fornamn: "Erik", efternamn: "Lindqvist", verifieradAt: 0 },
  { personnr: "19920128-7788", fornamn: "Sara", efternamn: "Andersson", verifieradAt: 0 },
];

export function mockBankIdSample(): BankIdPayload {
  const pick = FIXTURES[Math.floor(Math.random() * FIXTURES.length)];
  return { ...pick, verifieradAt: Date.now() };
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
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
  if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else window.localStorage.removeItem(SESSION_KEY);
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

/* ---------- Admin-kö: nya konton skickas hit ---------- */
export type AdminAccountEvent = {
  id: string;
  createdAt: number;
  userId: string;
  role: "kopare" | "saljare";
  bankid: BankIdPayload;
  profil: Record<string, string>;
};

export function pushAdminAccount(ev: Omit<AdminAccountEvent, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(ADMIN_QUEUE_KEY);
  const list: AdminAccountEvent[] = raw ? JSON.parse(raw) : [];
  list.unshift({
    ...ev,
    id: `acc_${Date.now()}`,
    createdAt: Date.now(),
  });
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
