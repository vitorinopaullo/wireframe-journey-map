import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  daysLive: number;
  objectLabel?: string;
}

export function ContractExpiryBanner({ daysLive, objectLabel = "Inkråm · Café · Stockholm" }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  if (daysLive < 75) return null;

  const daysLeft = Math.max(0, 90 - daysLive);
  const isUrgent = daysLive >= 88;
  const isStrong = daysLive >= 80;

  const borderClass = isStrong ? "border-[var(--color-primary)]" : "border-muted-foreground/50";
  const borderStyle = { borderWidth: "1.5px", borderRadius: "3px" };

  return (
    <div
      className={`relative mb-6 flex gap-3 bg-white p-4 ${borderClass}`}
      style={{ ...borderStyle, borderStyle: "solid" }}
    >
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-bold text-[var(--color-primary)]">
            Uppdragsavtalet löper ut om {daysLeft} dagar
          </h3>
          {isUrgent && (
            <span className="border border-[var(--color-primary)] bg-[var(--color-primary)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white">
              Brådskande
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Ditt objekt "{objectLabel}" har varit annonserat i {daysLive} dagar.
          Uppdragsavtalet gäller i 3 månader. Om ingen affär är klar behöver ni
          förnya avtalet eller så avslutar Trelink uppdraget.
        </p>
        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={() => toast("Ett meddelande har skickats till Trelink")}
            className="bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Kontakta Trelink
          </button>
          <button
            onClick={() => toast("Dokumentation kommer snart")}
            className="text-xs text-[var(--color-interactive)] underline underline-offset-2 hover:opacity-70"
          >
            Läs mer om avtalstiden
          </button>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Stäng"
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ContractExpiryCountdown({ daysLive, signedAt }: { daysLive: number; signedAt?: string }) {
  const total = 90;
  const used = Math.min(daysLive, total);
  const pct = Math.min(100, (used / total) * 100);
  const daysLeft = Math.max(0, total - used);
  const warn = daysLeft < 15;

  const expiry = new Date();
  const base = signedAt ? new Date(signedAt) : new Date();
  expiry.setTime(base.getTime() + (total - daysLive) * 24 * 60 * 60 * 1000);
  const expiryStr = expiry.toLocaleDateString("sv-SE");

  return (
    <div className="mt-4 border border-foreground/20 p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Avtalstid
      </div>
      <div className="h-1 w-full bg-muted">
        <div className="h-1 bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {used} av {total} dagar använda · Löper ut {expiryStr}
      </div>
      {warn && (
        <div className="mt-2 text-xs font-bold text-[var(--color-primary)]">
          Kontakta Trelink för förlängning
        </div>
      )}
    </div>
  );
}
