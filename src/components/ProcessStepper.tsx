import { Check } from "lucide-react";
import { WireBox } from "@/components/wire";
import type { WorkflowState } from "@/lib/annons-workflow";

export const PROCESS_STEPS: { label: string; states: WorkflowState[] }[] = [
  { label: "Granskning", states: ["granskas", "komplettering"] },
  { label: "Uppdragsavtal", states: ["avtal-vantar-signering"] },
  { label: "Hyresvärd", states: ["hyresvard-notifiering"] },
  { label: "Publicerad", states: ["publicerad"] },
];

function stepIndexForState(state: WorkflowState | null): number {
  if (!state) return 0;
  const idx = PROCESS_STEPS.findIndex((s) => s.states.includes(state));
  return idx === -1 ? 0 : idx;
}

function StepDot({ status }: { status: "done" | "active" | "pending" }) {
  if (status === "done") {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-success)] text-white">
        <Check className="h-2.5 w-2.5" />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="inline-block h-3 w-3 rounded-full bg-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/25" />
    );
  }
  return (
    <span className="inline-block h-3 w-3 rounded-full border border-foreground/25 bg-background" />
  );
}

/** Dot + label + chevron status row (Granskning → Uppdragsavtal →
 * Hyresvärd → Publicerad) — the at-a-glance process overview shared
 * between TreLink's admin view of an annons and the seller's own view of
 * the same annons.
 *
 * "komplettering" and "avvisad" both sit at step 0 (Granskning) but get
 * distinct visual treatment there rather than reading as "active":
 * komplettering shows an amber label plus a note that a resubmission is
 * expected; avvisad shows a muted label only — the "ärendet är stängt"
 * explanation itself is left to each page's own avvisad messaging
 * (RejectedBanner on admin.annonser.$id.tsx, the seller's own
 * avvisad-status section on saljare.annons.$id.tsx) so it isn't said
 * twice in two different visual styles. */
export function ProcessStepper({ state }: { state: WorkflowState | null }) {
  const isKomplettering = state === "komplettering";
  const isAvvisad = state === "avvisad";
  const currentStep = stepIndexForState(state);
  return (
    <WireBox className="mb-6" variant="dashed">
      <div className="flex flex-wrap items-center gap-3">
        {PROCESS_STEPS.map((s, i) => {
          const isSpecialStep = (isKomplettering || isAvvisad) && i === 0;
          const status: "done" | "active" | "pending" = isSpecialStep
            ? "pending"
            : i < currentStep
              ? "done"
              : i === currentStep
                ? "active"
                : "pending";
          return (
            <div key={s.label} className="flex items-center gap-2">
              <StepDot status={status} />
              <span
                className={`text-xs ${
                  isKomplettering && i === 0
                    ? "font-semibold text-amber-700 dark:text-amber-500"
                    : isAvvisad && i === 0
                      ? "font-semibold text-foreground/70"
                      : status === "active"
                        ? "font-semibold text-foreground"
                        : status === "done"
                          ? "text-foreground"
                          : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < PROCESS_STEPS.length - 1 && <span className="text-muted-foreground/40">›</span>}
            </div>
          );
        })}
      </div>
      {isKomplettering && (
        <div className="mt-3 border-t border-amber-500/40 pt-2 text-xs font-medium text-amber-700 dark:text-amber-500">
          ↩ Komplettering begärd — åtgärda och skicka in på nytt
        </div>
      )}
    </WireBox>
  );
}
