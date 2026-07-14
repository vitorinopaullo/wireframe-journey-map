import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

const nav = [
  { to: "/george", label: "Att-göra idag", hint: "⌘1" },
  { to: "/george/annonser", label: "Granska annonser", hint: "⌘2", badge: 4 },
  { to: "/george/affarer", label: "Driv affärer", hint: "⌘3", badge: 5 },
  { to: "/george/hyresvard", label: "Hyresvärd", hint: "⌘4", badge: 1 },
  { to: "/george/fakturor", label: "Fakturor & medel", hint: "⌘5", badge: 2 },
  { to: "/george/anvandare", label: "Användare & statistik", hint: "⌘6" },
];

export function TreLinkLayout({ children }: { children?: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === "Escape") setCmdOpen(false);
      // Number shortcuts
      if ((e.metaKey || e.ctrlKey) && /^[1-6]$/.test(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        const target = nav[idx];
        if (target) navigate({ to: target.to });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-foreground/[0.02] text-foreground">
      {/* Kommandobar */}
      <header className="sticky top-0 z-30 border-b border-foreground/30 bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/george" className="font-mono text-lg font-semibold whitespace-nowrap">
            ▢ TRELINK <span className="text-muted-foreground text-xs">/george</span>
          </Link>

          <button
            onClick={() => setCmdOpen(true)}
            className="flex flex-1 max-w-md items-center justify-between border border-dashed border-muted-foreground/50 bg-muted/20 px-3 py-2 text-left font-mono text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            <span>🔍 Sök affär · annons · användare · faktura</span>
            <span className="border border-muted-foreground/40 px-1 py-0.5 text-[10px]">⌘K</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden border border-foreground bg-foreground text-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider md:inline-block">
              ⚠ 2 SLA-brott
            </span>
            <button className="relative border border-foreground/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider hover:border-foreground">
              🔔 Notiser
              <span className="absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-[16px] items-center justify-center border border-foreground bg-foreground text-background px-1 font-mono text-[9px]">
                3
              </span>
            </button>
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
              const active = loc.pathname === n.to || (n.to !== "/george" && loc.pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center justify-between border-l-2 px-3 py-2 text-sm ${
                    active
                      ? "border-foreground bg-muted/40 font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {n.label}
                    {n.badge ? (
                      <span className="border border-foreground/60 px-1.5 py-0 font-mono text-[10px]">{n.badge}</span>
                    ) : null}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">{n.hint}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 border border-dashed border-muted-foreground/40 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Vy</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Allt TreLink gör loggas och syns för köpare & säljare.
            </p>
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children ?? <Outlet />}</main>
      </div>

      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4 pt-[10vh]"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-xl border border-foreground bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-foreground/30 px-4 py-3">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Sök affär (#A-2041), annons (#9), användare (S-104, K-208), faktura (F-1041)…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {[
                { type: "Affär", label: "#A-2041 · Restauranglokal Södermalm", to: "/george/affarer" },
                { type: "Annons", label: "#9 · Frisörsalong Vasastan", to: "/george/annonser/9" },
                { type: "Användare", label: "S-104 · Anna Lindberg", to: "/george/anvandare" },
                { type: "Faktura", label: "F-1041 · Handpenning 195 000", to: "/george/fakturor" },
              ]
                .filter((r) => !q || r.label.toLowerCase().includes(q.toLowerCase()))
                .map((r) => (
                  <Link
                    key={r.label}
                    to={r.to}
                    onClick={() => setCmdOpen(false)}
                    className="flex items-center gap-3 border-b border-dashed border-muted-foreground/30 px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <span className="w-20 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.type}</span>
                    <span>{r.label}</span>
                  </Link>
                ))}
            </div>
            <div className="flex items-center justify-between border-t border-foreground/30 px-4 py-2 font-mono text-[10px] text-muted-foreground">
              <span>↵ öppna · ESC stäng</span>
              <span>⌘1-6 hoppa till sektion</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
