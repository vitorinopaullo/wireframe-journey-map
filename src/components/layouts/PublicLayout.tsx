import { Link, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Sök annonser" },
  { to: "/hur-det-funkar", label: "Hur det funkar" },
  { to: "/tillaggstjanster", label: "Tilläggstjänster" },
  { to: "/oversikt", label: "Sitemap" },
];

const footerCols: { title: string; links: { to: string; label: string }[]; blurb?: string }[] = [
  {
    title: "Trelink",
    blurb: "Sveriges marknadsplats för verksamhetsöverlåtelser. Fast avgift, ingen provision.",
    links: [
      { to: "/om-oss", label: "Om oss" },
      { to: "/kontakt", label: "Kontakta oss" },
    ],
  },
  {
    title: "För säljare",
    links: [
      { to: "/saljare/skapa-annons", label: "Skapa annons" },
      { to: "/hur-det-funkar", label: "Hur det funkar" },
      { to: "/tillaggstjanster", label: "Tilläggstjänster" },
    ],
  },
  {
    title: "För köpare",
    links: [
      { to: "/", label: "Sök annonser" },
      { to: "/hur-det-funkar", label: "Hur det funkar" },
    ],
  },
  {
    title: "Support & villkor",
    links: [
      { to: "/faq", label: "FAQ" },
      { to: "/villkor", label: "Användarvillkor" },
      { to: "/integritetspolicy", label: "Integritetspolicy" },
      { to: "/cookies", label: "Cookies" },
    ],
  },
];

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/trelink-logo.svg" alt="TreLink" className="h-6 w-auto" />
            <span className="font-mono text-xs text-muted-foreground">/wireframe</span>
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
      <footer className="border-t border-foreground/20">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 border-b border-dashed border-muted-foreground/40 pb-10 md:grid-cols-4">
            {footerCols.map((col, i) => (
              <div key={col.title}>
                {i === 0 ? (
                  <img src="/trelink-logo.svg" alt="TreLink" className="mb-3 h-5 w-auto" />
                ) : (
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {col.title}
                  </div>
                )}
                {col.blurb && (
                  <p className="mb-4 text-sm text-muted-foreground">{col.blurb}</p>
                )}
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.to + l.label}>
                      <Link to={l.to} className="text-sm hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground md:flex-row">
            <span>CC Projects × Trelink — wireframe v0.1</span>
            <span className="font-mono">Publik yta</span>
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground md:text-left">
            © 2026 Trelink AB · Org.nr XXXXXX-XXXX
          </div>
        </div>
      </footer>
    </div>
  );
}
