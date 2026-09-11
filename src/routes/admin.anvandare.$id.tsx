import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, Annotation, WireTag, WireBtn } from "@/components/wire";
import { readAdminAccounts } from "@/lib/mock-auth";
import { readAnnonser, getAnnons, stateLabel, type WorkflowState } from "@/lib/annons-workflow";
import { type CatId } from "@/lib/annons-model";
import { readBuyerInterests, type BuyerInterestStatus } from "@/lib/kopare-workflow";
import { StatusTag as IntresseStatusTag } from "@/routes/admin.kopare";
import { readFavoriter } from "@/lib/favoriter";
import { readNoteringar, addNotering } from "@/lib/admin-noteringar";
import { historikForKopare, HANDELSE_LABEL } from "@/lib/sparade-historik";
import { formatDatum } from "@/lib/format";
import { Star } from "lucide-react";

export const Route = createFileRoute("/admin/anvandare/$id")({
  component: AdminAnvandareDetail,
});

const KAT_NAMN: Record<CatId, "Lokal" | "Inkråm" | "Bolag"> = {
  overlatelse: "Lokal",
  inkram: "Inkråm",
  aktie: "Bolag",
};

// Ett konto kan ha objekt kopplade som säljare (egna annonser), som köpare
// (intresseanmälningar) och/eller sparade favoriter — alla tre visas i
// samma lista nedan.
type LinkatObjekt =
  | { kind: "annons"; id: string; titel: string; kategori: string; status: string }
  | { kind: "intresse"; id: string; titel: string; kKod: string; status: BuyerInterestStatus }
  | { kind: "favorit"; id: string; titel: string; status: string };

function linkadeAnnonser(personnr: string | undefined): LinkatObjekt[] {
  if (!personnr) return [];
  return readAnnonser()
    .filter((item: any) => item.sellerPersonnr === personnr)
    .map((item: any) => {
      const catId: CatId | undefined = item.draft?.cat;
      const st = item.workflow?.state as WorkflowState | undefined;
      return {
        kind: "annons" as const,
        id: item.id,
        titel: item.titel || "—",
        kategori: catId ? KAT_NAMN[catId] : "—",
        status: st ? stateLabel[st] : item.status || "—",
      };
    });
}

// BuyerInterest är kopplad via userId (t.ex. "u_198001019876"), inte
// personnr — annonser matchas via sellerPersonnr ovan, men det är en annan
// nyckel än den köparintresset faktiskt lagras under.
function linkadeIntressen(userId: string | undefined): LinkatObjekt[] {
  if (!userId) return [];
  return readBuyerInterests(userId).map((i) => ({
    kind: "intresse" as const,
    id: i.id,
    titel: getAnnons(i.annonsId)?.titel || `Annons ${i.annonsId}`,
    kKod: i.kKod,
    status: i.status,
  }));
}

function linkadeFavoriter(userId: string | undefined): LinkatObjekt[] {
  if (!userId) return [];
  return readFavoriter(userId).map((f) => ({
    kind: "favorit" as const,
    id: f.annonsId,
    titel: f.titel,
    status: "Sparad",
  }));
}

function Anteckningar({ userId }: { userId: string }) {
  const [text, setText] = useState("");
  const [, forceRerender] = useState(0);
  const noteringar = readNoteringar(userId);

  const loggaNotering = () => {
    const trimmad = text.trim();
    if (!trimmad) return;
    addNotering(userId, trimmad);
    setText("");
    forceRerender((n) => n + 1);
  };

  return (
    <WireBox label="Anteckningar">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="T.ex. Ringde 2026-09-11, ville tänka en vecka till"
          className="h-11 min-w-0 flex-1 rounded-button border border-foreground/15 bg-card px-3 text-sm transition-colors duration-150 focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
        />
        <WireBtn onClick={loggaNotering}>Logga</WireBtn>
      </div>

      {noteringar.length === 0 ? (
        <Annotation>
          <span className="mt-3 block">Inga anteckningar än.</span>
        </Annotation>
      ) : (
        <ul className="mt-4 space-y-3">
          {noteringar.map((n) => (
            <li key={n.id} className="border-l-2 border-foreground/20 pl-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {formatDatum(n.ts)}
              </div>
              <div className="text-sm">{n.text}</div>
            </li>
          ))}
        </ul>
      )}
    </WireBox>
  );
}

function Sparhistorik({ userId }: { userId: string }) {
  const historik = historikForKopare(userId)
    .slice()
    .sort((a, b) => b.ts.localeCompare(a.ts));

  return (
    <WireBox label="Sparhistorik">
      {historik.length === 0 ? (
        <Annotation>Ingen sparhistorik än.</Annotation>
      ) : (
        <ul className="space-y-3">
          {historik.map((h) => (
            <li key={h.id} className="border-l-2 border-foreground/20 pl-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {formatDatum(h.ts)}
              </div>
              <div className="text-sm">
                <Link
                  to="/admin/sparade/$annonsId"
                  params={{ annonsId: h.annonsId }}
                  className="underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
                >
                  {getAnnons(h.annonsId)?.titel || `Annons #${h.annonsId}`}
                </Link>
                {" — "}
                {HANDELSE_LABEL[h.handelse]}
              </div>
            </li>
          ))}
        </ul>
      )}
    </WireBox>
  );
}

function Field({ k, v }: { k: string; v?: string }) {
  return (
    <div className="border-b border-foreground/10 pb-2">
      <Annotation>{k}</Annotation>
      <div className="mt-1 text-sm">{v || "—"}</div>
    </div>
  );
}

