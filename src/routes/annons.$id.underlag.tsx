import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, WireBtn, Annotation, PageHeader } from "@/components/wire";
import { useIsAuthed } from "@/hooks/use-session";
import { readBuyerInterests, patchBuyerInterest, logBuyerEntry, type BuyerInterest } from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { addNotis } from "@/lib/admin-notiser";
import { getSession, getAccountByUserId } from "@/lib/mock-auth";
import { godkandaDokument, DEMO_DOKUMENT } from "./annons.$id.index";

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

  const annonsItem = getAnnons(interest.annonsId) as any;
  const godkanda = godkandaDokument(annonsItem?.draft?.docs);
  const dokument = godkanda.length ? godkanda : DEMO_DOKUMENT;

  const besluta = (status: "vill-ga-vidare" | "avböjt") => {
    const beslutText = status === "vill-ga-vidare" ? "Vill köpa objektet" : "Avvisade objektet";
    patchBuyerInterest(interest.id, (item) =>
      logBuyerEntry({ ...item, status, beslutAt: new Date().toISOString() }, "Köpare", beslutText),
    );
    setInterest((prev) =>
      prev ? logBuyerEntry({ ...prev, status, beslutAt: new Date().toISOString() }, "Köpare", beslutText) : prev,
    );
    if (status === "vill-ga-vidare") {
      const annonsTitel = getAnnons(interest.annonsId)?.titel || `Annons #${interest.annonsId}`;
      addNotis(
        "kopare",
        `${interest.kKod} vill köpa "${annonsTitel}" — redo för matchning`,
        "/admin/kopare",
      );
    }
  };

  // Köp kräver bolagsuppgifter (TreLink upprättar avtal mot ett bolag). Saknas de
  // skickas köparen till sin profil för att fylla i dem — intresset ligger kvar som
  // "väntar-pdf" (dvs bland de intresserade objekten) tills köpet kan slutföras.
  // Samma gate som annons.$id.index.tsx's handleKop, så beteendet är identiskt
  // oavsett vilken sida köparen köper från.
  const handleKop = () => {
    const session = getSession();
    const bolag = getAccountByUserId(session?.userId)?.profil?.bolag;
    if (!bolag) {
      patchBuyerInterest(interest.id, (item) =>
        logBuyerEntry({ ...item }, "Köpare", "Försökte köpa — väntar på bolagsuppgifter"),
      );
      nav({ to: "/kopare/profil", search: { next: `/annons/${id}/underlag` } });
      return;
    }
    besluta("vill-ga-vidare");
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
              const pdfOppnadAt = new Date().toISOString();
              patchBuyerInterest(interest.id, (item) =>
                logBuyerEntry({ ...item, pdfOppnadAt }, "Köpare", "Öppnade informationsmemorandumet"),
              );
              setInterest((prev) =>
                prev ? logBuyerEntry({ ...prev, pdfOppnadAt }, "Köpare", "Öppnade informationsmemorandumet") : prev,
              );
            }}
          >
            Öppna PDF →
          </WireBtn>
          {pdfOppnad && <Annotation>✓ Underlaget öppnat</Annotation>}
        </WireBox>

        <WireBox label="Dokument">
          <p className="text-sm text-muted-foreground">
            Din intresseanmälan är registrerad — dokumenten nedan är nu upplåsta.
          </p>
          <ul className="mt-3 divide-y divide-foreground/10 text-sm">
            {dokument.map((namn) => (
              <li key={namn} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {namn}
                </span>
                <WireBtn
                  variant="secondary"
                  onClick={() => {
                    window.open("about:blank", "_blank");
                    patchBuyerInterest(interest.id, (item) =>
                      logBuyerEntry({ ...item }, "Köpare", `Öppnade ${namn}`),
                    );
                  }}
                >
                  Öppna →
                </WireBtn>
              </li>
            ))}
          </ul>
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
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/30 bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-4 px-6 py-3">
            <p className="text-sm font-medium">Vad vill du göra härnäst?</p>
            <div className="flex flex-wrap items-center gap-3">
              <WireBtn variant="tertiary" to="/">
                Sök vidare
              </WireBtn>
              <WireBtn variant="secondary" onClick={() => besluta("avböjt")}>
                Avvisa
              </WireBtn>
              <WireBtn onClick={handleKop}>Köp →</WireBtn>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}

function getLatestInterestForAnnons(annonsId: string): BuyerInterest | undefined {
  const matches = readBuyerInterests(getSession()?.userId).filter((i) => i.annonsId === annonsId);
  return matches[matches.length - 1];
}
