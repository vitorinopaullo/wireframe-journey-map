import { Link, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Sök annonser" },
  { to: "/hur-det-funkar", label: "Hur det funkar" },
  { to: "/tillaggstjanster", label: "Tilläggstjänster" },
  { to: "/oversikt", label: "Sitemap" },
];

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-mono text-lg font-semibold tracking-tight">
            ▢ TRELINK <span className="text-muted-foreground text-xs">/wireframe</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2">
            <Link to="/logga-in" className="border border-foreground/40 px-3 py-1.5 text-sm">
              Logga in
            </Link>
            <Link
              to="/registrera"
              className="border border-foreground bg-foreground px-3 py-1.5 text-sm text-background"
            >
              Registrera (BankID)
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children ?? <Outlet />}</main>
      <footer className="border-t border-foreground/20 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 text-xs text-muted-foreground md:flex-row">
          <span>CC Projects × Trelink — wireframe v0.1</span>
          <span className="font-mono">Publik yta · SSR · SEO</span>
        </div>
      </footer>
    </div>
  );
}
