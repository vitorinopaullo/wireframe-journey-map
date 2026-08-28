import { useEffect, useRef, useState } from "react";
import { WireBox, WireBtn } from "@/components/wire";
import { VERKSAMHETSTYP_TAGGAR } from "@/lib/annons-model";

const OMRADE_OPTIONS = ["Södermalm", "Östermalm", "Vasastan", "Kungsholmen", "Göteborg", "Malmö"];

const PRISINTERVALL_OPTIONS = [
  "0 – 500 000 kr",
  "500 000 – 1 000 000 kr",
  "1 000 000 – 5 000 000 kr",
  "5 000 000 kr +",
];
const STORLEK_OPTIONS = ["0 – 50 m²", "50 – 100 m²", "100 – 250 m²", "250+ m²"];

function Dropdown({
  label,
  options,
  placeholder,
}: {
  label: string;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-full items-center justify-between rounded-button border border-foreground/15 bg-card px-3 text-left text-sm transition-colors duration-150 hover:border-foreground/30"
      >
        <span className={selected ? "text-foreground" : "text-foreground/40"}>
          {selected ?? placeholder}
        </span>
        <span className="text-muted-foreground">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-card border border-foreground/15 bg-card shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setSelected(opt);
                setOpen(false);
              }}
              className={[
                "block w-full px-3 py-2 text-left text-sm transition hover:bg-muted",
                selected === opt ? "bg-muted font-medium" : "",
              ].join(" ")}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchBox() {
  return (
    <WireBox label="Sök & filter" className="mb-8">
      {/* Sökfält */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Dropdown
          label="Verksamhetstyp"
          options={VERKSAMHETSTYP_TAGGAR}
          placeholder="Butik / Kontor / Restaurang…"
        />

        <Dropdown label="Område" options={OMRADE_OPTIONS} placeholder="Gata, stadsdel eller ort" />

        <Dropdown label="Pris" options={PRISINTERVALL_OPTIONS} placeholder="0 – 5 000 000 kr" />

        <Dropdown label="Storlek" options={STORLEK_OPTIONS} placeholder="Valfri storlek" />
      </div>

      {/* Åtgärder */}
      <div className="mt-4 flex items-center gap-5">
        <WireBtn className="px-10">Sök</WireBtn>
      </div>
    </WireBox>
  );
}
