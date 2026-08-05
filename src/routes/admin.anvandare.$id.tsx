import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, Annotation, WireTag } from "@/components/wire";
import { readAdminAccounts } from "@/lib/mock-auth";

export const Route = createFileRoute("/admin/anvandare/$id")({
  component: AdminAnvandareDetail,
});

function Field({ k, v }: { k: string; v?: string }) {
  return (
    <div className="border-b border-dashed border-muted-foreground/30 pb-2">
      <Annotation>{k}</Annotation>
      <div className="mt-1 text-sm">{v || "—"}</div>
    </div>
  );
}

function AdminAnvandareDetail() {
  const { id } = Route.useParams();
  const account = readAdminAccounts().find((a) => a.id === id);
  const profil = account?.profil;

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
        eyebrow={`TreLink Admin · Konto #${id}`}
        title={account ? `${account.bankid.fornamn} ${account.bankid.efternamn}` : "Okänt konto"}
        subtitle={account?.bankid.personnr}
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
                <Field k="Ort" v={profil?.ort} />
                <Field k="Adress" v={profil?.adress} />
                <div className="md:col-span-2">
                  <Field k="Företagspresentation" v={profil?.presentation} />
                </div>
              </div>
            </WireBox>
          )}

          {harSaljaruppgifter && (
            <WireBox label="Säljaruppgifter">
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
        </div>
      )}
    </AdminLayout>
  );
}
