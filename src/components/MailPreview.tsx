import { useEffect } from "react";
import { X } from "lucide-react";
import { Annotation } from "@/components/wire";

export type MailData = {
  fran: string;
  till: string;
  amne: string;
  brodtext: string;
};

/** Återanvändbar "mail skickat"-förhandsvisning. Rent visuellt — inget mail skickas på riktigt. */
export function MailPreview({
  open,
  mail,
  onClose,
}: {
  open: boolean;
  mail: MailData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto border-2 border-foreground bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-foreground/30 px-4 py-3">
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Mail · förhandsvisning
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Stäng <X className="inline-block h-3.5 w-3.5 ml-0.5 align-middle" />
          </button>
        </div>

        <div className="border-l-2 border-amber-500/70 bg-amber-50/60 px-4 py-3 dark:bg-amber-500/5">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-500">
            Simulerat — inget riktigt mail skickas
          </p>
        </div>

        <div className="space-y-3 p-6">
          <div className="border-b border-dashed border-muted-foreground/30 pb-2">
            <Annotation>Från</Annotation>
            <div className="mt-1 text-sm">{mail.fran}</div>
          </div>
          <div className="border-b border-dashed border-muted-foreground/30 pb-2">
            <Annotation>Till</Annotation>
            <div className="mt-1 text-sm">{mail.till}</div>
          </div>
          <div className="border-b border-dashed border-muted-foreground/30 pb-2">
            <Annotation>Ämne</Annotation>
            <div className="mt-1 text-sm font-medium">{mail.amne}</div>
          </div>
          <div className="pt-1">
            <Annotation>Brödtext</Annotation>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{mail.brodtext}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Liten trigger som öppnar förhandsvisningen — placeras bredvid en tidslinjepost. */
export function VisaMailLank({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground underline hover:text-foreground"
    >
      Visa mail →
    </button>
  );
}
