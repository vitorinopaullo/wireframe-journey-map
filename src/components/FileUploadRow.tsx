import { Upload, FileText } from "lucide-react";

/** Generic labeled file-upload row used across buyer-facing forms (deal
 * granskning, profile) — shows the uploaded filename once present, or a
 * click-to-upload control otherwise. Extracted from kopare.affarer.$id.tsx
 * so it can be reused without duplicating the markup. */
export function FileUploadRow({
  label,
  fileName,
  onUpload,
}: {
  label: string;
  fileName?: string;
  onUpload: (filnamn: string) => void;
}) {
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
