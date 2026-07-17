import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, WireBtn, WireTag, Annotation, PageHeader, StatusDot } from "@/components/wire";
import { useIsAuthed } from "@/hooks/use-session";

export const Route = createFileRoute("/annons/$id")({
  component: ListingDetail,
});

/* ---------- mock data ---------- */
const listing = {
  id: "1",
  kategori: "Lokal",
  rubrik: "Restauranglokal · 180 m² · Hornstull",
  underrubrik:
    "Fullt utrustad restauranglokal med uteservering. Lång hyresperiod kvar, fungerande ventilation, A-läge.",
  ort: "Stockholm · Södermalm",
  pris: 1_950_000,
  publicerad: "28 maj 2026",
  uppdaterad: "12 jun 2026",
  visningar: 412,
  intressenter: 7,
  nyckeltal: [
    ["Omsättning", "8,4 Mkr"],
    ["Resultat", "+ 1,1 Mkr"],
    ["Hyra/mån", "62 000 kr"],
    ["Anställda", "9 st"],
    ["Hyresperiod kvar", "4 år + 3"],
    ["Etablerad", "2014"],
  ],
  dokument: [
    { namn: "Hyreskontrakt.pdf", status: "godkänt" },
    { namn: "Resultaträkning 2024.pdf", status: "godkänt" },
    { namn: "Resultaträkning 2023.pdf", status: "godkänt" },
    { namn: "Inventarielista.pdf", status: "godkänt" },
    { namn: "Personalöversikt.pdf", status: "godkänt" },
  ],
  faq: [
    ["Varför säljs verksamheten?", "Ägaren ska gå i pension. Driftpersonal stannar gärna."],
    ["Får jag ta över hyreskontraktet?", "Ja, med hyresvärdens godkännande. TreLink driver dialogen."],
    ["Ingår inventarier?", "Ja, allt i inventarielistan. Råvarulager räknas separat vid tillträde."],
    ["När kan tillträde ske?", "Tidigast 6 veckor efter signering — beror på hyresvärd."],
  ],
};

const liknande = [
  { id: "4", titel: "Butik · Vasastan", pris: "1 200 000", kat: "Lokal" },
  { id: "5", titel: "Frisörsalong · Uppsala", pris: "420 000", kat: "Inkråm" },
  { id: "2", titel: "Café & bageri", pris: "850 000", kat: "Inkråm" },
];

/* ---------- helpers ---------- */
function StickyCTA({
  scrolled,
  saved,
  onSave,
  onInterest,
}: {
  scrolled: boolean;
  saved: boolean;
  onSave: () => void;
  onInterest: () => void;
}) {
  if (!scrolled) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/30 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <WireTag>{listing.kategori}</WireTag>
          <span className="text-sm font-medium">{listing.rubrik}</span>
          <span className="font-mono text-sm">{listing.pris.toLocaleString("sv-SE")} kr</span>
        </div>
        <div className="flex gap-2">
          <WireBtn variant="ghost" onClick={onSave}>
            {saved ? "★ Sparad" : "☆ Spara"}
          </WireBtn>
          <WireBtn onClick={onInterest}>Anmäl intresse →</WireBtn>
        </div>
      </div>
    </div>
  );
}

