import { Upload, FileText, Check } from "lucide-react";
import { WireBtn, WireTag, Annotation } from "@/components/wire";
import type { DocState } from "@/lib/annons-model";

function DocStatusDot({ state }: { state: DocState }) {
  const cls =
    state === "godkant"
      ? "bg-foreground"
      : state === "granskas"
        ? "bg-foreground/60 ring-2 ring-foreground/20"
        : state === "uppladdad"
          ? "bg-foreground/40"
          : state === "komplettera"
            ? "bg-card border border-foreground"
            : "bg-card border border-foreground/30";
  return <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${cls}`} />;
}

// Kompaktare statusindikator för dokumentrader: ingen tom cirkel, ingen
// "Saknas"-etikett (tomt läge är underförstått), grön bock för uppladdat.
function DocStatusIndicator({ state, label }: { state: DocState; label?: string }) {
  if (state === "saknas") return null;
  if (state === "uppladdad") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-success)]">
        <Check className="h-3.5 w-3.5" /> Uppladdad
      </span>
    );
  }
  return <WireTag>{label}</WireTag>;
}

/** Generic labeled file-upload row used across buyer-facing forms (deal
 * granskning, profile) — shows the uploaded filename once present, or a
 * click-to-upload control otherwise. Extracted from kopare.affarer.$id.tsx
 * so it can be reused without duplicating the markup.
 *
 * Optionally supports the richer 5-state DocState model (docState +
 * docStatusLabel), ported from saljare.skapa-annons.tsx's former
 * DocUploadRad — pass docState to opt into that layout (status dot + name/
 * hint on the left, status indicator + contextual button on the right).
 * Callers that don't pass docState keep the original simple binary
 * has-file/doesn't-have-file layout unchanged. */
export function FileUploadRow({
  label,
  fileName,
  onUpload,
  docState,
  docStatusLabel,
  hint,
}: {
  label: string;
  fileName?: string;
  onUpload: (filnamn: string) => void;
  docState?: DocState;
  docStatusLabel?: string;
  hint?: string;
}) {
  if (docState) {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-foreground/15 bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <DocStatusDot state={docState} />
          <div>
            <div className="text-sm font-medium">{label}</div>
            {hint && <Annotation>{hint}</Annotation>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DocStatusIndicator state={docState} label={docStatusLabel} />
          {docState === "saknas" || docState === "komplettera" ? (
            <WireBtn variant="secondary" onClick={() => onUpload("")}>
              Ladda upp
            </WireBtn>
          ) : (
            <WireBtn variant="ghost" onClick={() => onUpload("")}>
              Byt fil
            </WireBtn>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-foreground/10 py-2">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {fileName ? (
        <div className="flex h-11 items-center gap-2 rounded-button border border-foreground/15 bg-card px-3 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{fileName}</span>
        </div>
      ) : (
        <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-button border border-foreground/15 bg-card px-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-foreground/40">
          <input
            type="file"
            aria-label={label}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file.name);
            }}
          />
          <Upload className="h-4 w-4" />
          Ladda upp fil
        </label>
      )}
    </div>
  );
}
