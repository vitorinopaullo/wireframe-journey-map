import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, CheckCircle2, AlertTriangle } from "lucide-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { getBuyerInterest, statusLabel } from "@/lib/kopare-workflow";
import {
  getAnnons,
  uppgraderaKategori,
  begarKomplettering as begarAnnonsKomplettering,
} from "@/lib/annons-workflow";
import { getAccountByUserId, upsertAdminAccount, devLoginAsAccount } from "@/lib/mock-auth";
import {
  annonsInfo,
  getDeal,
  matchaAffar,
  skapaKopeavtal,
  skickaKopeavtalForSignering,
  bekraftaHandpenningMottagen,
  skapaHandpenningKvittens,
  skickaHandpenningKvittensForSignering,
  skickaTillHyresvard,
  hyresvardBesked,
  begarLikvid,
  lamnaLikvid,
  verifieraLikvid,
  skapaLikvidKvittens,
  skickaLikvidKvittens,
  skapaOverenskommelse,
  skickaOverenskommelseForSignering,
  signeraOverenskommelse,
  bekraftaTilltrade,
  lyftArvode,
  bekraftaUtbetalning,
  granskningKandidater,
  begarKompletteringKop,
  avvisaKandidat,
  kanMatchaKandidat,
  devJumpToSteg,
  STEG_ORDNING,
  STEG_LABEL,
  Progress,
  type Steg,
} from "@/lib/affar-workflow";
import { SignicatFlow } from "@/components/SignicatFlow";
import { KopeavtalDokument } from "@/components/KopeavtalDokument";
import { OverenskommelseDokument } from "@/components/OverenskommelseDokument";
import { HandpenningKvittensDokument } from "@/components/HandpenningKvittensDokument";
import { LikvidKvittensDokument } from "@/components/LikvidKvittensDokument";
import { ArvodeKvittensDokument } from "@/components/ArvodeKvittensDokument";
import { formatDatum, beloppProcentAvPris, formatOrgnr, ORGNR_REGEX } from "@/lib/format";
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
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [, forceRerender] = useState(0);
  const refresh = () => forceRerender((n) => n + 1);

  const [kopeavtalPreviewOpen, setKopeavtalPreviewOpen] = useState(false);
  const [overenskommelsePreviewOpen, setOverenskommelsePreviewOpen] = useState(false);
  const [hyresvardSignOpen, setHyresvardSignOpen] = useState(false);
  const [handpenningKvittensPreviewOpen, setHandpenningKvittensPreviewOpen] = useState(false);
  const [likvidKvittensPreviewOpen, setLikvidKvittensPreviewOpen] = useState(false);
  const [arvodeKvittensPreviewOpen, setArvodeKvittensPreviewOpen] = useState(false);
  const [mailPreview, setMailPreview] = useState<MailData | null>(null);
  const [kompletteringOpen, setKompletteringOpen] = useState(false);
  const [kompletteringText, setKompletteringText] = useState("");
  const [devLoginMessage, setDevLoginMessage] = useState<string | null>(null);

  const { interest, annons, deal, buyerAccount, seller, info } = useAffarData(id);

  const [bolagVarde, setBolagVarde] = useState(buyerAccount?.profil?.bolag ?? "");
  const [orgnrVarde, setOrgnrVarde] = useState(buyerAccount?.profil?.orgnr ?? "");
  const [orgnrTouched, setOrgnrTouched] = useState(false);
  const orgnrFelFormat = orgnrVarde.trim() !== "" && !ORGNR_REGEX.test(orgnrVarde.trim());
  const orgnrError =
    orgnrTouched && orgnrFelFormat ? "Ogiltigt format. Ange som XXXXXX-XXXX." : undefined;

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

  // Dev-only genväg — hoppar in i köparens/säljarens session för testning
  // utan att behöva komma ihåg vilken mock-BankID som äger vad. Om kontot
  // inte finns (t.ex. en seedad demo-annons utan riktigt konto) visas ett
  // förklarande meddelande istället för att navigera till en tom sida.
  const devLoginAs = (
    userId: string | undefined,
    role: "kopare" | "saljare",
    target: "/kopare/affarer/$id" | "/saljare/affarer/$id",
    aktor: "köparen" | "säljaren",
  ) => {
    setDevLoginMessage(null);
    if (!userId || !devLoginAsAccount(userId, role)) {
      setDevLoginMessage(
        `Den här affären har inget riktigt inloggningsbart konto för ${aktor} (t.ex. en seedad demo-annons).`,
      );
      return;
    }
    navigate({ to: target, params: { id } });
  };

  const kopareBolag = buyerAccount?.profil?.bolag;
  const kopareOrgnr = buyerAccount?.profil?.orgnr;
  const saljareBolag = seller?.bolag;
  const saljareOrgnr = seller?.orgnr;
  const verksamhet = annons?.draft?.verksamhet;
  const adress = annons?.draft?.adress;
  // Vem som faktiskt signerar för köparens räkning — köparens egen
  // firmatecknare (BankID-namnet) eller den angivna fallback-kontakten från
  // granskningssteget (se GranskningState i affar-workflow.tsx).
  const undertecknareNamn =
    deal.granskning?.firmatecknare === true
      ? buyerAccount
        ? `${buyerAccount.bankid.fornamn} ${buyerAccount.bankid.efternamn}`
        : undefined
      : deal.granskning?.firmatecknare === false
        ? `${deal.granskning.ftFornamn ?? ""} ${deal.granskning.ftEfternamn ?? ""}`.trim() ||
          undefined
        : undefined;
  const undertecknareRoll =
    deal.granskning?.firmatecknare === true
      ? "Firmatecknare"
      : deal.granskning?.firmatecknare === false
        ? deal.granskning.ftRoll
        : undefined;
  // Andra köpare som fortfarande konkurrerar om samma annons i
  // granskningssteget — samma gruppering som listvyn (admin.affarer.index.tsx)
  // använder, så TreLink kan jämföra kandidater innan matchning.
  const ovrigaKandidater = granskningKandidater(interest.annonsId).filter(
    (k) => k.interestId !== id,
  );

  // avvisad = hyresvärden nekade; avvisadAvTrelink = TreLink valde en annan
  // kandidat i granskningen — två skilda, ömsesidigt uteslutande skäl till
  // att affären är avslutad (se STEG_LABEL/buildAvslutade i affar-workflow.tsx).
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
  // Ett bolag som inte finns kan inte ha en firmatecknare — när köparen
  // uppgett att den saknar bolag ersätts firmatecknare-kravet med att
  // bolaget är klart (bolagKlartAt satt), i checklistan och i matchnings-
  // spärren.
  const harBolagFalse = deal.granskning?.harBolag === false;
  const bolagKlartOk = !!deal.granskning?.bolagKlartAt;
  const granskningChecklist = [
    { label: "KYC-dokument uppladdat", ok: kycOk },
    harBolagFalse
      ? { label: "Bolag klart", ok: bolagKlartOk }
      : { label: "Firmatecknare bekräftad eller kontaktuppgifter ifyllda", ok: firmatecknareOk },
    { label: "Företagspresentation uppladdad", ok: foretagspresentationOk },
  ];
  const kanMatcha = kanMatchaKandidat(deal);

  const saveBolag = () => {
    if (!buyerAccount) return;
    upsertAdminAccount(buyerAccount.userId, {
      profil: { ...buyerAccount.profil, bolag: bolagVarde, orgnr: orgnrVarde },
    });
    refresh();
  };

  const uppgraderaTillAktie = () => {
    if (!annons) return;
    uppgraderaKategori(annons.id, "aktie");
    begarAnnonsKomplettering(
      annons.id,
      "Köparens bolag ändrades under processen — affären har uppgraderats till Aktieöverlåtelse. Vi behöver kompletterande underlag: registreringsbevis, bolagsordning, aktiebok och bolagspärm.",
    );
    refresh();
  };

  const submitKompletteringKop = () => {
    if (!kompletteringText.trim()) return;
    begarKompletteringKop(id, kompletteringText);
    setKompletteringText("");
    setKompletteringOpen(false);
    refresh();
  };

  const avvisaDennaKandidat = () => {
    if (!window.confirm("Avvisa den här kandidaten? Köparen ser affären som avslutad.")) return;
    avvisaKandidat(id);
    refresh();
  };

  const allabolagUrl = `https://www.allabolag.se/what/${encodeURIComponent(orgnrVarde || bolagVarde || "")}`;

  const forvantadLikvid = beloppProcentAvPris(info.pris, 90);
  const forvantadLikvidText = forvantadLikvid?.toLocaleString("sv-SE");
  const likvidBeloppMatchar = deal.likvid?.belopp === forvantadLikvid;

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

      {import.meta.env.DEV && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-card border border-foreground/10 bg-muted/20 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Dev · logga in som
          </span>
          <WireBtn
            variant="secondary"
            onClick={() => devLoginAs(interest.userId, "kopare", "/kopare/affarer/$id", "köparen")}
          >
            Logga in som köparen →
          </WireBtn>
          <WireBtn
            variant="secondary"
            onClick={() =>
              devLoginAs(annons?.agarUserId, "saljare", "/saljare/affarer/$id", "säljaren")
            }
          >
            Logga in som säljaren →
          </WireBtn>
          {devLoginMessage && (
            <span className="w-full text-xs text-destructive">{devLoginMessage}</span>
          )}
        </div>
      )}

      {import.meta.env.DEV && (
        <div className="mb-4 flex items-center gap-2 rounded-card border border-foreground/10 bg-muted/20 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Dev · hoppa till steg
          </span>
          <select
            value={deal.steg}
            onChange={(e) => {
              devJumpToSteg(id, e.target.value as Steg);
              refresh();
            }}
            className="border border-foreground/30 bg-card px-2 py-1 text-xs"
          >
            {STEG_ORDNING.map((s) => (
              <option key={s} value={s}>
                {STEG_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      {!annons && (
        <WireBox className="mb-6 border-amber-500/70 bg-amber-50/60 dark:bg-amber-500/10">
          <p className="text-sm text-amber-700 dark:text-amber-500">
            Annonsen för denna affär har tagits bort, men affärsdatan finns kvar.
          </p>
        </WireBox>
      )}

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

      {deal.avvisadAvTrelink && (
        <WireBox label="Avslutad — TreLink valde en annan köpare" className="mb-6">
          <Annotation>
            <span className="mt-2 block">
              TreLink gick vidare med en annan kandidat för det här objektet. Denna affär är stängd.
            </span>
          </Annotation>
        </WireBox>
      )}

      {!avslutad && deal.steg === "granskning" && (
        <>
          <WireBox label="Matchning" className="mb-6">
            <Annotation>
              Köparen har uttryckt intresse. Kraven nedan måste vara uppfyllda innan matchning — se
              åtgärdsraden längst ned.
            </Annotation>
          </WireBox>

          <WireBox label="Granskningsunderlag" className="mb-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-foreground/10 py-1.5 text-sm">
                <span>KYC-dokument</span>
                <WireTag active={kycOk}>{deal.granskning?.kycDokument || "Ej uppladdat"}</WireTag>
              </div>
              <div className="flex items-center justify-between border-b border-foreground/10 py-1.5 text-sm">
                <span>Firmatecknare</span>
                {deal.granskning?.firmatecknare === undefined ? (
                  <WireTag>Ej besvarat</WireTag>
                ) : deal.granskning.firmatecknare ? (
                  <WireTag active>Bekräftad av köparen</WireTag>
                ) : (
                  <WireTag active={firmatecknareOk}>
                    {firmatecknareOk ? "Kontaktuppgifter ifyllda" : "Ej ifyllt"}
                  </WireTag>
                )}
              </div>
              {deal.granskning?.firmatecknare === false && (
                <div className="grid grid-cols-1 gap-1 border-b border-foreground/10 py-1.5 text-sm text-muted-foreground md:grid-cols-2">
                  <span>{deal.granskning.ftRoll || "—"}</span>
                  <span>
                    {deal.granskning.ftFornamn || deal.granskning.ftEfternamn
                      ? `${deal.granskning.ftFornamn ?? ""} ${deal.granskning.ftEfternamn ?? ""}`.trim()
                      : "—"}
                  </span>
                  <span>{deal.granskning.ftMail || "—"}</span>
                  <span>{deal.granskning.ftMobil || "—"}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span>Företagspresentation</span>
                <WireTag active={foretagspresentationOk}>
                  {deal.granskning?.foretagspresentation || "Ej uppladdad"}
                </WireTag>
              </div>
            </div>
          </WireBox>

          {deal.granskning?.harBolag === false && (
            <WireBox label="Köparens bolagsstatus" className="mb-6">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between border-b border-foreground/10 py-1.5 text-sm">
                  <span>Väg</span>
                  <WireTag>
                    {deal.granskning.bolagsVal === "hyllbolag"
                      ? "Hyllbolag"
                      : deal.granskning.bolagsVal === "starta-bolag"
                        ? "Startar nytt bolag"
                        : "Ej valt än"}
                  </WireTag>
                </div>
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span>Bolag klart</span>
                  <WireTag active={!!deal.granskning.bolagKlartAt}>
                    {deal.granskning.bolagKlartAt
                      ? formatDatum(deal.granskning.bolagKlartAt)
                      : "Väntar"}
                  </WireTag>
                </div>
              </div>

              {deal.granskning.bolagKlartAt &&
                (annons?.cat === "aktie" ? (
                  <Annotation>
                    <span className="mt-2 block">
                      Uppgraderad till Aktieöverlåtelse — komplettering begärd från säljaren.
                    </span>
                  </Annotation>
                ) : (
                  <>
                    <Annotation>
                      Köparens bolag ändrades under processen. Uppgradera annonsen till
                      Aktieöverlåtelse och begär de kompletterande dokument som krävs av säljaren.
                    </Annotation>
                    <WireBtn className="mt-4" onClick={uppgraderaTillAktie}>
                      Uppgradera till Aktieöverlåtelse →
                    </WireBtn>
                  </>
                ))}
            </WireBox>
          )}

          <WireBox label="Bolagsuppgifter" className="mb-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Bolag
                </span>
                <input
                  type="text"
                  value={bolagVarde}
                  onChange={(e) => setBolagVarde(e.target.value)}
                  className="h-11 w-full rounded-button border border-foreground/15 bg-card px-3 text-sm focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Org.nr
                </span>
                <input
                  type="text"
                  value={orgnrVarde}
                  onChange={(e) => setOrgnrVarde(formatOrgnr(e.target.value))}
                  onBlur={() => setOrgnrTouched(true)}
                  className={`h-11 w-full rounded-button border bg-card px-3 text-sm focus:outline-none focus:ring-2 ${
                    orgnrError
                      ? "border-destructive focus:border-destructive focus:ring-destructive/40"
                      : "border-foreground/15 focus:border-[var(--color-interactive)] focus:ring-[var(--color-focus-ring)]/40"
                  }`}
                />
                {orgnrError && (
                  <span className="mt-1 block font-mono text-[10px] text-destructive">
                    {orgnrError}
                  </span>
                )}
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <WireBtn variant="secondary" onClick={saveBolag}>
                Spara bolagsuppgifter
              </WireBtn>
              <a
                href={allabolagUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Sök på allabolag.se ↗
              </a>
            </div>
          </WireBox>

          {buyerAccount && (
            <div className="mb-6">
              <Link
                to="/admin/anvandare/$id"
                params={{ id: buyerAccount.id }}
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Se/lägg anteckningar om köparen →
              </Link>
            </div>
          )}

          {ovrigaKandidater.length > 0 && (
            <WireBox label="Andra kandidater" className="mb-6">
              <Annotation>
                {ovrigaKandidater.length} andra kandidat
                {ovrigaKandidater.length === 1 ? "" : "er"} för samma annons — matchning påverkar
                bara den här köparen, övriga lämnas orörda.
              </Annotation>
              <div className="mt-3 overflow-x-auto border border-foreground/30 bg-background">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-foreground/30 bg-muted/30">
                      <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                        Köpare
                      </th>
                      <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                        Köpar-ID
                      </th>
                      <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                        Bolag
                      </th>
                      <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                        Företagspresentation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-muted-foreground/30">
                    {ovrigaKandidater.map((k) => {
                      const account = getAccountByUserId(k.userId);
                      const bolag = account?.profil?.bolag;
                      const orgnr = account?.profil?.orgnr;
                      return (
                        <tr
                          key={k.interestId}
                          onClick={
                            account
                              ? () =>
                                  navigate({
                                    to: "/admin/anvandare/$id",
                                    params: { id: account.id },
                                  })
                              : undefined
                          }
                          className={`transition-colors duration-150 hover:bg-muted/20 ${
                            account ? "cursor-pointer" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-sm">
                            {account ? (
                              `${account.bankid.fornamn} ${account.bankid.efternamn}`
                            ) : (
                              <span className="text-xs text-muted-foreground">Okänt konto</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono">{k.kKod}</td>
                          <td className="px-3 py-2">
                            {bolag ? (
                              <span className="text-sm">
                                {bolag}
                                {orgnr && <span className="text-muted-foreground"> · {orgnr}</span>}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Ej ifyllt</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {k.foretagspresentation ? (
                              <span className="flex items-center gap-1 text-sm">
                                <Check className="h-3.5 w-3.5" /> Uppladdad
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Väntar på uppladdning
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </WireBox>
          )}
        </>
      )}

      {!avslutad && deal.steg === "matchad" && (
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

      {!avslutad && deal.steg === "handpenning" && (
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

      {!avslutad && deal.steg === "handpenning" && (
        <WireBox label="TreLinks handpenningskvittens" className="mb-6">
          {!deal.handpenning?.kvittensSkapadAt ? (
            deal.handpenning?.kvitto && deal.handpenning?.ucUtdrag ? (
              <>
                <Annotation>
                  Upprätta TreLinks kvittens för den mottagna handpenningen och skicka den till
                  köparen för signering.
                </Annotation>
                <WireBtn className="mt-4" onClick={() => setHandpenningKvittensPreviewOpen(true)}>
                  Skapa kvittens →
                </WireBtn>
              </>
            ) : (
              <Annotation>
                <span className="mt-2 block">
                  Väntar på att köparen laddar upp kvittens och UC-utdrag innan TreLinks egen
                  kvittens kan upprättas.
                </span>
              </Annotation>
            )
          ) : !deal.handpenning?.kvittensSignerat?.kopare ? (
            <Annotation>
              <span className="mt-2 block">Väntar på att köparen signerar kvittensen.</span>
            </Annotation>
          ) : (
            <div className="space-y-1.5">
              <SignStatus
                label="Köparen har signerat"
                done={!!deal.handpenning.kvittensSignerat.kopare}
              />
              <SignStatus
                label="Säljaren har signerat"
                done={!!deal.handpenning.kvittensSignerat.saljare}
              />
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span>Skickad till säljaren</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDatum(deal.handpenning.kvittensSkickadTillSaljareAt ?? "")}
                </span>
              </div>
            </div>
          )}
        </WireBox>
      )}

      {!avslutad && deal.steg === "hyresvard" && (
        <WireBox label="Hyresvärd" className="mb-6">
          {!deal.hyresvard?.skickadAt ? (
            <>
              <Annotation>Sammanställning att skicka till hyresvärden</Annotation>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between border-b border-foreground/10 py-1.5">
                  <span className="text-muted-foreground">Företagspresentation</span>
                  <span>{buyerAccount?.profil?.foretagspresentation || "—"}</span>
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

      {!avslutad && deal.steg === "likvid" && (
        <WireBox label="Likvid" className="mb-6">
          {!deal.likvid?.begartAt ? (
            <>
              <Annotation>
                Begär in resterande likvid, 90 % av köpeskillingen, från köparen.
              </Annotation>
              <div className="mt-3 flex items-center justify-between border-b border-foreground/10 py-1.5 text-sm">
                <span className="text-muted-foreground">Förväntat belopp</span>
                <span className="tabular-nums">
                  {forvantadLikvidText ? `${forvantadLikvidText} kr` : "—"}
                </span>
              </div>
              <WireBtn
                className="mt-4"
                onClick={() => {
                  begarLikvid(id);
                  refresh();
                }}
              >
                Begär likvid →
              </WireBtn>
            </>
          ) : !deal.likvid?.inlamnadAt ? (
            <Annotation>
              <span className="mt-2 block">
                Väntar på att köparen lämnar uppgift om betald likvid.
              </span>
            </Annotation>
          ) : !deal.likvid?.verifieratAt ? (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between border-b border-foreground/10 py-1.5 text-sm">
                  <span>Inlämnat belopp</span>
                  <span className="tabular-nums">
                    {deal.likvid.belopp?.toLocaleString("sv-SE")} kr
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 text-sm">
                  <span>Förväntat belopp</span>
                  <span className="tabular-nums">
                    {forvantadLikvidText ? `${forvantadLikvidText} kr` : "—"}
                  </span>
                </div>
              </div>
              {!likvidBeloppMatchar && (
                <div className="mt-3 flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-500">
                  <AlertTriangle className="h-3.5 w-3.5" /> Beloppet stämmer inte överens —
                  kontrollera innan du bekräftar.
                </div>
              )}
              <WireBtn
                className="mt-4"
                onClick={() => {
                  verifieraLikvid(id);
                  refresh();
                }}
              >
                Bekräfta rätt belopp →
              </WireBtn>
            </>
          ) : (
            <>
              <Annotation>
                Upprätta kvittens för likviden och skicka den till köparen (mejl).
              </Annotation>
              <WireBtn className="mt-4" onClick={() => setLikvidKvittensPreviewOpen(true)}>
                Skapa kvittens →
              </WireBtn>
            </>
          )}
        </WireBox>
      )}

      {!avslutad && deal.steg === "signering" && (
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
              <SignStatus
                label="Hyresvärden har signerat"
                done={deal.overenskommelse.signerat.hyresvard}
              />
              {deal.overenskommelse.signerat.kopare &&
              deal.overenskommelse.signerat.saljare &&
              !deal.overenskommelse.signerat.hyresvard ? (
                <>
                  <Annotation>
                    <span className="mt-2 block">
                      Köparen och säljaren har signerat. Hyresvärden saknar inloggning i plattformen
                      — simulera hens signering nedan.
                    </span>
                  </Annotation>
                  <WireBtn className="mt-4" onClick={() => setHyresvardSignOpen(true)}>
                    Hyresvärdens signering (simulerad av TreLink) →
                  </WireBtn>
                </>
              ) : (
                <Annotation>
                  <span className="mt-2 block">
                    Väntar på signering i köparens och säljarens egna vyer.
                  </span>
                </Annotation>
              )}
            </>
          )}
        </WireBox>
      )}

      {!avslutad && deal.steg === "tilltrade" && (
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

      {!avslutad && deal.steg === "klar" && (
        <>
          <WireBox label="Klar" className="mb-6">
            <Annotation>Affären är genomförd.</Annotation>
          </WireBox>

          <WireBox label="Arvode" className="mb-6">
            {!deal.arvode?.lyftAt ? (
              <>
                <Annotation>
                  Lyft TreLinks förmedlingsarvode, 10 % av köpeskillingen, och skicka
                  arvodeskvittens till säljaren.
                </Annotation>
                <WireBtn className="mt-4" onClick={() => setArvodeKvittensPreviewOpen(true)}>
                  Lyft arvode →
                </WireBtn>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between border-b border-foreground/10 py-1.5 text-sm">
                    <span>Arvode lyft</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatDatum(deal.arvode.lyftAt)}
                    </span>
                  </div>
                  <div
                    className={`flex items-center justify-between py-1.5 text-sm ${deal.arvode.utbetaldAt ? "border-b border-foreground/10" : ""}`}
                  >
                    <span>Belopp</span>
                    <span className="tabular-nums">
                      {deal.arvode.belopp?.toLocaleString("sv-SE")} kr
                    </span>
                  </div>
                  {deal.arvode.utbetaldAt && (
                    <div className="flex items-center justify-between py-1.5 text-sm">
                      <span>Utbetald</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatDatum(deal.arvode.utbetaldAt)}
                      </span>
                    </div>
                  )}
                </div>
                {!deal.arvode.utbetaldAt && (
                  <WireBtn
                    className="mt-4"
                    onClick={() => {
                      bekraftaUtbetalning(id);
                      refresh();
                    }}
                  >
                    Bekräfta utbetalning till säljaren →
                  </WireBtn>
                )}
              </>
            )}
          </WireBox>
        </>
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
              <WireTag active>
                <Check className="inline-block h-3 w-3 align-middle" /> TreLink-signatur: Förifylld
              </WireTag>
              <KopeavtalDokument
                saljareBolag={saljareBolag}
                saljareOrgnr={saljareOrgnr}
                kopareBolag={kopareBolag}
                kopareOrgnr={kopareOrgnr}
                verksamhet={verksamhet}
                adress={adress}
                ort={info.ort}
                pris={info.pris}
                undertecknareNamn={undertecknareNamn}
                undertecknareRoll={undertecknareRoll}
                cat={annons?.cat}
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
              <WireTag active>
                <Check className="inline-block h-3 w-3 align-middle" /> TreLink-signatur: Förifylld
              </WireTag>
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

      {handpenningKvittensPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setHandpenningKvittensPreviewOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-foreground bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-foreground/30 bg-background px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Förhandsgranskning · Kvittens handpenning
              </div>
              <WireBtn variant="ghost" onClick={() => setHandpenningKvittensPreviewOpen(false)}>
                Stäng
              </WireBtn>
            </div>
            <div className="space-y-4 p-6">
              <WireTag active>
                <Check className="inline-block h-3 w-3 align-middle" /> TreLink-signatur: Förifylld
              </WireTag>
              <HandpenningKvittensDokument
                interestId={id}
                annonsId={interest.annonsId}
                titel={info.titel}
                adress={adress}
                ort={info.ort}
                pris={info.pris}
                kopareBolag={kopareBolag}
              />
              <div className="flex flex-wrap justify-end gap-2 border-t border-foreground/10 pt-4">
                <WireBtn variant="ghost" onClick={() => setHandpenningKvittensPreviewOpen(false)}>
                  Redigera
                </WireBtn>
                <WireBtn
                  onClick={() => {
                    skapaHandpenningKvittens(id);
                    skickaHandpenningKvittensForSignering(id);
                    setMailPreview({
                      fran: "TreLink <noreply@trelink.se>",
                      till: kopareBolag || "Köparen",
                      amne: "Kvittens för handpenning redo för signering",
                      brodtext: `Kvittensen för handpenningen avseende ${info.titel} är klar för signering. Logga in på TreLink för att signera med BankID.`,
                    });
                    setHandpenningKvittensPreviewOpen(false);
                    refresh();
                  }}
                >
                  Skicka till köparen för signering →
                </WireBtn>
              </div>
            </div>
          </div>
        </div>
      )}

      {likvidKvittensPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setLikvidKvittensPreviewOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-foreground bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-foreground/30 bg-background px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Förhandsgranskning · Kvittens likvid
              </div>
              <WireBtn variant="ghost" onClick={() => setLikvidKvittensPreviewOpen(false)}>
                Stäng
              </WireBtn>
            </div>
            <div className="space-y-4 p-6">
              <Annotation>
                Dokumentet mejlas till köparen och säljaren och kräver ingen signering.
              </Annotation>
              <LikvidKvittensDokument
                interestId={id}
                annonsId={interest.annonsId}
                mottagare="kopare"
                titel={info.titel}
                adress={adress}
                ort={info.ort}
                pris={info.pris}
                kopareBolag={kopareBolag}
              />
              <div className="flex flex-wrap justify-end gap-2 border-t border-foreground/10 pt-4">
                <WireBtn variant="ghost" onClick={() => setLikvidKvittensPreviewOpen(false)}>
                  Redigera
                </WireBtn>
                <WireBtn
                  onClick={() => {
                    skapaLikvidKvittens(id);
                    skickaLikvidKvittens(id);
                    setMailPreview({
                      fran: "TreLink <noreply@trelink.se>",
                      till: kopareBolag || "Köparen",
                      amne: "Kvittens för likvid",
                      brodtext: `Kvittensen för resterande likvid avseende ${info.titel} är bifogad. Ingen signering krävs.`,
                    });
                    setLikvidKvittensPreviewOpen(false);
                    refresh();
                  }}
                >
                  Skicka till köparen (mejl) →
                </WireBtn>
              </div>
            </div>
          </div>
        </div>
      )}

      {arvodeKvittensPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setArvodeKvittensPreviewOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-foreground bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-foreground/30 bg-background px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Förhandsgranskning · Arvodeskvittens
              </div>
              <WireBtn variant="ghost" onClick={() => setArvodeKvittensPreviewOpen(false)}>
                Stäng
              </WireBtn>
            </div>
            <div className="space-y-4 p-6">
              <Annotation>Dokumentet mejlas till säljaren och kräver ingen signering.</Annotation>
              <ArvodeKvittensDokument
                interestId={id}
                annonsId={interest.annonsId}
                titel={info.titel}
                adress={adress}
                ort={info.ort}
                pris={info.pris}
                saljareBolag={saljareBolag}
              />
              <div className="flex flex-wrap justify-end gap-2 border-t border-foreground/10 pt-4">
                <WireBtn variant="ghost" onClick={() => setArvodeKvittensPreviewOpen(false)}>
                  Redigera
                </WireBtn>
                <WireBtn
                  onClick={() => {
                    lyftArvode(id);
                    setMailPreview({
                      fran: "TreLink <noreply@trelink.se>",
                      till: saljareBolag || "Säljaren",
                      amne: "Arvodeskvittens",
                      brodtext: `Arvodeskvittensen för affären avseende ${info.titel} är bifogad.`,
                    });
                    setArvodeKvittensPreviewOpen(false);
                    refresh();
                  }}
                >
                  Bekräfta och skicka till säljaren →
                </WireBtn>
              </div>
            </div>
          </div>
        </div>
      )}

      {kompletteringOpen && (
        <WireBox label="Begär komplettering · köparen" className="mb-6">
          <textarea
            value={kompletteringText}
            onChange={(e) => setKompletteringText(e.target.value)}
            rows={3}
            placeholder="Vad behöver köparen komplettera?"
            className="w-full border border-foreground/50 bg-card px-3 py-2 text-sm"
          />
          <div className="mt-2 flex justify-end gap-2">
            <WireBtn
              variant="ghost"
              onClick={() => {
                setKompletteringOpen(false);
                setKompletteringText("");
              }}
            >
              Avbryt
            </WireBtn>
            <WireBtn
              variant="secondary"
              disabled={!kompletteringText.trim()}
              onClick={submitKompletteringKop}
              className={
                !kompletteringText.trim()
                  ? "cursor-not-allowed border-muted-foreground/30 text-muted-foreground hover:opacity-100"
                  : ""
              }
            >
              Skicka begäran →
            </WireBtn>
          </div>
        </WireBox>
      )}

      {/* Fast åtgärdsrad längst ned — samma mönster (fixed inte sticky) som
          admin.annonser.$id.tsx, se kommentaren där för varför. Bara synlig
          under granskningssteget, innan affären är avslutad. */}
      {!avslutad && deal.steg === "granskning" && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-foreground/30 bg-background px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {granskningChecklist.map((c) => (
                <span
                  key={c.label}
                  className={`inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-sm ${
                    c.ok
                      ? "border-foreground/30 text-muted-foreground"
                      : "border-amber-500/70 bg-amber-50/60 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500"
                  }`}
                >
                  {c.ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}{" "}
                  {c.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <WireBtn variant="ghost" onClick={() => setKompletteringOpen((v) => !v)}>
                Begär komplettering
              </WireBtn>
              <WireBtn variant="ghost" onClick={avvisaDennaKandidat}>
                Avvisa
              </WireBtn>
              <WireBtn
                variant="primary"
                disabled={!kanMatcha}
                onClick={() => {
                  matchaAffar(id);
                  refresh();
                }}
                className={
                  !kanMatcha
                    ? "cursor-not-allowed border-muted-foreground/30 bg-muted/30 text-muted-foreground hover:opacity-100"
                    : ""
                }
              >
                {kanMatcha ? "Matcha köpare →" : "Matcha köpare (krav saknas)"}
              </WireBtn>
            </div>
          </div>
        </div>
      )}

      <SignicatFlow
        open={hyresvardSignOpen}
        seller={{ bolag: saljareBolag }}
        docTitle="Överenskommelse om överlåtelse"
        doneHeading="Hyresvärdens signering är registrerad"
        signerandePart="Hyresvärden"
        renderDoc={() => (
          <OverenskommelseDokument
            saljareBolag={saljareBolag}
            kopareBolag={kopareBolag}
            verksamhet={verksamhet}
            adress={adress}
            ort={info.ort}
            pris={info.pris}
          />
        )}
        onCancel={() => setHyresvardSignOpen(false)}
        onSigned={() => {
          signeraOverenskommelse(id, "hyresvard");
          setHyresvardSignOpen(false);
          refresh();
        }}
      />

      <MailPreview open={!!mailPreview} mail={mailPreview} onClose={() => setMailPreview(null)} />
    </AdminLayout>
  );
}
