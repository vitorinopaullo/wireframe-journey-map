import { Check } from "lucide-react";
import { WireBox } from "@/components/wire";
import type { WorkflowState } from "@/lib/annons-workflow";

const PROCESS_STEPS: { label: string; states: WorkflowState[] }[] = [
  { label: "Granskning", states: ["granskas", "komplettering"] },
  { label: "Uppdragsavtal", states: ["avtal-vantar-signering"] },
  { label: "Annonstext", states: ["hyresvard-notifiering"] },
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
 * Annonstext → Publicerad) — the at-a-glance process overview shared
 * between TreLink's admin view of an annons and the seller's own view of
 * the same annons. Renders nothing for "avvisad" (see RejectedBanner-style
 * handling in admin.annonser.$id.tsx for that state instead). */
export function ProcessStepper({ state }: { state: WorkflowState | null }) {
  if (state === "avvisad") {
    return null;
  }
  const currentStep = stepIndexForState(state);
  return (
    <WireBox className="mb-6" variant="dashed">
      <div className="flex flex-wrap items-center gap-3">
        {PROCESS_STEPS.map((s, i) => {
          const status: "done" | "active" | "pending" =
            i < currentStep ? "done" : i === currentStep ? "active" : "pending";
          return (
            <div key={s.label} className="flex items-center gap-2">
              <StepDot status={status} />
              <span
                className={`text-xs ${
                  status === "active"
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
    </WireBox>
  );
}
