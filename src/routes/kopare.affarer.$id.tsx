import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { getBuyerInterest, statusLabel, statusHint } from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { getAccountByUserId, getSession } from "@/lib/mock-auth";
import {
  annonsInfo,
  getDeal,
  laddaUppForetagspresentation,
  laddaUppKycDokument,
  bekraftaFirmatecknare,
  laddaUppHandpenningKvitto,
  laddaUppUcUtdrag,
  signeraKopeavtal,
  signeraOverenskommelse,
  signeraHandpenningKvittens,
  Progress,
} from "@/lib/affar-workflow";
import { SignicatFlow } from "@/components/SignicatFlow";
import { KopeavtalDokument } from "@/components/KopeavtalDokument";
import { OverenskommelseDokument } from "@/components/OverenskommelseDokument";
import { HandpenningKvittensDokument } from "@/components/HandpenningKvittensDokument";
import { formatDatum, formatTelefon, isValidEmail } from "@/lib/format";

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
            aria-label={label}
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

function FtField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`h-11 w-full rounded-button border bg-card px-3 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 ${
          error
            ? "border-destructive focus:border-destructive focus:ring-destructive/40"
            : "border-foreground/15 focus:border-[var(--color-interactive)] focus:ring-[var(--color-focus-ring)]/40"
        }`}
      />
      {error && <span className="mt-1 block font-mono text-[10px] text-destructive">{error}</span>}
    </label>
  );
}

function ChecklistPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-sm ${
        ok
          ? "border-foreground/30 text-muted-foreground"
          : "border-amber-500/70 bg-amber-50/60 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500"
      }`}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{" "}
      {label}
    </span>
  );
}

function BuyerCaseDetail() {
  const { id } = Route.useParams();
  const [, forceRerender] = useState(0);
  const refresh = () => forceRerender((n) => n + 1);
  const [signOpen, setSignOpen] = useState<"kopeavtal" | "overenskommelse" | null>(null);

  const interest = getBuyerInterest(id);
  const deal = getDeal(id);

  const [arFirmatecknare, setArFirmatecknare] = useState<boolean | null>(
    deal.granskning?.firmatecknare ?? null,
  );
  const [ftRoll, setFtRoll] = useState(deal.granskning?.ftRoll ?? "");
  const [ftFornamn, setFtFornamn] = useState(deal.granskning?.ftFornamn ?? "");
  const [ftEfternamn, setFtEfternamn] = useState(deal.granskning?.ftEfternamn ?? "");
  const [ftMail, setFtMail] = useState(deal.granskning?.ftMail ?? "");
  const [ftMobil, setFtMobil] = useState(deal.granskning?.ftMobil ?? "");
  const [ftRollTouched, setFtRollTouched] = useState(false);
  const [ftFornamnTouched, setFtFornamnTouched] = useState(false);
  const [ftEfternamnTouched, setFtEfternamnTouched] = useState(false);
  const [ftMailTouched, setFtMailTouched] = useState(false);
  const [ftMobilTouched, setFtMobilTouched] = useState(false);
  const [ftSubmitAttempted, setFtSubmitAttempted] = useState(false);

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
  const info = annonsInfo(interest.annonsId);
  const buyerAccount = getAccountByUserId(getSession()?.userId);
  const kopareBolag = buyerAccount?.profil?.bolag;
  const kopareOrgnr = buyerAccount?.profil?.orgnr;
  const saljareBolag = readSaljareBolag(annons?.agarUserId);
  const avslutad = !!deal.avvisad || !!deal.avvisadAvTrelink;

  const kycOk = !!deal.granskning?.kycDokument;
  const firmatecknareOk =
    deal.granskning?.firmatecknare === true ||
    (deal.granskning?.firmatecknare === false &&
      !!deal.granskning?.ftRoll &&
      !!deal.granskning?.ftFornamn &&
      !!deal.granskning?.ftEfternamn &&
      !!deal.granskning?.ftMail &&
      !!deal.granskning?.ftMobil);
  const foretagspresentationOk = !!deal.granskning?.foretagspresentation;

  const ftRollSaknas = arFirmatecknare === false && ftRoll.trim() === "";
  const ftFornamnSaknas = arFirmatecknare === false && ftFornamn.trim() === "";
  const ftEfternamnSaknas = arFirmatecknare === false && ftEfternamn.trim() === "";
  const ftMailSaknas = arFirmatecknare === false && ftMail.trim() === "";
  const ftMailFelFormat = !ftMailSaknas && ftMail.trim() !== "" && !isValidEmail(ftMail);
  const ftMobilSaknas = arFirmatecknare === false && ftMobil.trim() === "";
  const ftRollError =
    (ftRollTouched || ftSubmitAttempted) && ftRollSaknas ? "Roll krävs." : undefined;
  const ftFornamnError =
    (ftFornamnTouched || ftSubmitAttempted) && ftFornamnSaknas ? "Förnamn krävs." : undefined;
  const ftEfternamnError =
    (ftEfternamnTouched || ftSubmitAttempted) && ftEfternamnSaknas ? "Efternamn krävs." : undefined;
  const ftMailError =
    ftMailTouched || ftSubmitAttempted
      ? ftMailSaknas
        ? "Mail krävs."
        : ftMailFelFormat
          ? "Ogiltig mailadress."
          : undefined
      : undefined;
  const ftMobilError =
    (ftMobilTouched || ftSubmitAttempted) && ftMobilSaknas ? "Mobilnummer krävs." : undefined;
  const kanSparaFirmatecknare =
    arFirmatecknare === true ||
    (arFirmatecknare === false &&
      !ftRollSaknas &&
      !ftFornamnSaknas &&
      !ftEfternamnSaknas &&
      !ftMailSaknas &&
      !ftMailFelFormat &&
      !ftMobilSaknas);

  const submitFirmatecknare = () => {
    setFtSubmitAttempted(true);
    if (arFirmatecknare === null || !kanSparaFirmatecknare) return;
    bekraftaFirmatecknare(
      id,
      arFirmatecknare
        ? { firmatecknare: true }
        : { firmatecknare: false, ftRoll, ftFornamn, ftEfternamn, ftMail, ftMobil },
    );
    setFtSubmitAttempted(false);
    refresh();
  };

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

      {interest.status === "vill-ga-vidare" && !avslutad && (
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

      {deal.avvisadAvTrelink && (
        <WireBox label="Affären avslutad" className="mb-6">
          <Annotation>
            <span className="mt-2 block">TreLink valde en annan köpare för det här objektet.</span>
          </Annotation>
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !avslutad && deal.steg === "granskning" && (
        <WireBox label="Granskning" className="mb-6">
          <Annotation>
            TreLink granskar de köpare som visat intresse för det här objektet. Ett KYC-dokument,
            firmatecknarens uppgifter och en företagspresentation hjälper TreLink att bedöma din
            förfrågan.
          </Annotation>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <ChecklistPill label="KYC-dokument" ok={kycOk} />
            <ChecklistPill label="Firmatecknare" ok={firmatecknareOk} />
            <ChecklistPill label="Företagspresentation" ok={foretagspresentationOk} />
          </div>

          {deal.granskning?.komplettering && (
            <div className="mt-4 border-l-2 border-amber-500/70 bg-amber-50/60 px-4 py-3 dark:bg-amber-500/5">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {formatDatum(deal.granskning.komplettering.at)} · TRELINK
              </div>
              <p className="mt-2 text-sm leading-relaxed">
                {deal.granskning.komplettering.message}
              </p>
            </div>
          )}

          <div className="mt-3">
            <FileUploadRow
              label="KYC-dokument"
              fileName={deal.granskning?.kycDokument}
              onUpload={(filnamn) => {
                laddaUppKycDokument(id, filnamn);
                refresh();
              }}
            />
            <FileUploadRow
              label="Företagspresentation"
              fileName={deal.granskning?.foretagspresentation}
              onUpload={(filnamn) => {
                laddaUppForetagspresentation(id, filnamn);
                refresh();
              }}
            />
          </div>

          <div className="mt-6 border-t border-foreground/10 pt-6">
            <Annotation>Är du firmatecknare för bolaget?</Annotation>
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="kopare-firmatecknare"
                  checked={arFirmatecknare === true}
                  onChange={() => setArFirmatecknare(true)}
                  className="h-4 w-4 accent-[var(--color-interactive)]"
                />
                Ja, jag är firmatecknare
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="kopare-firmatecknare"
                  checked={arFirmatecknare === false}
                  onChange={() => setArFirmatecknare(false)}
                  className="h-4 w-4 accent-[var(--color-interactive)]"
                />
                Nej, jag är inte firmatecknare
              </label>
            </div>

            {arFirmatecknare === false && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <FtField
                  label="Roll *"
                  value={ftRoll}
                  onChange={setFtRoll}
                  onBlur={() => setFtRollTouched(true)}
                  placeholder="VD / Styrelseordförande"
                  error={ftRollError}
                />
                <FtField
                  label="Förnamn *"
                  value={ftFornamn}
                  onChange={setFtFornamn}
                  onBlur={() => setFtFornamnTouched(true)}
                  placeholder="Förnamn"
                  error={ftFornamnError}
                />
                <FtField
                  label="Efternamn *"
                  value={ftEfternamn}
                  onChange={setFtEfternamn}
                  onBlur={() => setFtEfternamnTouched(true)}
                  placeholder="Efternamn"
                  error={ftEfternamnError}
                />
                <FtField
                  label="Mail *"
                  value={ftMail}
                  onChange={setFtMail}
                  onBlur={() => setFtMailTouched(true)}
                  placeholder="namn@exempel.se"
                  type="email"
                  error={ftMailError}
                />
                <FtField
                  label="Mobil *"
                  value={ftMobil}
                  onChange={(v) => setFtMobil(formatTelefon(v))}
                  onBlur={() => setFtMobilTouched(true)}
                  placeholder="076 12 345 67"
                  error={ftMobilError}
                />
              </div>
            )}

            {arFirmatecknare !== null && (
              <WireBtn className="mt-4" onClick={submitFirmatecknare}>
                Spara uppgifter →
              </WireBtn>
            )}
          </div>
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !avslutad && deal.steg === "matchad" && (
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

      {interest.status === "vill-ga-vidare" && !avslutad && deal.steg === "handpenning" && (
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
          {deal.handpenning?.kvitto &&
            deal.handpenning?.ucUtdrag &&
            !deal.handpenning?.kvittensSkickadAt && (
              <Annotation>
                <span className="mt-2 block">
                  Väntar på att TreLink bekräftar mottagen handpenning.
                </span>
              </Annotation>
            )}
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" &&
        !avslutad &&
        deal.steg === "handpenning" &&
        deal.handpenning?.kvittensSkickadAt && (
          <WireBox label="Kvittens handpenning" className="mb-6">
            {!deal.handpenning.kvittensSigneradAt ? (
              <>
                <Annotation>
                  TreLink har upprättat en kvittens för din handpenning. Signera den nedan.
                </Annotation>
                <div className="mt-3">
                  <HandpenningKvittensDokument
                    interestId={id}
                    annonsId={interest.annonsId}
                    titel={info.titel}
                    adress={annons?.draft?.adress}
                    ort={info.ort}
                    pris={info.pris}
                    kopareBolag={kopareBolag}
                  />
                </div>
                <WireBtn
                  className="mt-4"
                  onClick={() => {
                    if (!window.confirm("Signera kvittensen för handpenningen?")) return;
                    signeraHandpenningKvittens(id);
                    refresh();
                  }}
                >
                  Signera kvittens →
                </WireBtn>
              </>
            ) : (
              <Annotation>
                <span className="mt-2 block">
                  Du har signerat kvittensen. Den är skickad till säljaren.
                </span>
              </Annotation>
            )}
          </WireBox>
        )}

      {interest.status === "vill-ga-vidare" && !avslutad && deal.steg === "hyresvard" && (
        <WireBox label="Hyresvärd" className="mb-6">
          <Annotation>
            <span className="mt-2 block">
              TreLink har skickat underlaget till hyresvärden. Väntar på svar.
            </span>
          </Annotation>
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !avslutad && deal.steg === "signering" && (
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

      {interest.status === "vill-ga-vidare" && !avslutad && deal.steg === "tilltrade" && (
        <WireBox label="Tillträde" className="mb-6">
          <Annotation>
            <span className="mt-2 block">
              Överenskommelsen är signerad av alla parter. TreLink bekräftar tillträdet inom kort.
            </span>
          </Annotation>
        </WireBox>
      )}

      {interest.status === "vill-ga-vidare" && !avslutad && deal.steg === "klar" && (
        <WireBox label="Klar" className="mb-6">
          <Annotation>
            <span className="mt-2 block">Affären är genomförd. Grattis!</span>
          </Annotation>
        </WireBox>
      )}

      <WireBox label="Ärendehistorik">
        <ul className="mt-1 space-y-3">
          {(interest.timeline ?? []).map((l, i) => (
            <li key={i} className="border-l-2 border-foreground/20 pl-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {formatDatum(l.ts)} · {l.vem}
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
