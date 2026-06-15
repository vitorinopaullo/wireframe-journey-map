import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireField, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/saljare/skapa-annons")({
  component: CreateListing,
});

const cats = [
  { id: "lokal", name: "Lokal", desc: "Du hyr lokalen — hyresvärden måste godkänna köparen via anonym profil.", avgift: "29 500 kr" },
  { id: "inkram", name: "Inkråm", desc: "Tillgångar & verksamhet säljs till köparens bolag. Varje dokument granskas av George.", avgift: "49 500 kr" },
  { id: "bolag", name: "Aktiebolag", desc: "Hela bolaget byter ägare. Avtal följer med automatiskt. Verklig huvudman + AML.", avgift: "79 500 kr" },
];

function CreateListing() {
  const [cat, setCat] = useState("lokal");
  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow="Säljarläge · Fas 1"
        title="Skapa annons"
        subtitle="Gratis att annonsera. Avgiften tas ut först vid genomförd affär. Kategorin styr fält och underlag."
        right={<WireTag>Steg 1 av 4</WireTag>}
      />

      <WireBox label="1 · Välj kategori" className="mb-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`border p-4 text-left transition ${
                cat === c.id ? "border-foreground bg-muted/40" : "border-dashed border-muted-foreground/40"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{c.name}</span>
                <WireTag>{c.avgift}</WireTag>
              </div>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
            </button>
          ))}
        </div>
      </WireBox>

      <WireBox label="2 · Grunduppgifter" className="mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <WireField label="Annonsrubrik" placeholder="t.ex. Restauranglokal Södermalm" />
          <WireField label="Ort" placeholder="Stockholm" />
          <WireField label="Pris (kr)" placeholder="1 950 000" />
          {cat === "lokal" && <WireField label="Storlek (m²)" placeholder="180" />}
          {cat === "inkram" && <WireField label="Verksamhetstyp" placeholder="Café & bageri" />}
          {cat === "bolag" && <WireField label="Org.nr" placeholder="556xxx-xxxx" />}
        </div>
      </WireBox>

      <WireBox label={`3 · Underlag (${cat})`} className="mb-6">
        <div className="space-y-3">
          {(cat === "lokal"
            ? ["Hyreskontrakt", "Inventarielista", "Bilder på lokalen"]
            : cat === "inkram"
            ? ["Tillgångslista", "Resultaträkning 2024", "Balansräkning", "Anställningsavtal"]
            : ["Bolagsinfo", "Årsredovisning", "Aktieägaravtal", "Verklig huvudman"]
          ).map((d) => (
            <div key={d} className="flex items-center justify-between border border-dashed border-muted-foreground/40 p-3">
              <span className="text-sm">▤ {d}</span>
              <WireBtn variant="ghost">Ladda upp</WireBtn>
            </div>
          ))}
        </div>
        <Annotation>
          <span className="mt-3 block">George granskar varje dokument före publicering. Inget publiceras ogranskat.</span>
        </Annotation>
      </WireBox>

      <WireBox label="4 · Premium (frivilligt)" variant="dashed" className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Premium-annons · 2 500 kr — extra exponering i topplistan.</p>
            <Annotation>Engångsbetalning · ingen löpande avgift</Annotation>
          </div>
          <WireBtn variant="secondary">Lägg till premium</WireBtn>
        </div>
      </WireBox>

      <div className="flex justify-between">
        <WireBtn variant="ghost">Spara utkast</WireBtn>
        <WireBtn>Skicka för granskning →</WireBtn>
      </div>
    </AppLayout>
  );
}
