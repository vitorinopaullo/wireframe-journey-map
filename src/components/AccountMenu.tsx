import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getSession, subscribeSession, signOut, type Session } from "@/lib/mock-auth";

/**
 * Shared account trigger + dropdown, used by both PublicLayout and
 * AppLayout so profile access and role-switching live in one place
 * instead of two hand-rolled header blocks. `role` is the *currently
 * active* role for the header the caller is in — PublicLayout passes
 * session.role (set once at onboarding), AppLayout passes its `mode`
 * prop (the section of the app currently being viewed) — the two
 * layouts already carry this concept differently, so it comes in as a
 * prop rather than this component re-deriving it. Same dropdown pattern
 * (relative + absolute panel + click-outside-to-close) as the filter
 * Dropdown in SearchFilters.tsx.
 */
export function AccountMenu({ role }: { role: "kopare" | "saljare" }) {
  const [session, setSessionState] = useState<Session | null>(() => getSession());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => subscribeSession(() => setSessionState(getSession())), []);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!session) return null;

  const { fornamn, efternamn } = session.bankid;
  const initials = `${fornamn[0] ?? ""}${efternamn[0] ?? ""}`.toUpperCase();
  const otherRole = role === "kopare" ? "saljare" : "kopare";
  const profilTo = role === "kopare" ? "/kopare/profil" : "/saljare/profil";

  function handleLogout() {
    setOpen(false);
    signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-medium text-[var(--color-white)] transition-colors duration-150 hover:bg-primary-hover"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-card border border-foreground/15 bg-card shadow-lg">
          <div className="truncate border-b border-foreground/10 px-3 py-2 text-xs text-muted-foreground">
            {fornamn} {efternamn}
          </div>
          <Link
            to={profilTo}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-left text-sm transition hover:bg-muted"
          >
            Profil
          </Link>
          <Link
            to="/dashboard"
            search={{ mode: otherRole }}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-left text-sm transition hover:bg-muted"
          >
            Byt till {otherRole === "kopare" ? "Köpare" : "Säljare"}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="block w-full px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Logga ut
          </button>
        </div>
      )}
    </div>
  );
}
