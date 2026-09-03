import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { getBuyerInterest, statusLabel, statusHint } from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { getAccountByUserId, getSession } from "@/lib/mock-auth";
import {
  annonsInfo,
  getDeal,
  laddaUppHandpenningKvitto,
  laddaUppUcUtdrag,
  signeraKopeavtal,
  signeraOverenskommelse,
  Progress,
} from "@/lib/affar-workflow";
import { SignicatFlow } from "@/components/SignicatFlow";
import { KopeavtalDokument } from "@/components/KopeavtalDokument";
import { OverenskommelseDokument } from "@/components/OverenskommelseDokument";

export const Route = createFileRoute("/kopare/affarer/$id")({
  component: BuyerCaseDetail,
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

function FileUploadRow({
  label,
  fileName,
  onUpload,
}: {
  label: string;
  fileName?: string;
  onUpload: (filnamn: string) => void;
}) {
  return (
    <div className="border-b border-foreground/10 py-2">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {fileName ? (
        <div className="flex h-11 items-center gap-2 rounded-button border border-foreground/15 bg-card px-3 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{fileName}</span>
        </div>
      ) : (
        <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-button border border-foreground/15 bg-card px-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-foreground/40">
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file.name);
            }}
          />
          <Upload className="h-4 w-4" />
          Ladda upp fil
        </label>
      )}
    </div>
  );
}

function BuyerCaseDetail() {
  const { id } = Route.useParams();
  const [, forceRerender] = useState(0);
  const refresh = () => forceRerender((n) => n + 1);
  const [signOpen, setSignOpen] = useState<"kopeavtal" | "overenskommelse" | null>(null);

  const interest = getBuyerInterest(id);

  if (!interest || interest.userId !== getSession()?.userId) {
    return (
      <AppLayout mode="kopare">
        <PageHeader eyebrow="Köparläge" title="Ärendet hittades inte" />
        <Link to="/kopare/affarer">
          <WireBtn variant="secondary">← Till mina affärer</WireBtn>
        </Link>
      </AppLayout>
    );
  }

  const annons = getAnnons(interest.annonsId);
  const annonsTitel = annons?.titel ?? `Annons #${interest.annonsId}`;
  const deal = getDeal(id);
  const info = annonsInfo(interest.annonsId);
  const buyerAccount = getAccountByUserId(getSession()?.userId);
  const kopareBolag = buyerAccount?.profil?.bolag;
  const kopareOrgnr = buyerAccount?.profil?.orgnr;
  const saljareBolag = readSaljareBolag(annons?.agarUserId);

  return (
    <AppLayout mode="kopare">
      <Link
        to="/kopare/affarer"
        className="mb-4 inline-block text-xs text-muted-foreground hover:underline"
      >
        ← Tillbaka till mina affärer
      </Link>

      <PageHeader eyebrow={`Köparläge · ärende ${interest.kKod}`} title={annonsTitel} />

      <WireBox label="Status" className="mb-6">
        <WireTag>{statusLabel[interest.status]}</WireTag>
        <Annotation>
          <span className="mt-2 block">{statusHint[interest.status]}</span>
        </Annotation>
        {interest.status === "väntar-pdf" && (
          <WireBtn to="/annons/$id/underlag" params={{ id: interest.annonsId }} className="mt-4">
            Öppna underlaget →
          </WireBtn>
        )}
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
              Hyresvärden nekade överlåtelsen. Din handpenning återbetalas (simulerat).
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
          ) : !deal.kopeavtal.signerat.kopare ? (
            <>
              <Annotation>Köpeavtalet är klart för signering.</Annotation>
              <WireBtn className="mt-4" onClick={() => setSignOpen("kopeavtal")}>
                Signera köpeavtal →
              </WireBtn>
            </>
          ) : (
            <Annotation>
              <span className="mt-2 block">Du har signerat. Väntar på att säljaren signerar.</span>
            </Annotation>
          )}
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !deal.avvisad && deal.steg === "handpenning" && (
        <WireBox label="Handpenning" className="mb-6">
          <Annotation>
            Betala handpenningen till TreLinks klientmedelskonto och ladda upp kvittens samt ditt
            UC-utdrag som underlag för hyresvärdens godkännande.
          </Annotation>
          <div className="mt-3">
            <FileUploadRow
              label="Kvittens handpenning"
              fileName={deal.handpenning?.kvitto}
              onUpload={(filnamn) => {
                laddaUppHandpenningKvitto(id, filnamn);
                refresh();
              }}
            />
            <FileUploadRow
              label="UC-utdrag (ditt eget, ej TreLink-kontroll)"
              fileName={deal.handpenning?.ucUtdrag}
              onUpload={(filnamn) => {
                laddaUppUcUtdrag(id, filnamn);
                refresh();
              }}
            />
          </div>
          {deal.handpenning?.kvitto && deal.handpenning?.ucUtdrag && (
            <Annotation>
              <span className="mt-2 block">
                Väntar på att TreLink bekräftar mottagen handpenning.
              </span>
            </Annotation>
          )}
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
          ) : !deal.overenskommelse.signerat.kopare ? (
            <>
              <Annotation>Överenskommelsen är klar för signering.</Annotation>
              <WireBtn className="mt-4" onClick={() => setSignOpen("overenskommelse")}>
                Signera överenskommelse →
              </WireBtn>
            </>
          ) : (
            <Annotation>
              <span className="mt-2 block">Du har signerat. Väntar på att säljaren signerar.</span>
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
        signerandePart={kopareBolag}
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
          signeraKopeavtal(id, "kopare");
          setSignOpen(null);
          refresh();
        }}
      />

      <SignicatFlow
        open={signOpen === "overenskommelse"}
        seller={{ bolag: saljareBolag }}
        docTitle="Överenskommelse om överlåtelse"
        doneHeading="Överenskommelsen är signerad"
        signerandePart={kopareBolag}
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
          signeraOverenskommelse(id, "kopare");
          setSignOpen(null);
          refresh();
        }}
      />
    </AppLayout>
  );
}
