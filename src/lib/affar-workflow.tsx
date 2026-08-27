// Delad affärs-/ärendemodell för köparens "Mina affärer"-vy — extraherad ur
// kopare.affarer.index.tsx (samma mönster som annons-model.ts) så att typer,
// datahantering och stegindikatorn går att återanvända utan att duplicera
// logik, t.ex. i en framtida detaljvy för en enskild affär.

import { StatusDot } from "@/components/wire";
import { getAnnons } from "@/lib/annons-workflow";
import type { BuyerInterest } from "@/lib/kopare-workflow";

export type Steg =
  | "intresse-inskickat"
  | "granskning"
  | "matchad"
  | "hyresvard"
  | "handpenning"
  | "signering"
  | "tilltrade"
  | "klar";

export type Vantar = "dig" | "george" | "saljare" | "hyresvard" | "ingen";

export type Affar = {
  id: string;
  annonsId: string;
  titel: string;
  ort: string;
  kat: string;
  pris: string;
  steg: Steg;
  vantar: Vantar;
  nastaSteg: string;
  cta?: { label: string };
  sla?: { timmarKvar: number; etikett: string };
  uppdaterad: string;
};

const STEG_ORDNING: Steg[] = [
  "intresse-inskickat",
  "granskning",
  "matchad",
  "hyresvard",
  "handpenning",
  "signering",
  "tilltrade",
  "klar",
];
const STEG_LABEL: Record<Steg, string> = {
  "intresse-inskickat": "Intresse inskickat",
  "granskning": "Granskning",
  matchad: "Matchad",
  hyresvard: "Hyresvärd",
  handpenning: "Handpenning",
  signering: "Signering",
  tilltrade: "Tillträde",
  klar: "Klar",
};

export function annonsInfo(annonsId: string) {
  const annons = getAnnons(annonsId);
  return {
    titel: annons?.titel ?? `Annons #${annonsId}`,
    pris: annons?.pris ?? "Pris ej tillgängligt",
    ort: annons?.ort ?? "—",
    kat: annons?.kat ?? "—",
  };
}

export function senasteUppdatering(interest: BuyerInterest): string {
  const ts = interest.timeline?.[0]?.ts ?? interest.skapadAt;
  return new Date(ts).toLocaleString("sv-SE");
}

export function buildAffarer(interests: BuyerInterest[]): Affar[] {
  return interests
    .filter((i) => i.status === "väntar-pdf" || i.status === "vill-ga-vidare")
    .map((i) => {
      const info = annonsInfo(i.annonsId);
      if (i.status === "väntar-pdf") {
        return {
          id: i.id,
          annonsId: i.annonsId,
          titel: info.titel,
          ort: info.ort,
          kat: info.kat,
          pris: info.pris,
          steg: "intresse-inskickat" as Steg,
          vantar: "dig" as Vantar,
          nastaSteg: "Öppna underlaget och ta ställning.",
          cta: { label: "Öppna underlaget →" },
          uppdaterad: senasteUppdatering(i),
        };
      }
      return {
        id: i.id,
        annonsId: i.annonsId,
        titel: info.titel,
        ort: info.ort,
        kat: info.kat,
        pris: info.pris,
        steg: "granskning" as Steg,
        vantar: "george" as Vantar,
        nastaSteg: "TreLink granskar och matchar dig med säljaren.",
        uppdaterad: senasteUppdatering(i),
      };
    });
}

export function buildAvslutade(interests: BuyerInterest[]) {
  return interests
    .filter((i) => i.status === "avböjt")
    .map((i) => {
      const info = annonsInfo(i.annonsId);
      return {
        id: i.id,
        titel: info.titel,
        pris: info.pris,
        resultat: "Avvisat av dig",
      };
    });
}

export function Progress({ steg }: { steg: Steg }) {
  const idx = STEG_ORDNING.indexOf(steg);
  return (
    <div className="grid grid-cols-4 gap-1 md:grid-cols-8">
      {STEG_ORDNING.map((s, i) => (
        <div
          key={s}
          className="flex flex-col items-center gap-1 rounded-card border border-foreground/15 bg-background p-2 text-center"
        >
          <StatusDot state={i < idx ? "done" : i === idx ? "active" : "pending"} />
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {STEG_LABEL[s]}
          </span>
        </div>
      ))}
    </div>
  );
}
