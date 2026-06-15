import { Link, Outlet, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/george", label: "Att-göra idag" },
  { to: "/george/annonser", label: "Granska annonser" },
  { to: "/george/affarer", label: "Driv affärer" },
  { to: "/george/hyresvard", label: "Hyresvärd (lokal)" },
  { to: "/george/fakturor", label: "Fakturor & medel" },
  { to: "/george/anvandare", label: "Användare & statistik" },
];

export function GeorgeLayout({ children }: { children?: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-foreground/[0.02] text-foreground">
      <header className="border-b border-foreground/30 bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/george" className="font-mono text-lg font-semibold">
            ▢ TRELINK <span className="text-muted-foreground text-xs">/george · adminzon</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="border border-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
              Mäklarnav · separata rättigheter
            </span>
            <Link to="/logga-in" className="text-xs text-muted-foreground hover:text-foreground">
              Logga ut
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="w-60 shrink-0 border-r border-dashed border-muted-foreground/40 pr-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Kontrollrum
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((n) => {
              const active = loc.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
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
        </aside>
        <main className="flex-1 min-w-0">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
