import { useEffect, useRef, useState } from "react";
import { WireBox, WireBtn } from "@/components/wire";

const TABS = [
  { value: "alla",   label: "Alla" },
  { value: "lokal",  label: "Lokal" },
  { value: "inkram", label: "Inkråm" },
  { value: "bolag",  label: "Bolag" },
] as const;
type TabValue = typeof TABS[number]["value"];

const OMRADE_OPTIONS = ["Södermalm", "Östermalm", "Vasastan", "Kungsholmen", "Göteborg", "Malmö"];
const VERKSAMHETSTYP_OPTIONS = ["Restaurang", "Café", "Butik", "Frisör", "Kontor", "Skönhetssalong"];
const LOKALTYP_OPTIONS = ["Kontor", "Butik", "Restaurang", "Lager"];
const PRISINTERVALL_OPTIONS = [
  "0 – 500 000 kr",
  "500 000 – 1 000 000 kr",
  "1 000 000 – 5 000 000 kr",
  "5 000 000 kr +",
];
const STORLEK_OPTIONS = ["0 – 50 m²", "50 – 100 m²", "100 – 250 m²", "250+ m²"];
const PUBLICERAD_OPTIONS = ["Senaste 24 timmarna", "Senaste veckan", "Senaste månaden", "Alla"];

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
        className="flex h-12 w-full items-center justify-between border border-foreground/40 bg-background px-3 text-left text-sm"
      >
        <span className={selected ? "text-foreground" : "text-foreground/40"}>
          {selected ?? placeholder}
        </span>
        <span className="text-muted-foreground">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 border border-foreground/40 bg-background">
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
  const [active, setActive] = useState<TabValue>("alla");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const isLokal = active === "lokal";

  return (
    <WireBox label="Sök & filter" className="mb-8">
      {/* Transaktionstyp-flikar */}
      <div className="mb-5 flex overflow-x-auto">
        {TABS.map((tab, i) => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={[
              "relative shrink-0 px-5 py-2 font-mono text-[11px] uppercase tracking-wider transition",
              i > 0 ? "-ml-px" : "",
              active === tab.value
                ? "z-10 border border-foreground bg-foreground text-background"
                : "border border-foreground/30 bg-background text-muted-foreground hover:z-10 hover:border-foreground hover:text-foreground",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sökfält */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <Dropdown label="Område" options={OMRADE_OPTIONS} placeholder="Gata, stadsdel eller ort" />

        <Dropdown
          key={active}
          label={isLokal ? "Lokaltyp" : "Verksamhetstyp"}
          options={isLokal ? LOKALTYP_OPTIONS : VERKSAMHETSTYP_OPTIONS}
          placeholder={
            isLokal ? "Kontor / Butik / Restaurang / Lager…" : "Restaurang / Café / Butik / Frisör…"
          }
        />

        <Dropdown label="Prisintervall" options={PRISINTERVALL_OPTIONS} placeholder="0 – 5 000 000 kr" />
      </div>

      {/* Fler filter — expanderas inline, samma gridmall som sökfälten ovan */}
      {showMoreFilters && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <div className="hidden md:block" aria-hidden="true" />
          <Dropdown label="Storlek (m²)" options={STORLEK_OPTIONS} placeholder="Valfri storlek" />
          <Dropdown label="Publicerad" options={PUBLICERAD_OPTIONS} placeholder="Alla datum" />
        </div>
      )}

      {/* Åtgärder */}
      <div className="mt-4 flex items-center gap-5">
        <WireBtn className="px-10">Sök</WireBtn>
        <button
          onClick={() => setShowMoreFilters((s) => !s)}
          className="font-mono text-xs text-muted-foreground transition hover:text-foreground"
        >
          {showMoreFilters ? "Dölj filter −" : "Fler filter +"}
        </button>
      </div>
    </WireBox>
  );
}
