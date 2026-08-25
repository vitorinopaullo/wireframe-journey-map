import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { PageHeader, Annotation, WireTag } from "@/components/wire";
import { readAdminAccounts, ADMIN_ACCOUNTS_STORAGE_KEY, type AdminAccountEvent } from "@/lib/mock-auth";
import { markKategoriRead } from "@/lib/admin-notiser";

export const Route = createFileRoute("/admin/anvandare/")({
  component: AdminAnvandare,
});

function formatTid(ts: number) {
  return new Date(ts).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

type AccountStatus = "inloggad" | "roll-vald" | "komplett";

function accountStatus(a: AdminAccountEvent): AccountStatus {
  if (!a.role) return "inloggad";
  if (!a.profil) return "roll-vald";
  if (a.role === "saljare" && !(a.profil.bolag?.trim() && a.profil.orgnr?.trim())) return "roll-vald";
  return "komplett";
}

const STATUS_LABEL: Record<AccountStatus, string> = {
  inloggad: "Inloggad",
  "roll-vald": "Roll vald",
  komplett: "Komplett",
};

function StatusTag({ status }: { status: AccountStatus }) {
  const cls =
    status === "komplett"
      ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
      : status === "roll-vald"
      ? "border-amber-500/70 text-amber-700 bg-amber-50/60 dark:text-amber-500 dark:bg-amber-500/10"
      : "border-foreground/20 text-muted-foreground";
  return (
    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

type RollFilter = "alla" | "kopare" | "saljare";
type StatusFilter = "alla" | AccountStatus;

const ROLL_FILTER_LABEL: Record<RollFilter, string> = {
  alla: "Alla",
  kopare: "Köpare",
  saljare: "Säljare/Överlåtare",
};

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  alla: "Alla",
  ...STATUS_LABEL,
};

function AdminAnvandare() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AdminAccountEvent[]>(() => readAdminAccounts());
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);
  const [rollFilter, setRollFilter] = useState<RollFilter>("alla");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("alla");

  useEffect(() => {
    markKategoriRead("anvandare");
  }, []);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== ADMIN_ACCOUNTS_STORAGE_KEY) return;
      const next = readAdminAccounts();
      setAccounts(next);
      const mostRecent = next.reduce<AdminAccountEvent | null>(
        (latest, a) => (!latest || a.updatedAt > latest.updatedAt ? a : latest),
        null,
      );
      if (mostRecent) {
        setJustUpdatedId(mostRecent.id);
        window.setTimeout(() => {
          setJustUpdatedId((id) => (id === mostRecent.id ? null : id));
        }, 2500);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const filteredAccounts = accounts.filter((a) => {
    if (rollFilter !== "alla" && a.role !== rollFilter) return false;
    if (statusFilter !== "alla" && accountStatus(a) !== statusFilter) return false;
    return true;
  });

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="TreLink Admin"
        title="Användare"
        subtitle="Konton skapade via BankID-inloggning, fylls på i takt med onboardingen."
      />

      {accounts.length === 0 ? (
        <Annotation>Inga registrerade konton än</Annotation>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Roll</div>
                <div className="flex gap-1.5">
                  {(Object.keys(ROLL_FILTER_LABEL) as RollFilter[]).map((r) => (
                    <WireTag key={r} active={rollFilter === r} onClick={() => setRollFilter(r)}>
                      {ROLL_FILTER_LABEL[r]}
                    </WireTag>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
                <div className="flex gap-1.5">
                  {(Object.keys(STATUS_FILTER_LABEL) as StatusFilter[]).map((s) => (
                    <WireTag key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                      {STATUS_FILTER_LABEL[s]}
                    </WireTag>
                  ))}
                </div>
              </div>
            </div>
            <Annotation>
              {filteredAccounts.length} av {accounts.length} användare
            </Annotation>
          </div>

          {filteredAccounts.length === 0 ? (
            <Annotation>Inga användare matchar filtren</Annotation>
          ) : (
            <div className="overflow-x-auto border border-foreground/30 bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="sticky top-0 border-b border-foreground/30 bg-muted/30">
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                      Namn
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                      Roll
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                      Bolag
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                      Org.nr
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                      Registrerad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {filteredAccounts.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => navigate({ to: "/admin/anvandare/$id", params: { id: a.id } })}
                      className={`cursor-pointer transition-colors duration-500 hover:bg-muted/40 ${
                        justUpdatedId === a.id ? "bg-[var(--color-primary)]/10" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        {a.bankid.fornamn} {a.bankid.efternamn}
                      </td>
                      <td className="px-3 py-2">
                        <WireTag>{a.role === "saljare" ? "Säljare/Överlåtare" : a.role === "kopare" ? "Köpare" : "—"}</WireTag>
                      </td>
                      <td className="px-3 py-2">{a.role === "saljare" ? a.profil?.bolag ?? "—" : "—"}</td>
                      <td className="px-3 py-2">{a.role === "saljare" ? a.profil?.orgnr ?? "—" : "—"}</td>
                      <td className="px-3 py-2">
                        <StatusTag status={accountStatus(a)} />
                      </td>
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
        </>
      )}
    </AdminLayout>
  );
}
