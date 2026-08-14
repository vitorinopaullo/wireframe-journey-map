import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, WireBtn, Annotation, PageHeader } from "@/components/wire";
import { SearchBox } from "@/components/SearchFilters";
import { ListingCard, type Listing } from "@/components/ListingCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Trelink — Köp & sälj lokaler, inkråm och bolag" },
      {
        name: "description",
        content:
          "Digitalt mäkleri för affärsöverlåtelser. Sök lokaler, inkrämbolag och aktiebolag — verifierat via BankID.",
      },
    ],
  }),
});

const dummyListings: Listing[] = [
  { id: "1", kat: "Lokal", cat: "overlatelse", titel: "Restauranglokal · Södermalm", pris: "1 950 000", stad: "Stockholm", typ: "Restaurang", adress: "Folkungagatan 22", yta: 180, hyra: 63_000, hasFTax: true, omsattning: "3,4 Mkr", lonsamt: true },
  { id: "2", kat: "Lokal", cat: "overlatelse", titel: "Café & bageri · Göteborg", pris: "850 000", stad: "Göteborg", typ: "Café", adress: "Kyrkogatan 14", yta: 60, hyra: 22_000, hasFTax: true, omsattning: "1,9 Mkr", lonsamt: true },
  { id: "3", kat: "Lokal", cat: "overlatelse", titel: "Kontorslokal · Malmö", pris: "2 400 000", stad: "Malmö", typ: "Kontor", adress: "Stora Nygatan 12", yta: 210, hyra: 68_000, hasFTax: true },
  { id: "4", kat: "Lokal", cat: "overlatelse", titel: "Butik · Vasastan", pris: "1 200 000", stad: "Stockholm", typ: "Butik", adress: "Odengatan 30", yta: 95, hyra: 33_250 },
  { id: "5", kat: "Lokal", cat: "overlatelse", titel: "Frisörsalong · Uppsala", pris: "420 000", stad: "Uppsala", typ: "Frisör", adress: "Kungsgatan 9", yta: 45, hyra: 15_000, omsattning: "980 tkr", antalAnstallda: 2, lonsamt: true },
  { id: "6", kat: "Lokal", cat: "overlatelse", titel: "Nagelsalong · Remote", pris: "310 000", stad: "Uppsala", typ: "Nagelsalong", adress: "Vaksalagatan 22", yta: 30, hyra: 11_000, omsattning: "540 tkr", antalAnstallda: 1, lonsamt: false },
  { id: "7", kat: "Lokal", cat: "overlatelse", titel: "Lagerlokal · Bromma", pris: "1 650 000", stad: "Stockholm", typ: "Lager", adress: "Industrivägen 8", yta: 400, hyra: 60_000 },
];

const sodermalamListings: Listing[] = [
  { id: "s1", kat: "Lokal", cat: "overlatelse", titel: "Restauranglokal · Medborgarplatsen", pris: "2 100 000", stad: "Stockholm · Södermalm", typ: "Restaurang", adress: "Medborgarplatsen 4", yta: 210, hyra: 78_750, omsattning: "4,2 Mkr", lonsamt: true },
  { id: "s2", kat: "Lokal", cat: "overlatelse", titel: "Café med uteservering · SoFo", pris: "680 000", stad: "Stockholm · Södermalm", typ: "Café", adress: "Skånegatan 71", yta: 65, hyra: 26_000, omsattning: "1,8 Mkr", lonsamt: false },
  { id: "s3", kat: "Lokal", cat: "overlatelse", titel: "Kontorslokal · Hornsgatan", pris: "1 450 000", stad: "Stockholm · Södermalm", typ: "Kontor", adress: "Hornsgatan 45", yta: 120, hyra: 42_000 },
  { id: "s4", kat: "Lokal", cat: "overlatelse", titel: "Bageri inkl. inventarier · SoFo", pris: "390 000", stad: "Stockholm · Södermalm", typ: "Bageri", adress: "Bondegatan 21", yta: 35, hyra: 14_500, omsattning: "890 tkr", lonsamt: true },
  { id: "s5", kat: "Lokal", cat: "overlatelse", titel: "Butik · Götgatan", pris: "950 000", stad: "Stockholm · Södermalm", typ: "Butik", adress: "Götgatan 55", yta: 78, hyra: 29_640 },
];

