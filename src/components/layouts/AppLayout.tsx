import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { readBuyerInterests, STORAGE_KEY as KOPARE_STORAGE_KEY } from "@/lib/kopare-workflow";

type Mode = "kopare" | "saljare";

const buyerNav = [
  { to: "/dashboard", label: "Översikt" },
  { to: "/kopare/favoriter", label: "Sparade objekt" },
  { to: "/kopare/bevakningar", label: "Bevakningar" },
  { to: "/kopare/affarer", label: "Mina affärer" },
  { to: "/kopare/profil", label: "Profil & fakturor" },
];

const sellerNav = [
  { to: "/dashboard", label: "Översikt" },
  { to: "/saljare/skapa-annons", label: "Skapa annons" },
  { to: "/saljare/mina-annonser", label: "Mina annonser" },
  { to: "/saljare/intressenter", label: "Intressenter" },
  { to: "/saljare/affarer", label: "Mina affärer" },
];

function useObehandladeIntressenCount() {
  const [count, setCount] = useState(
    () => readBuyerInterests().filter((i) => i.status === "väntar-pdf").length,
  );

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== null && e.key !== KOPARE_STORAGE_KEY) return;
      setCount(readBuyerInterests().filter((i) => i.status === "väntar-pdf").length);
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return count;
}

export function AppLayout({ mode, children }: { mode: Mode; children?: ReactNode }) {
  const nav = mode === "kopare" ? buyerNav : sellerNav;
  const otherMode: Mode = mode === "kopare" ? "saljare" : "kopare";
  const location = useLocation();
  const obehandladeIntressen = useObehandladeIntressenCount();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" search={{ mode }} className="font-mono text-lg font-semibold">
            TRELINK <span className="text-muted-foreground text-xs">/{mode}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Läge
            </span>
            <div className="flex rounded-pill border border-foreground/15 p-0.5">
              <Link
                to="/dashboard"
                search={{ mode: "kopare" }}
                className={`rounded-pill px-3 py-1 text-xs transition-colors duration-150 ${mode === "kopare" ? "bg-[var(--color-primary)] text-[var(--color-white)]" : "text-foreground"}`}
              >
                Köpare
              </Link>
              <Link
                to="/dashboard"
                search={{ mode: "saljare" }}
                className={`rounded-pill px-3 py-1 text-xs transition-colors duration-150 ${mode === "saljare" ? "bg-[var(--color-primary)] text-[var(--color-white)]" : "text-foreground"}`}
              >
                Säljare
              </Link>
            </div>
            <Link to="/logga-in" className="text-xs text-muted-foreground hover:text-foreground">
              Logga ut
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="w-56 shrink-0 border-r border-dashed border-muted-foreground/40 pr-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {mode === "kopare" ? "Köparmeny" : "Säljarmeny"}
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  search={n.to === "/dashboard" ? { mode } : undefined}
                  className={`border-l-2 px-3 py-2 text-sm transition-colors duration-150 ${
                    active
                      ? "border-[var(--color-primary)] bg-muted/40 font-medium text-[var(--color-interactive)]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                  {n.label === "Intressenter" && obehandladeIntressen > 0 && (
                    <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-mono text-[10px] text-destructive-foreground">
                      {obehandladeIntressen}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 border border-dashed border-muted-foreground/40 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Tips
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Ett konto, två lägen. Växla till{" "}
              <Link
                to="/dashboard"
                search={{ mode: otherMode }}
                className="underline"
              >
                {otherMode}-läge
              </Link>{" "}
              utan ny inloggning.
            </p>
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}

