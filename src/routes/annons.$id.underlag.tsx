import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, WireBtn, Annotation, PageHeader } from "@/components/wire";
import { useIsAuthed } from "@/hooks/use-session";
import { readBuyerInterests, patchBuyerInterest, logBuyerEntry, type BuyerInterest } from "@/lib/kopare-workflow";

export const Route = createFileRoute("/annons/$id/underlag")({
  component: UnderlagsGranskning,
});

function UnderlagsGranskning() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const isAuthed = useIsAuthed();

  useEffect(() => {
    if (isAuthed === false) {
      nav({ to: "/logga-in", search: { next: `/annons/${id}/underlag` } });
    }
  }, [isAuthed, id, nav]);

  const [interest, setInterest] = useState<BuyerInterest | undefined>(() =>
    getLatestInterestForAnnons(id),
  );
  const [pdfOppnad, setPdfOppnad] = useState(false);

  if (!interest) {
    return (
      <PublicLayout>
        <PageHeader eyebrow="Underlag" title="Ingen intresseanmälan hittad" />
        <WireBox variant="dashed">
          <Annotation>Du behöver skicka en intresseanmälan för denna annons först.</Annotation>
        </WireBox>
        <WireBtn to="/annons/$id" params={{ id }} className="mt-4">
          ← Till annonsen
        </WireBtn>
      </PublicLayout>
    );
  }

  const besluta = (status: "vill-ga-vidare" | "avböjt") => {
    const beslutText = status === "vill-ga-vidare" ? "Vill gå vidare och lägga bud" : "Avböjde köpet";
    patchBuyerInterest(interest.id, (item) =>
      logBuyerEntry({ ...item, status, beslutAt: new Date().toISOString() }, "Köpare", beslutText),
    );
    setInterest((prev) =>
      prev ? logBuyerEntry({ ...prev, status, beslutAt: new Date().toISOString() }, "Köpare", beslutText) : prev,
    );
  };

  return (
    <PublicLayout>
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/annons/$id" params={{ id }} className="hover:underline">
          ← Tillbaka till annonsen
        </Link>
      </div>

      <PageHeader
        eyebrow={`Annons #${id}`}
        title="Granska underlaget"
        subtitle="Läs igenom informationsmemorandumet innan du bestämmer dig."
      />

      <div className={`mx-auto max-w-2xl space-y-6 ${pdfOppnad && interest.status === "väntar-pdf" ? "pb-24" : ""}`}>
        <WireBox label="Informationsmemorandum">
          <p className="text-sm text-muted-foreground">
            Detaljerat underlag om verksamheten — ekonomi, avtal och nyckeltal.
          </p>
          <WireBtn
            className="mt-4"
            onClick={() => {
              window.open("about:blank", "_blank");
              setPdfOppnad(true);
              patchBuyerInterest(interest.id, (item) =>
                logBuyerEntry(item, "Köpare", "Öppnade informationsmemorandumet"),
              );
              setInterest((prev) =>
                prev ? logBuyerEntry(prev, "Köpare", "Öppnade informationsmemorandumet") : prev,
              );
            }}
          >
            Öppna PDF →
          </WireBtn>
          {pdfOppnad && <Annotation>✓ Underlaget öppnat</Annotation>}
        </WireBox>

        {interest.status === "vill-ga-vidare" && (
          <WireBox label="Intresse registrerat" variant="dashed">
            <p className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Din K-kod <span className="font-mono font-medium">{interest.kKod}</span> är
              registrerad. TreLink kontaktar dig när nästa steg är klart.
            </p>
            <WireBtn variant="secondary" to="/kopare/affarer/$id" params={{ id: interest.id }} className="mt-4">
              Följ ärendet →
            </WireBtn>
          </WireBox>
        )}

        {interest.status === "avböjt" && (
          <WireBox label="Intresse avslutat" variant="dashed">
            <p className="text-sm text-muted-foreground">
              Ditt intresse för denna annons har avslutats. Tack för att du tittade!
            </p>
            <WireBtn variant="secondary" to="/kopare/affarer/$id" params={{ id: interest.id }} className="mt-4">
              Följ ärendet →
            </WireBtn>
          </WireBox>
        )}

        <Annotation>
          K-koden ({interest.kKod}) är den identifierare TreLink/säljaren ser — ditt namn visas
          aldrig för säljaren i detta steg.
        </Annotation>
      </div>

      {pdfOppnad && interest.status === "väntar-pdf" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/30 bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-6 py-3">
            <p className="text-sm font-medium">Vill du gå vidare och lägga bud på objektet?</p>
            <div className="flex flex-wrap gap-3">
              <WireBtn onClick={() => besluta("vill-ga-vidare")}>Ja, jag vill lägga bud</WireBtn>
              <WireBtn variant="secondary" onClick={() => besluta("avböjt")}>
                Nej, avböj
              </WireBtn>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}

function getLatestInterestForAnnons(annonsId: string): BuyerInterest | undefined {
  const matches = readBuyerInterests().filter((i) => i.annonsId === annonsId);
  return matches[matches.length - 1];
}