const ostermalmListings: Listing[] = [
  { id: "o1", kat: "Lokal", cat: "overlatelse", titel: "Restauranglokal · Stureplan", pris: "3 800 000", stad: "Stockholm · Östermalm", typ: "Restaurang", adress: "Stureplan 4", yta: 285, hyra: 142_500, omsattning: "6,1 Mkr", lonsamt: true },
  { id: "o2", kat: "Lokal", cat: "overlatelse", titel: "Frisörsalong · Birger Jarlsgatan", pris: "740 000", stad: "Stockholm · Östermalm", typ: "Frisör", adress: "Birger Jarlsgatan 61", yta: 55, hyra: 24_750, omsattning: "1,2 Mkr", antalAnstallda: 3, lonsamt: true },
  { id: "o3", kat: "Lokal", cat: "overlatelse", titel: "Bistro med catering", pris: "1 150 000", stad: "Stockholm · Östermalm", typ: "Bistro", adress: "Sibyllegatan 8", yta: 90, hyra: 41_000, omsattning: "2,4 Mkr", lonsamt: true },
  { id: "o4", kat: "Lokal", cat: "overlatelse", titel: "Kontorslokal · Humlegården", pris: "2 200 000", stad: "Stockholm · Östermalm", typ: "Kontor", adress: "Humlegårdsgatan 12", yta: 160, hyra: 64_000 },
  { id: "o5", kat: "Lokal", cat: "overlatelse", titel: "Estetisk klinik · Karlavägen", pris: "880 000", stad: "Stockholm · Östermalm", typ: "Estetisk", adress: "Karlavägen 33", yta: 70, hyra: 29_400, omsattning: "1,6 Mkr", antalAnstallda: 4, lonsamt: true },
];

const faqItems = [
  {
    id: "faq-1",
    q: "Vad kostar det att sälja via Trelink?",
    a: "Trelink tar en fast förmedlingsavgift utan provision: 29 900 kr för Överlåtelse, 39 900 kr för Inkråm och 79 900 kr för Aktieöverlåtelse. Premiumpaketet (ökad exponering m.m.) kostar ytterligare 2 500 kr. Du vet vad det kostar från dag ett.",
  },
  {
    id: "faq-2",
    q: "När betalar jag avgiften?",
    a: "Förmedlingsavgiften betalas vid tillträde och dras automatiskt ur de klientmedel (handpenning) som Trelink håller på ditt uppdrag. Ingenting betalas i förväg.",
  },
  {
    id: "faq-3",
    q: "Varför sker ingen direktkontakt mellan köpare och säljare?",
    a: "Trelink agerar mellanhand under hela processen för att skydda båda parter. Identiteter och kontaktuppgifter frigörs först när köpeavtal signerats och handpenningen betalats. Köpare visas anonymt som koder (K-xxx) tills affären är klar.",
  },
  {
    id: "faq-4",
    q: "Hur lång är granskningstiden?",
    a: "Trelink återkommer med besked, kompletteringsbegäran eller uppdragsavtal inom 24 h på vardagar från att du skickat in ditt underlag.",
  },
  {
    id: "faq-5",
    q: "Vad granskar Trelink i mitt underlag?",
    a: "Vi granskar hyreskontrakt, bolagsuppgifter, resultat- och balansräkning (minst 2 år) samt inventarielista. Granskningen säkerställer att objektet uppfyller kraven för förmedling och att informationen till köpare är korrekt.",
  },
];

