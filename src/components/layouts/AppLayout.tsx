import { Link, Outlet, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

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

export function AppLayout({ mode, children }: { mode: Mode; children?: ReactNode }) {
  const nav = mode === "kopare" ? buyerNav : sellerNav;
  const otherMode: Mode = mode === "kopare" ? "saljare" : "kopare";
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" search={{ mode }} className="font-mono text-lg font-semibold">
            ▢ TRELINK <span className="text-muted-foreground text-xs">/{mode}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Läge
            </span>
            <div className="flex border border-foreground/40">
              <Link
                to="/dashboard"
                search={{ mode: "kopare" }}
                className={`px-3 py-1 text-xs ${mode === "kopare" ? "bg-foreground text-background" : "text-foreground"}`}
              >
                Köpare
              </Link>
              <Link
                to="/dashboard"
                search={{ mode: "saljare" }}
                className={`px-3 py-1 text-xs ${mode === "saljare" ? "bg-foreground text-background" : "text-foreground"}`}
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
                  className={`border-l-2 px-3 py-2 text-sm ${
                    active
                      ? "border-foreground bg-muted/40 font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
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

