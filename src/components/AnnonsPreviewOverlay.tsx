import { useEffect } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { WireBox, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";

type Item = {
  id: string;
  titel: string;
  cat?: string;
  pris?: string;
  draft?: Record<string, any>;
};

const draftText =
  "Välskött café med etablerad kundkrets i centrala Stockholm. Fullt utrustad lokal med kök, serveringsdisk och 30 sittplatser. Inkråm inkluderar inventarier, varumärke och befintliga leverantörsavtal. Tillträde enligt överenskommelse.";

const disabledTip = "Ej tillgänglig i förhandsgranskning";

export function AnnonsPreviewOverlay({
  open,
  item,
  onClose,
  onFeedback,
  onApprove,
}: {
  open: boolean;
  item: Item;
  onClose: () => void;
  onFeedback: () => void;
  onApprove: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const d = item.draft ?? {};
  const ort = d.ort || "Stockholm";
  const stadsdel = d.stadsdel || d.omrade || "";
  const kategori = item.cat || "Överlåtelse";
  const price = item.pris || "Pris på förfrågan";

  const nyckeltal: [string, string][] = [
    ["Omsättning", d.omsattning || "—"],
    ["Resultat", d.resultat || "—"],
    ["Hyra/mån", d.hyra || "—"],
    ["Anställda", d.anstallda || "—"],
    ["Yta", d.yta ? `${d.yta} m²` : "—"],
    ["Verksamhet", d.verksamhet || "—"],
  ];

  const dokument: string[] = Array.isArray(d.dokument) && d.dokument.length
    ? d.dokument.map((x: any) => (typeof x === "string" ? x : x?.namn || "Dokument.pdf"))
    : ["Hyreskontrakt.pdf", "Resultaträkning 2024.pdf", "Inventarielista.pdf"];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background px-6 py-3"
        style={{ borderColor: "#E7E5E4" }}
      >
        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Tillbaka till granskning
        </button>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Förhandsgranskning · så här ser köparen din annons
        </div>
        <div className="flex items-center gap-2">
          <WireBtn variant="secondary" onClick={onFeedback}>Lämna feedback</WireBtn>
          <WireBtn onClick={onApprove}>Godkänn annonstexten</WireBtn>
        </div>
      </div>

      {/* Scrollable preview */}
      <div className="relative flex-1 overflow-y-auto">
        {/* Watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-30deg, transparent 0 120px, rgba(0,0,0,0.001) 120px 121px)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-30deg, transparent 0 240px, transparent 240px 480px)",
            }}
          />
          <div
            className="absolute inset-0 flex flex-wrap items-start gap-x-24 gap-y-24 overflow-hidden p-10"
            style={{
              transform: "rotate(-24deg)",
              transformOrigin: "top left",
              color: "rgba(0,0,0,0.04)",
              fontSize: 18,
              fontWeight: 300,
              letterSpacing: "0.1em",
              userSelect: "none",
            }}
          >
            {Array.from({ length: 120 }).map((_, i) => (
              <span key={i} className="whitespace-nowrap">FÖRHANDSGRANSKNING — EJ PUBLICERAD</span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto max-w-[1160px] px-10 py-10">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span>← Tillbaka till sök</span>
            <span>·</span>
            <span>Annons #{item.id}</span>
          </div>

          {/* Meta row */}
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {[kategori, ort, stadsdel].filter(Boolean).join(" · ")}
          </div>

          {/* Heading */}
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{item.titel}</h1>

          {/* Description */}
          <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{draftText}</p>

          {/* Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <WireTag><CheckCircle2 className="inline-block h-3 w-3 mr-1 align-middle" />Granskad av Trelink</WireTag>
            {item.draft?.premium && (
              <span className="inline-flex items-center border border-[var(--color-primary)] bg-[var(--color-primary)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
                Premium
              </span>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left */}
            <div className="space-y-6 lg:col-span-2">
              {/* Images 2x2 */}
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center rounded-card border border-foreground/15 bg-muted/20 text-xs text-muted-foreground"
                    style={{ height: 150 }}
                  >
                    [ Bild {i} ]
                  </div>
                ))}
              </div>

              <WireBox label="Vad Trelink har verifierat" variant="dashed">
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
                    TRELINK STÅR SOM MELLANHAND. INGA UPPGIFTER BYTS MELLAN PARTER FÖRRÄN HANDPENNING ÄR INNE.
                  </span>
                </Annotation>
              </WireBox>

              <WireBox label="Nyckeltal">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {nyckeltal.map(([k, v]) => (
                    <div key={k}>
                      <Annotation>{k}</Annotation>
                      <div className="mt-1 font-mono text-lg">{v}</div>
                    </div>
                  ))}
                </div>
              </WireBox>

              <WireBox label="Dokument — granskade av Trelink" variant="dashed">
                <ul className="space-y-2 text-sm">
                  {dokument.map((namn) => (
                    <li
                      key={namn}
                      className="flex items-center justify-between border-b border-foreground/10 py-2"
                    >
                      <span>▤ {namn}</span>
                      <div className="flex items-center gap-2">
                        <WireTag>Godkänt</WireTag>
                        <span className="text-xs text-muted-foreground">Förhandsvisa efter intresseanmälan</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </WireBox>
            </div>

            {/* Right */}
            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" style={{ width: "100%", maxWidth: 320 }}>
              <WireBox label="Pris">
                <div className="font-mono text-3xl">{price}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Annotation>Handpenning</Annotation>
                    <p className="mt-1 font-mono">~ 10% av köpeskillingen</p>
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
                    ["2", "Trelink matchar dig med säljaren"],
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
                  <button
                    type="button"
                    title={disabledTip}
                    onClick={(e) => e.preventDefault()}
                    className="cursor-not-allowed rounded-button border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-2 text-sm text-white opacity-40"
                  >
                    Anmäl intresse →
                  </button>
                  <button
                    type="button"
                    title={disabledTip}
                    onClick={(e) => e.preventDefault()}
                    className="cursor-not-allowed rounded-button border border-foreground/15 bg-background px-4 py-2 text-sm opacity-40"
                  >
                    <Star className="inline-block h-4 w-4 mr-1" /> Spara som favorit
                  </button>
                </div>
                <Annotation>
                  <span className="mt-3 block">
                    INGA KONTAKTUPPGIFTER BYTS. TRELINK NÅR DIG PÅ MEJL INOM 24 H.
                  </span>
                </Annotation>
              </WireBox>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
