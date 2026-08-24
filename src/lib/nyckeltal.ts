// Delad nyckeltalslogik för annonskort och annons-detaljsida — grenar
// enbart på verksamhetstyp (typ), se SearchFilters.tsx för samma 13
// verksamhetstyper.

import type { CatId } from "@/lib/annons-model";

export const GRUPP_LOKAL_TYPER = ["Butik", "Kontor", "Lager"];
export const GRUPP_MAT_TYPER = ["Restaurang", "Café", "Bageri", "Bistro", "Pub", "Vinbar"];
export const GRUPP_SKONHET_TYPER = ["Frisör", "Nagelsalong", "Massage", "Estetisk"];

export type NyckeltalKalla = {
  typ?: string;
  cat: CatId;
  pris: string;
  adress?: string;
  yta?: number;
  hyra?: number;
  fSkattManad?: number;
  omsattning?: string;
  antalAnstallda?: number;
  lonsamt?: boolean;
};

export function nyckeltalFor(l: NyckeltalKalla): { label: string; value: string }[] {
  if (l.typ == null || l.yta == null) return [];
  const fskatt = l.fSkattManad ? `${l.fSkattManad.toLocaleString("sv-SE")} kr/mån` : "—";
  const hyraValue = l.hyra != null ? `${l.hyra.toLocaleString("sv-SE")} kr/mån` : "—";
  const visaOmsattning = l.cat === "aktie" || l.cat === "inkram";

  if (GRUPP_LOKAL_TYPER.includes(l.typ)) {
    const prisKr = Number(l.pris.replace(/\D/g, ""));
    const prisPerKvm = prisKr > 0 ? Math.round(prisKr / l.yta) : null;
    return [
      { label: "Adress", value: l.adress ?? "—" },
      { label: "Hyra", value: hyraValue },
      { label: "Yta", value: `${l.yta} kvm` },
      { label: "Pris/kvm", value: prisPerKvm != null ? `${prisPerKvm.toLocaleString("sv-SE")} kr/kvm` : "—" },
      { label: "F-skatt", value: fskatt },
    ];
  }
  if (GRUPP_MAT_TYPER.includes(l.typ)) {
    return [
      { label: "Adress", value: l.adress ?? "—" },
      { label: "Hyra", value: hyraValue },
      { label: "Yta", value: `${l.yta} kvm` },
      { label: "F-skatt", value: fskatt },
      ...(visaOmsattning ? [{ label: "Omsättning", value: l.omsattning ?? "—" }] : []),
      { label: "Lönsamt", value: l.lonsamt == null ? "—" : l.lonsamt ? "Ja" : "Nej" },
    ];
  }
  if (GRUPP_SKONHET_TYPER.includes(l.typ)) {
    return [
      { label: "Hyra", value: hyraValue },
      { label: "Yta", value: `${l.yta} kvm` },
      { label: "F-skatt", value: fskatt },
      ...(visaOmsattning ? [{ label: "Omsättning", value: l.omsattning ?? "—" }] : []),
      { label: "Antal anställda", value: l.antalAnstallda != null ? `${l.antalAnstallda}` : "—" },
      { label: "Lönsamt", value: l.lonsamt == null ? "—" : l.lonsamt ? "Ja" : "Nej" },
    ];
  }
  return [];
}