function ListingDetail() {
  const { id } = Route.useParams();
  const [saved, setSaved] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isAuthed = useIsAuthed();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const gotoLogin = (next: string) =>
    navigate({ to: "/logga-in", search: { next } });

  const handleInterest = () => {
    if (isAuthed) navigate({ to: "/annons/$id/intresse", params: { id } });
    else gotoLogin(`/annons/${id}/intresse`);
  };

  const handleSave = () => {
    if (!isAuthed) return gotoLogin(`/annons/${id}`);
    setSaved((v) => !v);
  };


  return (
    <PublicLayout>
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">← Tillbaka till sök</Link>
        <span>·</span>
        <span>Annons #{id}</span>
      </div>

      <PageHeader
        eyebrow={`${listing.kategori} · ${listing.ort}`}
        title={listing.rubrik}
        subtitle={listing.underrubrik}
        right={
          <div className="flex flex-wrap gap-2">
            <WireTag>✓ Granskad av TreLink</WireTag>
            <WireTag>Premium</WireTag>
            <WireTag>{listing.intressenter} intressenter</WireTag>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ------------- LEFT ------------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Galleri */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex h-48 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-xs text-muted-foreground"
              >
                [ Bild {i} ]
              </div>
            ))}
          </div>

          {/* Trust-rad */}
          <WireBox label="Vad TreLink har verifierat" variant="dashed">
            <ul className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              {[
                "Säljarens identitet (BankID)",
                "Org.nr & ägarstruktur",
                "Hyreskontrakt giltigt",
                "Resultat- och balansräkning (2 år)",
                "Inventarielista mot bokföring",
                "Ingen pågående tvist/skuld",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <StatusDot state="done" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Annotation>
              <span className="mt-3 block">
                TreLink står som mellanhand. Inga uppgifter byts mellan parter förrän handpenning är inne.
              </span>
            </Annotation>
          </WireBox>

          {/* Beskrivning */}
          <WireBox label="Beskrivning">
            <p className="text-sm text-muted-foreground">
              [Säljarens beskrivning av verksamheten / lokalen. Granskad av TreLink innan publicering.
              Inkluderar bakgrund, inventarier, omsättning, personal, hyresvillkor.]
            </p>
          </WireBox>

          {/* Nyckeltal */}
          <WireBox label="Nyckeltal">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {listing.nyckeltal.map(([k, v]) => (
                <div key={k}>
                  <Annotation>{k}</Annotation>
                  <div className="mt-1 font-mono text-lg">{v}</div>
                </div>
              ))}
            </div>
          </WireBox>

          {/* Dokument */}
          <WireBox label="Dokument — granskade av TreLink" variant="dashed">
            <ul className="space-y-2 text-sm">
              {listing.dokument.map((d) => (
                <li
                  key={d.namn}
                  className="flex items-center justify-between border-b border-dashed border-muted-foreground/30 py-2"
                >
                  <span>▤ {d.namn}</span>
                  <div className="flex items-center gap-2">
                    <WireTag>Godkänt</WireTag>
                    <span className="text-xs text-muted-foreground">Förhandsvisa efter intresseanmälan</span>
                  </div>
                </li>
              ))}
            </ul>
          </WireBox>

          {/* FAQ */}
          <WireBox label="Vanliga frågor">
            <div className="divide-y divide-dashed divide-muted-foreground/30">
              {listing.faq.map(([q, a]) => (
                <details key={q} className="group py-3">
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                    {q}
                    <span className="font-mono text-xs text-muted-foreground group-open:rotate-45 transition">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </WireBox>
        </div>

        {/* ------------- RIGHT (sticky) ------------- */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <WireBox label="Pris">
            <div className="font-mono text-3xl">{listing.pris.toLocaleString("sv-SE")} kr</div>
            <p className="mt-1 text-xs text-muted-foreground">Inkråm + inventarier</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <Annotation>Handpenning</Annotation>
                <p className="mt-1 font-mono">~ 195 000 kr</p>
              </div>
              <div>
                <Annotation>Trelinks avgift</Annotation>
                <p className="mt-1 font-mono">vid tillträde</p>
              </div>
            </div>
          </WireBox>

          <WireBox label="Nästa steg">
            <ol className="mb-4 space-y-2 text-xs">
              {[
                ["1", "Anmäl intresse (gratis, BankID)"],
                ["2", "TreLink kör UC + matchar"],
                ["3", "Du får full info & hyresvärd kontrolleras"],
                ["4", "Handpenning till klientmedel"],
                ["5", "Signera digitalt (Signicat)"],
                ["6", "Tillträde — säljaren får betalt"],
              ].map(([n, t]) => (
                <li key={n} className="flex gap-2">
                  <span className="font-mono text-muted-foreground">{n}.</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-2">
              <WireBtn to="/annons/$id/intresse" params={{ id }}>
                Anmäl intresse →
              </WireBtn>
              <WireBtn variant="secondary" onClick={() => setSaved(!saved)}>
                {saved ? "★ Sparad i favoriter" : "☆ Spara som favorit"}
              </WireBtn>
              <WireBtn variant="ghost" to="/kopare/bevakningar">
                Bevaka liknande
              </WireBtn>
            </div>
            <Annotation>
              <span className="mt-3 block">
                Inga kontaktuppgifter byts. TreLink når dig på mejl inom 24 h.
              </span>
            </Annotation>
          </WireBox>

          <WireBox label="Statistik" variant="ghost">
            <ul className="space-y-1 text-xs">
              <li className="flex justify-between"><span>Publicerad</span><span>{listing.publicerad}</span></li>
              <li className="flex justify-between"><span>Uppdaterad</span><span>{listing.uppdaterad}</span></li>
              <li className="flex justify-between"><span>Visningar</span><span>{listing.visningar}</span></li>
              <li className="flex justify-between"><span>Intresseanmälningar</span><span>{listing.intressenter}</span></li>
            </ul>
          </WireBox>
        </aside>
      </div>

      {/* Liknande */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Liknande annonser</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {liknande.map((l) => (
            <Link
              key={l.id}
              to="/annons/$id"
              params={{ id: l.id }}
              className="group block border border-foreground/30 bg-background p-4 hover:border-foreground transition"
            >
              <div className="mb-3 flex h-24 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-[10px] text-muted-foreground">
                [ Bild ]
              </div>
              <WireTag>{l.kat}</WireTag>
              <h3 className="mt-2 font-medium group-hover:underline">{l.titel}</h3>
              <p className="mt-2 font-mono text-sm">{l.pris} kr</p>
            </Link>
          ))}
        </div>
      </div>

      <StickyCTA scrolled={scrolled} saved={saved} setSaved={setSaved} />
      <div className="h-20" />
    </PublicLayout>
  );
}
