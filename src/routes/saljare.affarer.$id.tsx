import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { getBuyerInterest, statusLabel } from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { getAccountByUserId, getSession } from "@/lib/mock-auth";
import {
  annonsInfo,
  getDeal,
  signeraKopeavtal,
  signeraOverenskommelse,
  Progress,
} from "@/lib/affar-workflow";
import { SignicatFlow } from "@/components/SignicatFlow";
import { KopeavtalDokument } from "@/components/KopeavtalDokument";
import { OverenskommelseDokument } from "@/components/OverenskommelseDokument";

export const Route = createFileRoute("/saljare/affarer/$id")({
  component: SellerCaseDetail,
});

const ONBOARDING_SALJARE_KEY = "trelink-onboarding-saljare-uppgifter";

function readSaljareBolag(userId?: string): string | undefined {
  if (!userId) return undefined;
  try {
    const raw = localStorage.getItem(`${ONBOARDING_SALJARE_KEY}:${userId}`);
    return raw ? JSON.parse(raw).bolagsuppgifter?.bolag : undefined;
  } catch {
    return undefined;
  }
}

function SellerCaseDetail() {
  const { id } = Route.useParams();
  const [, forceRerender] = useState(0);
  const refresh = () => forceRerender((n) => n + 1);
  const [signOpen, setSignOpen] = useState<"kopeavtal" | "overenskommelse" | null>(null);

  const interest = getBuyerInterest(id);
  const annons = interest ? getAnnons(interest.annonsId) : undefined;

  if (!interest || annons?.agarUserId !== getSession()?.userId) {
    return (
      <AppLayout mode="saljare">
        <PageHeader eyebrow="Säljarläge" title="Ärendet hittades inte" />
        <Link to="/saljare/affarer">
          <WireBtn variant="secondary">← Till mina affärer</WireBtn>
        </Link>
      </AppLayout>
    );
  }

  const annonsTitel = annons?.titel ?? `Annons #${interest.annonsId}`;
  const deal = getDeal(id);
  const info = annonsInfo(interest.annonsId);
  const buyerAccount = getAccountByUserId(interest.userId);
  const kopareBolag = buyerAccount?.profil?.bolag;
  const kopareOrgnr = buyerAccount?.profil?.orgnr;
  const saljareBolag = readSaljareBolag(annons?.agarUserId ?? getSession()?.userId);

  return (
    <AppLayout mode="saljare">
      <Link
        to="/saljare/affarer"
        className="mb-4 inline-block text-xs text-muted-foreground hover:underline"
      >
        ← Tillbaka till mina affärer
      </Link>

      <PageHeader eyebrow={`Säljarläge · ärende ${interest.kKod}`} title={annonsTitel} />

      <WireBox label="Status" className="mb-6">
        <WireTag>{statusLabel[interest.status]}</WireTag>
      </WireBox>

      {interest.status === "vill-ga-vidare" && !deal.avvisad && (
        <WireBox className="mb-6">
          <Progress steg={deal.steg} />
        </WireBox>
      )}

      {deal.avvisad && (
        <WireBox label="Affären avslutad" className="mb-6">
          <Annotation>
            <span className="mt-2 block">
              Hyresvärden nekade överlåtelsen. Affären är avslutad och din annons är åter publik.
            </span>
          </Annotation>
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !deal.avvisad && deal.steg === "matchad" && (
        <WireBox label="Köpeavtal" className="mb-6">
          {!deal.kopeavtal?.skickadAt ? (
            <Annotation>
              TreLink upprättar köpeavtalet. Du får besked här när det är dags att signera.
            </Annotation>
          ) : !deal.kopeavtal.signerat.saljare ? (
            <>
              <Annotation>Köpeavtalet är klart för signering.</Annotation>
              <WireBtn className="mt-4" onClick={() => setSignOpen("kopeavtal")}>
                Signera köpeavtal →
              </WireBtn>
            </>
          ) : (
            <Annotation>
              <span className="mt-2 block">Du har signerat. Väntar på att köparen signerar.</span>
            </Annotation>
          )}
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !deal.avvisad && deal.steg === "handpenning" && (
        <WireBox label="Handpenning" className="mb-6">
          <Annotation>
            <span className="mt-2 block">
              Väntar på att köparen betalar handpenningen och att TreLink bekräftar mottagandet.
            </span>
          </Annotation>
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !deal.avvisad && deal.steg === "hyresvard" && (
        <WireBox label="Hyresvärd" className="mb-6">
          <Annotation>
            <span className="mt-2 block">
              TreLink har skickat underlaget till hyresvärden. Väntar på svar.
            </span>
          </Annotation>
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !deal.avvisad && deal.steg === "signering" && (
        <WireBox label="Överenskommelse om överlåtelse" className="mb-6">
          {!deal.overenskommelse?.skickadAt ? (
            <Annotation>
              Hyresvärden har godkänt. TreLink upprättar överenskommelsen om överlåtelse.
            </Annotation>
          ) : !deal.overenskommelse.signerat.saljare ? (
            <>
              <Annotation>Överenskommelsen är klar för signering.</Annotation>
              <WireBtn className="mt-4" onClick={() => setSignOpen("overenskommelse")}>
                Signera överenskommelse →
              </WireBtn>
            </>
          ) : (
            <Annotation>
              <span className="mt-2 block">Du har signerat. Väntar på att köparen signerar.</span>
            </Annotation>
          )}
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !deal.avvisad && deal.steg === "tilltrade" && (
        <WireBox label="Tillträde" className="mb-6">
          <Annotation>
            <span className="mt-2 block">
              Överenskommelsen är signerad av alla parter. TreLink bekräftar tillträdet inom kort.
            </span>
          </Annotation>
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !deal.avvisad && deal.steg === "klar" && (
        <WireBox label="Klar" className="mb-6">
          <Annotation>
            <span className="mt-2 block">Affären är genomförd. Grattis!</span>
          </Annotation>
        </WireBox>
      )}

      <WireBox label="Ärendehistorik · synlig för dig & TreLink">
        <ul className="mt-1 space-y-3">
          {(interest.timeline ?? []).map((l, i) => (
            <li key={i} className="border-l-2 border-foreground/20 pl-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {new Date(l.ts).toLocaleString("sv-SE")} · {l.vem}
              </div>
              <div className="text-sm">{l.text}</div>
            </li>
          ))}
        </ul>
      </WireBox>

      <SignicatFlow
        open={signOpen === "kopeavtal"}
        seller={{ bolag: saljareBolag }}
        docTitle="Köpeavtal"
        doneHeading="Köpeavtalet är signerat"
        signerandePart={saljareBolag}
        renderDoc={() => (
          <KopeavtalDokument
            saljareBolag={saljareBolag}
            kopareBolag={kopareBolag}
            kopareOrgnr={kopareOrgnr}
            verksamhet={annons?.draft?.verksamhet}
            adress={annons?.draft?.adress}
            ort={info.ort}
            pris={info.pris}
          />
        )}
        onCancel={() => setSignOpen(null)}
        onSigned={() => {
          signeraKopeavtal(id, "saljare");
          setSignOpen(null);
          refresh();
        }}
      />

      <SignicatFlow
        open={signOpen === "overenskommelse"}
        seller={{ bolag: saljareBolag }}
        docTitle="Överenskommelse om överlåtelse"
        doneHeading="Överenskommelsen är signerad"
        signerandePart={saljareBolag}
        renderDoc={() => (
          <OverenskommelseDokument
            saljareBolag={saljareBolag}
            kopareBolag={kopareBolag}
            verksamhet={annons?.draft?.verksamhet}
            adress={annons?.draft?.adress}
            ort={info.ort}
            pris={info.pris}
          />
        )}
        onCancel={() => setSignOpen(null)}
        onSigned={() => {
          signeraOverenskommelse(id, "saljare");
          setSignOpen(null);
          refresh();
        }}
      />
    </AppLayout>
  );
}
