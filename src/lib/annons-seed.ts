// Skriver in startsidans platshållarobjekt (dummy-listings.ts) som riktiga,
// publicerade annonser i saljare-annonser — en gång, idempotent — så att
// getAnnons()/annonsInfo() kan slå upp titel/ort/pris/adress för dem precis
// som för en säljares egna annonser. Utan detta visar admin (Sparade,
// Intressenter, Affärer/Uppdrag) "Annons #X"/"Ingen adress angiven" för
// varje köpare som sparat eller anmält intresse för ett av dessa objekt,
// trots att all information redan finns i dummy-listings.ts.
import { readAnnonser, writeAnnonser } from "@/lib/annons-workflow";
import { dummyListings, sodermalamListings, ostermalmListings } from "@/lib/dummy-listings";
import { type Listing } from "@/components/ListingCard";

function tillAnnons(l: Listing) {
  const nu = new Date().toISOString();
  return {
    id: l.id,
    titel: l.titel,
    agarUserId: "trelink-demo",
    ort: l.stad,
    pris: l.pris,
    cat: l.cat,
    reserverad: false,
    draft: {
      cat: l.cat,
      verksamhet: l.typ ?? "",
      adress: l.adress ?? "",
      yta: String(l.yta ?? ""),
      hyra: String(l.hyra ?? ""),
      fSkattManad: l.fSkattManad !== undefined ? String(l.fSkattManad) : undefined,
      bilder: ["demo-bild-1.jpg"],
    },
    workflow: {
      state: "publicerad" as const,
      timeline: [{ ts: nu, vem: "System" as const, text: "Startdata för demoobjekt" }],
      utkast: {
        rubrik: l.titel,
        beskrivning: "",
        pris: l.pris,
        yta: String(l.yta ?? ""),
        sentAt: nu,
      },
      publiceradAt: nu,
    },
  };
}

export function seedDummyAnnonser() {
  if (typeof window === "undefined") return;
  const alla = [...dummyListings, ...sodermalamListings, ...ostermalmListings];
  const befintliga = readAnnonser();
  const befintligaId = new Set(befintliga.map((a: { id: string }) => a.id));
  const saknade = alla.filter((l) => !befintligaId.has(l.id));
  if (saknade.length === 0) return;
  writeAnnonser([...befintliga, ...saknade.map(tillAnnons)]);
}