function AdminAnvandareDetail() {
  const { id } = Route.useParams();
  const account = readAdminAccounts().find((a) => a.id === id);
  const profil = account?.profil;
  const objekt: LinkatObjekt[] = [
    ...linkadeAnnonser(account?.bankid.personnr),
    ...linkadeIntressen(account?.userId),
    ...linkadeFavoriter(account?.userId),
  ];

  const harBolagsuppgifter =
    !!profil && [profil.bolag, profil.orgnr, profil.ort, profil.adress, profil.presentation].some(Boolean);
  const harSaljaruppgifter = !!profil;
  const harFirmatecknarstatus = account?.role === "saljare" && !!profil?.arFirmatecknare;
  const arInteFirmatecknare = profil?.arFirmatecknare === "nej";
  const harFirmatecknareUppgifter =
    arInteFirmatecknare && [profil?.ftRoll, profil?.ftFornamn, profil?.ftEfternamn, profil?.ftMail, profil?.ftMobil].some(Boolean);

  return (
    <AdminLayout>
      <Link
        to="/admin/anvandare"
        className="mb-4 inline-block text-xs text-muted-foreground underline hover:text-foreground"
      >
        ← Tillbaka till Användare
      </Link>

      <PageHeader
        eyebrow={`Konto #${id}`}
        title={account ? `${account.bankid.fornamn} ${account.bankid.efternamn}` : "Okänt konto"}
      />

      {!account ? (
        <Annotation>Kontot kunde inte hittas.</Annotation>
      ) : (
        <div className="space-y-6">
          {harBolagsuppgifter && (
            <WireBox label="Bolagsuppgifter">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field k="Bolag" v={profil?.bolag} />
                <Field k="Org.nr" v={profil?.orgnr} />
                {account.role === "saljare" && (
                  <>
                    <Field k="Ort" v={profil?.ort} />
                    <Field k="Adress" v={profil?.adress} />
                  </>
                )}
                <div className="md:col-span-2">
                  <Field k="Företagspresentation" v={profil?.presentation} />
                </div>
              </div>
            </WireBox>
          )}

          {harSaljaruppgifter && (
            <WireBox
              label={account.role === "saljare" ? "Säljaruppgifter" : "Köparuppgifter"}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field k="Förnamn" v={account.bankid.fornamn} />
                <Field k="Efternamn" v={account.bankid.efternamn} />
                <Field k="Mobil nr" v={profil?.telefon} />
                <Field k="E-post" v={profil?.epost} />
              </div>
            </WireBox>
          )}

          {harFirmatecknarstatus && (
            <WireBox label="Firmatecknarstatus">
              <WireTag>{arInteFirmatecknare ? "Jag är inte firmatecknare" : "Jag är firmatecknare"}</WireTag>
            </WireBox>
          )}

          {harFirmatecknareUppgifter && (
            <WireBox label="Firmatecknarens uppgifter">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field k="Roll" v={profil?.ftRoll} />
                <Field k="Förnamn" v={profil?.ftFornamn} />
                <Field k="Efternamn" v={profil?.ftEfternamn} />
                <Field k="Mail" v={profil?.ftMail} />
                <Field k="Mobil" v={profil?.ftMobil} />
              </div>
            </WireBox>
          )}

          {!harBolagsuppgifter && !harSaljaruppgifter && (
            <Annotation>Kontot har ännu ingen ifylld onboarding-data.</Annotation>
          )}

          <WireBox label="Objekt kopplade till detta konto">
            {objekt.length === 0 ? (
              <Annotation>Inga objekt kopplade till detta konto ännu.</Annotation>
            ) : (
              <div className="space-y-2">
                {objekt.map((o) =>
                  o.kind === "favorit" ? (
                    <Link
                      key={`favorit-${o.id}`}
                      to="/admin/annonser/$id"
                      params={{ id: o.id }}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-foreground/15 bg-background p-3 transition-colors duration-150 hover:border-foreground/30"
                    >
                      <div className="flex items-center gap-2">
                        <WireTag>
                          <Star className="mr-1 inline-block h-3 w-3 align-middle" /> Favorit
                        </WireTag>
                        <span className="text-sm font-medium">{o.titel}</span>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {o.status}
                      </span>
                    </Link>
                  ) : o.kind === "annons" ? (
                    <Link
                      key={o.id}
                      to="/admin/annonser/$id"
                      params={{ id: o.id }}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-foreground/15 bg-background p-3 transition-colors duration-150 hover:border-foreground/30"
                    >
                      <div className="flex items-center gap-2">
                        <WireTag>{o.kategori}</WireTag>
                        <span className="text-sm font-medium">{o.titel}</span>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {o.status}
                      </span>
                    </Link>
                  ) : (
                    <Link
                      key={o.id}
                      to="/admin/kopare"
                      className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-foreground/15 bg-background p-3 transition-colors duration-150 hover:border-foreground/30"
                    >
                      <div className="flex items-center gap-2">
                        <WireTag>Intresse · {o.kKod}</WireTag>
                        <span className="text-sm font-medium">{o.titel}</span>
                      </div>
                      <IntresseStatusTag status={o.status} />
                    </Link>
                  ),
                )}
              </div>
            )}
          </WireBox>

          <Sparhistorik userId={account.userId} />

          <Anteckningar userId={account.userId} />
        </div>
      )}
    </AdminLayout>
  );
}