function ListingCarousel({
  title,
  listings,
  omrade,
}: {
  title: string;
  listings: Listing[];
  omrade: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!api) return;

    const onSelectOrInit = () => {
      setScrollSnaps(api.scrollSnapList());
      setSelectedIndex(api.selectedScrollSnap());
    };

    onSelectOrInit();
    api.on("select", onSelectOrInit);
    api.on("reInit", onSelectOrInit);

    return () => {
      api.off("select", onSelectOrInit);
      api.off("reInit", onSelectOrInit);
    };
  }, [api]);

  return (
    <div className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {/*
          TODO: /lokaler är statisk (hårdkodad till Södermalm) och stödjer ännu
          inte per-område-routing. Länka till t.ex. `/lokaler/${omrade}` när
          PLP-sidan tar emot ett dynamiskt områdesparametrar istället.
        */}
        <Link
          to="/lokaler"
          className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
        >
          Visa alla
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <Carousel opts={{ align: "start" }} setApi={setApi}>
        <CarouselContent>
          {listings.map((l) => (
            <CarouselItem key={l.id} className="basis-full md:basis-1/2 lg:basis-1/3">
              <ListingCard l={l} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {scrollSnaps.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Sida ${i + 1} av ${scrollSnaps.length}`}
              aria-current={i === selectedIndex}
              className={[
                "h-2 w-2 rounded-full border border-foreground/40 transition",
                i === selectedIndex ? "bg-foreground border-foreground" : "bg-background",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HomePage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Publik yta · ingen inloggning krävs"
        title="Hitta verksamheter att ta över"
        subtitle="Lokaler, inkråm och aktiebolag — granskade av TreLink innan publicering. Bläddra fritt, spara med konto, agera med BankID-verifiering."
      />

      <SearchBox />

      {/* Aktuella annonser */}
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-semibold">Aktuella annonser</h2>
        <Annotation>{dummyListings.length} träffar · sorterat på nyast</Annotation>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dummyListings.map((l) => (
          <ListingCard key={l.id} l={l} />
        ))}
      </div>

      <WireBox label="Friktion ökar gradvis" variant="dashed" className="mt-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <Annotation>Titta</Annotation>
            <p className="mt-1 text-sm">Fritt — ingen inloggning. Bläddra, läs, jämför.</p>
          </div>
          <div>
            <Annotation>Spara</Annotation>
            <p className="mt-1 text-sm">Kräver konto + BankID. Favoriter, bevakningar, intresse.</p>
          </div>
          <div>
            <Annotation>Affär</Annotation>
            <p className="mt-1 text-sm">TreLink matchar parterna och signering sker digitalt.</p>
          </div>
        </div>
      </WireBox>

      {/* Karuseller per stadsdel */}
      <ListingCarousel title="Lediga lokaler i Södermalm" listings={sodermalamListings} omrade="Södermalm" />
      <ListingCarousel title="Lediga lokaler i Östermalm" listings={ostermalmListings} omrade="Östermalm" />

      {/* Om oss */}
      <div className="mt-16">
        <WireBox label="Om Trelink">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Trelink är ett digitalt mäkleri för verksamhetsöverlåtelser — lokaler, inkråm och
                aktiebolag. Vi tar en fast avgift utan provision, granskar varje objekt noggrant innan
                publicering och håller köpare och säljare anonyma tills affären är klar. Allt signeras
                digitalt via Signicat och BankID. En trygg, strukturerad process från underlag till
                tillträde.
              </p>
              <div className="mt-4">
                <WireBtn to="/om-oss" variant="secondary">Läs mer om oss →</WireBtn>
              </div>
            </div>
            <div className="flex min-h-[180px] items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-xs text-muted-foreground">
              [ Bild · Om TreLink ]
            </div>
          </div>
        </WireBox>
      </div>

      {/* FAQ */}
      <div className="mt-12 mb-16">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Vanliga frågor</h2>
          <Link
            to="/faq"
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            Alla frågor →
          </Link>
        </div>
        <WireBox>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-b border-foreground/20 last:border-b-0"
              >
                <AccordionTrigger className="text-sm font-medium hover:no-underline hover:text-foreground">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </WireBox>
      </div>
    </PublicLayout>
  );
}
