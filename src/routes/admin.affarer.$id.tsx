import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { getBuyerInterest, statusLabel } from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { getAccountByUserId } from "@/lib/mock-auth";
import {
  annonsInfo,
  getDeal,
  matchaAffar,
  skapaKopeavtal,
  skickaKopeavtalForSignering,
  bekraftaHandpenningMottagen,
  skickaTillHyresvard,
  hyresvardBesked,
  skapaOverenskommelse,
  skickaOverenskommelseForSignering,
  bekraftaTilltrade,
  Progress,
} from "@/lib/affar-workflow";
import { KopeavtalDokument } from "@/components/KopeavtalDokument";
import { OverenskommelseDokument } from "@/components/OverenskommelseDokument";
import { MailPreview, type MailData } from "@/components/MailPreview";

export const Route = createFileRoute("/admin/affarer/$id")({
  component: AdminAffarDetail,
});

const ONBOARDING_SALJARE_KEY = "trelink-onboarding-saljare-uppgifter";

function readOnboardingSaljare(userId?: string): { bolag: string; orgnr: string } | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${ONBOARDING_SALJARE_KEY}:${userId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return { bolag: data.bolagsuppgifter?.bolag, orgnr: data.bolagsuppgifter?.orgnr };
  } catch {
    return null;
  }
}

function useAffarData(id: string) {
  const interest = getBuyerInterest(id);
  const annons = interest ? getAnnons(interest.annonsId) : undefined;
  const deal = getDeal(id);
  const buyerAccount = getAccountByUserId(interest?.userId);
  const seller = readOnboardingSaljare(annons?.agarUserId);
  const info = interest ? annonsInfo(interest.annonsId) : null;
  return { interest, annons, deal, buyerAccount, seller, info };
}

function SignStatus({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-foreground/10 py-1.5 text-sm">
      <span>{label}</span>
      <WireTag active={done}>{done ? "Signerat" : "Väntar"}</WireTag>
    </div>
  );
}

