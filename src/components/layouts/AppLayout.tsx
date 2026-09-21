import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { unreadCountByKategori, STORAGE_KEY as NOTISER_STORAGE_KEY, type AdminNotisKategori } from "@/lib/admin-notiser";
import { AccountMenu } from "@/components/AccountMenu";

type Mode = "kopare" | "saljare";

const buyerNav = [
  { to: "/dashboard", label: "Översikt" },
  { to: "/kopare/favoriter", label: "Sparade objekt" },
  { to: "/kopare/affarer", label: "Mina affärer" },
  { to: "/kopare/profil", label: "Profil & fakturor" },
];

const sellerNav = [
  { to: "/dashboard", label: "Översikt" },
  { to: "/saljare/skapa-annons", label: "Skapa annons" },
  { to: "/saljare/mina-annonser", label: "Mina annonser" },
  { to: "/saljare/intressenter", label: "Intressenter" },
  { to: "/saljare/affarer", label: "Mina affärer" },
  { to: "/saljare/profil", label: "Profil" },
];

function useNotisCount(kategori: AdminNotisKategori) {
  const [n, setN] = useState(() => unreadCountByKategori(kategori));

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== null && e.key !== NOTISER_STORAGE_KEY) return;
      setN(unreadCountByKategori(kategori));
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [kategori]);

  return n;
}

export function AppLayout({ mode, children }: { mode: Mode; children?: ReactNode }) {
  const nav = mode === "kopare" ? buyerNav : sellerNav;
  const location = useLocation();
  const obehandladeIntressen = useNotisCount("saljare-intresse");
  const obehandladeAffarer = useNotisCount("saljare-affar");
  const obehandladeKopareAffarer = useNotisCount("kopare-affar");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" search={{ mode }} className="flex items-center gap-2">
            <img src="/trelink-logo.svg" alt="TreLink" className="h-6 w-auto" />
            <span className="font-mono text-muted-foreground text-xs">/{mode}</span>
          </Link>
          <AccountMenu role={mode} />
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="w-56 shrink-0 self-start sticky top-8 border-r border-foreground/10 pr-6">
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
                  {mode === "saljare" && n.label === "Mina affärer" && obehandladeAffarer > 0 && (
                    <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-mono text-[10px] text-destructive-foreground">
                      {obehandladeAffarer}
                    </span>
                  )}
                  {mode === "kopare" &&
                    n.label === "Mina affärer" &&
                    obehandladeKopareAffarer > 0 && (
                      <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-mono text-[10px] text-destructive-foreground">
                        {obehandladeKopareAffarer}
                      </span>
                    )}
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

