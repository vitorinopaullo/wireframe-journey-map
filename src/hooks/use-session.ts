import { useEffect, useState } from "react";
import { getSession, subscribeSession, type Session } from "@/lib/mock-auth";

/**
 * BankID-mock session. undefined = laddar (SSR), null = utloggad.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    setSession(getSession());
    const unsub = subscribeSession(() => setSession(getSession()));
    const onStorage = () => setSession(getSession());
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return session;
}

export function useIsAuthed() {
  const s = useSession();
  if (s === undefined) return undefined;
  return !!s;
}
