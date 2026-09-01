import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { WireTag } from "@/components/wire";
import { readAnnonser, STORAGE_KEY, type WorkflowState } from "@/lib/annons-workflow";
import { unreadCountByKategori, STORAGE_KEY as NOTISER_STORAGE_KEY, type AdminNotisKategori } from "@/lib/admin-notiser";

const adminNav = [
  { to: "/admin", label: "Översikt" },
  { to: "/admin/annonser", label: "Granskning" },
  { to: "/admin/kopare", label: "Köpare/Intressenter" },
  { to: "/admin/affarer", label: "Affärer/Uppdrag" },
  { to: "/admin/anvandare", label: "Användare" },
  { to: "/admin/installningar", label: "Inställningar" },
];

// "Bollen ligger hos TreLink" — samma states som NEXT_ACTOR i
// admin.index.tsx / admin.annonser.index.tsx (duplicerad, ej exporterad där).
const TRELINK_ACTION_STATES: WorkflowState[] = [
  "granskas",
  "komplettering",
  "hyresvard-notifiering",
];

function useGranskningCount() {
  const count = () => readAnnonser().filter((a) => TRELINK_ACTION_STATES.includes(a.workflow?.state)).length;
  const [n, setN] = useState(count);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== null && e.key !== STORAGE_KEY) return;
      setN(count());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return n;
}

// Generisk badge-räknare för notissystemet i admin-notiser.ts — Köpare/Affärer
// kan koppla in fler kategorier här senare utan omskrivning.
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

export function AdminLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const granskningCount = useGranskningCount();
  const anvandareNotisCount = useNotisCount("anvandare");
  const affarerNotisCount = useNotisCount("affarer");
  const kopareNotisCount = useNotisCount("kopare");
  const navCounts: Record<string, number> = {
    "/admin/annonser": granskningCount,
    "/admin/anvandare": anvandareNotisCount,
    "/admin/affarer": affarerNotisCount,
    "/admin/kopare": kopareNotisCount,
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/20 bg-foreground text-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/admin" className="flex items-center gap-2">
            <img src="/trelink-logo.svg" alt="TreLink" className="h-6 w-auto brightness-0 invert" />
            <span className="font-mono text-background/60 text-xs">Admin</span>
          </Link>
          <Link to="/logga-in" className="text-xs text-background/70 hover:text-background">
            Logga ut
          </Link>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="w-56 shrink-0 border-r border-dashed border-muted-foreground/40 pr-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Adminmeny
          </div>
          <nav className="flex flex-col gap-1">
            {adminNav.map((n) => {
              const active = location.pathname === n.to;
              const count = navCounts[n.to] ?? 0;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center justify-between gap-2 border-l-2 px-3 py-2 text-sm transition-colors duration-150 ${
                    active
                      ? "border-[var(--color-primary)] bg-muted/40 font-medium text-[var(--color-interactive)]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                  {count > 0 && <WireTag active>{count}</WireTag>}
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

export function AdminComingSoon() {
  return (
    <div className="border border-dashed border-muted-foreground/40 p-8 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
      Kommer snart
    </div>
  );
}
