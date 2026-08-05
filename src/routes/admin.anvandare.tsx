import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PageHeader, Annotation, WireTag } from "@/components/wire";
import { readAdminAccounts, ADMIN_ACCOUNTS_STORAGE_KEY, type AdminAccountEvent } from "@/lib/mock-auth";

export const Route = createFileRoute("/admin/anvandare")({
  component: AdminAnvandare,
});

function formatTid(ts: number) {
  return new Date(ts).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

function AdminAnvandare() {
  const [accounts, setAccounts] = useState<AdminAccountEvent[]>(() => readAdminAccounts());
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== ADMIN_ACCOUNTS_STORAGE_KEY) return;
      const next = readAdminAccounts();
      setAccounts(next);
      const newest = next[0];
      if (newest) {
        setJustUpdatedId(newest.id);
        window.setTimeout(() => {
          setJustUpdatedId((id) => (id === newest.id ? null : id));
        }, 2500);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="TreLink Admin"
        title="Användare"
        subtitle="Konton skapade via BankID-inloggning och onboarding."
      />

      {accounts.length === 0 ? (
        <Annotation>Inga registrerade konton än</Annotation>
      ) : (
        <div className="overflow-x-auto border border-foreground/30 bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/30 bg-muted/30">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Namn
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Roll
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Bolag
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Org.nr
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Registrerad
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-muted-foreground/30">
              {accounts.map((a) => (
                <tr
                  key={a.id}
                  className={`transition-colors duration-500 ${justUpdatedId === a.id ? "bg-foreground/10" : ""}`}
                >
                  <td className="px-3 py-2">
                    {a.bankid.fornamn} {a.bankid.efternamn}
                  </td>
                  <td className="px-3 py-2">
                    <WireTag>{a.role === "saljare" ? "Säljare" : "Köpare"}</WireTag>
                  </td>
                  <td className="px-3 py-2">{a.role === "saljare" ? a.profil.bolag ?? "—" : "—"}</td>
                  <td className="px-3 py-2">{a.role === "saljare" ? a.profil.orgnr ?? "—" : "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {formatTid(a.createdAt)}
                    {justUpdatedId === a.id && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        ● nytt
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