function AdminAffarDetail() {
  const { id } = Route.useParams();
  const [, forceRerender] = useState(0);
  const refresh = () => forceRerender((n) => n + 1);

  const [kopeavtalPreviewOpen, setKopeavtalPreviewOpen] = useState(false);
  const [overenskommelsePreviewOpen, setOverenskommelsePreviewOpen] = useState(false);
  const [mailPreview, setMailPreview] = useState<MailData | null>(null);

  const { interest, annons, deal, buyerAccount, seller, info } = useAffarData(id);

  if (!interest || !info) {
    return (
      <AdminLayout>
        <PageHeader eyebrow="TreLink Admin" title="Affären hittades inte" />
        <Link to="/admin/affarer" className="text-sm text-muted-foreground underline">
          ← Tillbaka till Affärer/Uppdrag
        </Link>
      </AdminLayout>
    );
  }

  const kopareBolag = buyerAccount?.profil?.bolag;
  const kopareOrgnr = buyerAccount?.profil?.orgnr;
  const saljareBolag = seller?.bolag;
  const saljareOrgnr = seller?.orgnr;
  const verksamhet = annons?.draft?.verksamhet;
  const adress = annons?.draft?.adress;

  return (
    <AdminLayout>
      <Link
        to="/admin/affarer"
        className="mb-4 inline-block text-xs text-muted-foreground underline hover:text-foreground"
      >
        ← Tillbaka till Affärer/Uppdrag
      </Link>

      <PageHeader
        eyebrow={`Affär · ${interest.kKod}`}
        title={info.titel}
        subtitle={`${info.pris} kr · ${info.ort} · köpare ${statusLabel[interest.status]}`}
      />

      <WireBox className="mb-6">
        <Progress steg={deal.steg} />
      </WireBox>

      {deal.avvisad && (
        <WireBox label="Avslutad — nekad av hyresvärden" className="mb-6">
          <Annotation>
            <span className="mt-2 block">
              {annons
                ? "Hyresvärden nekade överlåtelsen. Handpenningen återbetalas (simulerat) och annonsen är åter publik."
                : "Hyresvärden nekade överlåtelsen. Handpenningen återbetalas (simulerat)."}
            </span>
          </Annotation>
        </WireBox>
      )}

      {!deal.avvisad && deal.steg === "granskning" && (
        <WireBox label="Matchning" className="mb-6">
          <Annotation>
            Köparen har uttryckt intresse. Bekräfta matchningen för att gå vidare med köpeavtalet.
          </Annotation>
          <WireBtn
            className="mt-4"
            onClick={() => {
              matchaAffar(id);
              refresh();
            }}
          >
            Matcha köpare →
          </WireBtn>
        </WireBox>
      )}

      {!deal.avvisad && deal.steg === "matchad" && (
        <WireBox label="Köpeavtal" className="mb-6">
          {!deal.kopeavtal ? (
            <>
              <Annotation>
                Upprätta köpeavtalet och skicka det till köpare och säljare för signering.
              </Annotation>
              <WireBtn className="mt-4" onClick={() => setKopeavtalPreviewOpen(true)}>
                Skapa köpeavtal →
              </WireBtn>
            </>
          ) : !deal.kopeavtal.skickadAt ? (
            <WireBtn
              onClick={() => {
                skickaKopeavtalForSignering(id);
                setMailPreview({
                  fran: "TreLink <noreply@trelink.se>",
                  till: `${kopareBolag || "Köparen"}, ${saljareBolag || "Säljaren"}`,
                  amne: "Köpeavtal redo för signering",
                  brodtext: `Köpeavtalet för ${info.titel} är klart för signering. Logga in på TreLink för att signera med BankID.`,
                });
                refresh();
              }}
            >
              Skicka till parterna →
            </WireBtn>
          ) : (
            <>
              <SignStatus label="Köparen har signerat" done={deal.kopeavtal.signerat.kopare} />
              <SignStatus label="Säljaren har signerat" done={deal.kopeavtal.signerat.saljare} />
              <Annotation>
                <span className="mt-2 block">
                  Väntar på signering i köparens och säljarens egna vyer.
                </span>
              </Annotation>
            </>
          )}
        </WireBox>
      )}

      {!deal.avvisad && deal.steg === "handpenning" && (
        <WireBox label="Handpenning" className="mb-6">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-b border-foreground/10 py-1.5 text-sm">
              <span>Kvittens handpenning</span>
              <WireTag active={!!deal.handpenning?.kvitto}>
                {deal.handpenning?.kvitto || "Ej uppladdad"}
              </WireTag>
            </div>
            <div className="flex items-center justify-between border-b border-foreground/10 py-1.5 text-sm">
              <span>UC-utdrag</span>
              <WireTag active={!!deal.handpenning?.ucUtdrag}>
                {deal.handpenning?.ucUtdrag || "Ej uppladdat"}
              </WireTag>
            </div>
          </div>
          {deal.handpenning?.kvitto && deal.handpenning?.ucUtdrag ? (
            <WireBtn
              className="mt-4"
              onClick={() => {
                bekraftaHandpenningMottagen(id, interest.annonsId);
                refresh();
              }}
            >
              Handpenning mottagen →
            </WireBtn>
          ) : (
            <Annotation>
              <span className="mt-2 block">
                Väntar på att köparen laddar upp kvittens och UC-utdrag.
              </span>
            </Annotation>
          )}
        </WireBox>
      )}

      {!deal.avvisad && deal.steg === "hyresvard" && (
        <WireBox label="Hyresvärd" className="mb-6">
          {!deal.hyresvard?.skickadAt ? (
            <>
              <Annotation>Sammanställning att skicka till hyresvärden</Annotation>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between border-b border-foreground/10 py-1.5">
                  <span className="text-muted-foreground">Företagspresentation</span>
                  <span>{buyerAccount?.profil?.presentation || "—"}</span>
                </div>
                <div className="flex justify-between border-b border-foreground/10 py-1.5">
                  <span className="text-muted-foreground">Bolag</span>
                  <span>
                    {kopareBolag || "—"} {kopareOrgnr ? `(${kopareOrgnr})` : ""}
                  </span>
                </div>
                <div className="flex justify-between border-b border-foreground/10 py-1.5">
                  <span className="text-muted-foreground">UC-utdrag</span>
                  <span>{deal.handpenning?.ucUtdrag || "—"}</span>
                </div>
              </div>
              <WireBtn
                className="mt-4"
                onClick={() => {
                  skickaTillHyresvard(id);
                  setMailPreview({
                    fran: "TreLink <noreply@trelink.se>",
                    till: "Hyresvärd",
                    amne: `Överlåtelse av hyreskontrakt · ${info.titel}`,
                    brodtext: `TreLink förmedlar en överlåtelse av hyreskontraktet för ${info.titel}. Bifogat: företagspresentation, bolagsuppgifter och UC-utdrag för ny hyresgäst. Vänligen återkom med besked.`,
                  });
                  refresh();
                }}
              >
                Skicka till hyresvärd →
              </WireBtn>
            </>
          ) : !deal.hyresvard?.besked ? (
            <>
              <Annotation>Registrera hyresvärdens svar</Annotation>
              <div className="mt-4 flex flex-wrap gap-2">
                <WireBtn
                  onClick={() => {
                    hyresvardBesked(id, interest.annonsId, "godkand");
                    refresh();
                  }}
                >
                  Hyresvärd godkände
                </WireBtn>
                <WireBtn
                  variant="secondary"
                  onClick={() => {
                    hyresvardBesked(id, interest.annonsId, "nekad");
                    refresh();
                  }}
                >
                  Hyresvärd nekade
                </WireBtn>
              </div>
            </>
          ) : null}
        </WireBox>
      )}

      {!deal.avvisad && deal.steg === "signering" && (
        <WireBox label="Överenskommelse om överlåtelse" className="mb-6">
          {!deal.overenskommelse ? (
            <>
              <Annotation>
                Hyresvärden har godkänt. Upprätta överenskommelsen och skicka den till samtliga
                parter.
              </Annotation>
              <WireBtn className="mt-4" onClick={() => setOverenskommelsePreviewOpen(true)}>
                Skapa överenskommelse →
              </WireBtn>
            </>
          ) : !deal.overenskommelse.skickadAt ? (
            <WireBtn
              onClick={() => {
                skickaOverenskommelseForSignering(id);
                setMailPreview({
                  fran: "TreLink <noreply@trelink.se>",
                  till: `${kopareBolag || "Köparen"}, ${saljareBolag || "Säljaren"}`,
                  amne: "Överenskommelse om överlåtelse redo för signering",
                  brodtext: `Överenskommelsen om överlåtelse för ${info.titel} är klar för signering. Logga in på TreLink för att signera med BankID.`,
                });
                refresh();
              }}
            >
              Skicka till parterna →
            </WireBtn>
          ) : (
            <>
              <SignStatus
                label="Köparen har signerat"
                done={deal.overenskommelse.signerat.kopare}
              />
              <SignStatus
                label="Säljaren har signerat"
                done={deal.overenskommelse.signerat.saljare}
              />
              <Annotation>
                <span className="mt-2 block">
                  Väntar på signering i köparens och säljarens egna vyer.
                </span>
              </Annotation>
            </>
          )}
        </WireBox>
      )}

      {!deal.avvisad && deal.steg === "tilltrade" && (
        <WireBox label="Tillträde" className="mb-6">
          <Annotation>
            Överenskommelsen är signerad av samtliga parter. Bekräfta tillträdet för att avsluta
            affären.
          </Annotation>
          <WireBtn
            className="mt-4"
            onClick={() => {
              bekraftaTilltrade(id);
              refresh();
            }}
          >
            Bekräfta tillträde →
          </WireBtn>
        </WireBox>
      )}

      {!deal.avvisad && deal.steg === "klar" && (
        <WireBox label="Klar" className="mb-6">
          <Annotation>Affären är genomförd.</Annotation>
        </WireBox>
      )}

      {kopeavtalPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setKopeavtalPreviewOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-foreground bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-foreground/30 bg-background px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Förhandsgranskning · Köpeavtal
              </div>
              <WireBtn variant="ghost" onClick={() => setKopeavtalPreviewOpen(false)}>
                Stäng
              </WireBtn>
            </div>
            <div className="space-y-4 p-6">
              <WireTag active>✓ TreLink-signatur: Förifylld</WireTag>
              <KopeavtalDokument
                saljareBolag={saljareBolag}
                saljareOrgnr={saljareOrgnr}
                kopareBolag={kopareBolag}
                kopareOrgnr={kopareOrgnr}
                verksamhet={verksamhet}
                adress={adress}
                ort={info.ort}
                pris={info.pris}
              />
              <div className="flex flex-wrap justify-end gap-2 border-t border-foreground/10 pt-4">
                <WireBtn variant="ghost" onClick={() => setKopeavtalPreviewOpen(false)}>
                  Redigera
                </WireBtn>
                <WireBtn
                  onClick={() => {
                    skapaKopeavtal(id);
                    skickaKopeavtalForSignering(id);
                    setMailPreview({
                      fran: "TreLink <noreply@trelink.se>",
                      till: `${kopareBolag || "Köparen"}, ${saljareBolag || "Säljaren"}`,
                      amne: "Köpeavtal redo för signering",
                      brodtext: `Köpeavtalet för ${info.titel} är klart för signering. Logga in på TreLink för att signera med BankID.`,
                    });
                    setKopeavtalPreviewOpen(false);
                    refresh();
                  }}
                >
                  Skicka till parterna →
                </WireBtn>
              </div>
            </div>
          </div>
        </div>
      )}

      {overenskommelsePreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOverenskommelsePreviewOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-foreground bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-foreground/30 bg-background px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Förhandsgranskning · Överenskommelse om överlåtelse
              </div>
              <WireBtn variant="ghost" onClick={() => setOverenskommelsePreviewOpen(false)}>
                Stäng
              </WireBtn>
            </div>
            <div className="space-y-4 p-6">
              <WireTag active>✓ TreLink-signatur: Förifylld</WireTag>
              <OverenskommelseDokument
                saljareBolag={saljareBolag}
                kopareBolag={kopareBolag}
                verksamhet={verksamhet}
                adress={adress}
                ort={info.ort}
                pris={info.pris}
              />
              <div className="flex flex-wrap justify-end gap-2 border-t border-foreground/10 pt-4">
                <WireBtn variant="ghost" onClick={() => setOverenskommelsePreviewOpen(false)}>
                  Redigera
                </WireBtn>
                <WireBtn
                  onClick={() => {
                    skapaOverenskommelse(id);
                    skickaOverenskommelseForSignering(id);
                    setMailPreview({
                      fran: "TreLink <noreply@trelink.se>",
                      till: `${kopareBolag || "Köparen"}, ${saljareBolag || "Säljaren"}`,
                      amne: "Överenskommelse om överlåtelse redo för signering",
                      brodtext: `Överenskommelsen om överlåtelse för ${info.titel} är klar för signering. Logga in på TreLink för att signera med BankID.`,
                    });
                    setOverenskommelsePreviewOpen(false);
                    refresh();
                  }}
                >
                  Skicka till parterna →
                </WireBtn>
              </div>
            </div>
          </div>
        </div>
      )}

      <MailPreview open={!!mailPreview} mail={mailPreview} onClose={() => setMailPreview(null)} />
    </AdminLayout>
  );
}
