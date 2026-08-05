import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, Annotation, WireTag } from "@/components/wire";
import { readAnnonser, stateLabel, type WorkflowState } from "@/lib/annons-workflow";

export const Route = createFileRoute("/admin/annonser/$id")({
  component: AdminAnnonsDetail,
});

const ONBOARDING_SALJARE_KEY = "trelink-onboarding-saljare-uppgifter";

type OnboardingSaljareData = {
  bolagsuppgifter: { bolag: string; orgnr: string; ort: string; adress: string; presentation?: string };
  saljaruppgifter: { fornamn: string; efternamn: string; mobil: string; epost: string };
  firmatecknare: { roll: string; fornamn: string; efternamn: string; mail: string; mobil: string } | null;
};

function readOnboardingSaljare(): OnboardingSaljareData | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_SALJARE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingSaljareData) : null;
  } catch {
    return null;
  }
}

const CATS: Record<string, { name: string; avgift: string }> = {
  overlatelse: { name: "Överlåtelse", avgift: "29 900 kr" },
  inkram: { name: "Inkråm", avgift: "39 900 kr" },
  aktie: { name: "Aktieöverlåtelse", avgift: "79 900 kr" },
};

const TAGG_FALT: { key: string; label: string }[] = [
  { key: "usp", label: "Vad gör verksamheten unik" },
  { key: "kundunderlag", label: "Kundunderlag" },
  { key: "laget", label: "Läget" },
  { key: "potential", label: "Utvecklingsmöjligheter" },
  { key: "anledning", label: "Anledning till försäljning" },
];

const TYP_TILL_GRUPP: Record<string, string> = {
  Kontor: "Kontor",
  Butik: "Butik",
  Lager: "Lager",
  "Mat och dryck": "Servering",
  Skönhetssalong: "Frisor",
};

const GRUPP_NAMN: Record<string, string> = {
  Kontor: "Kontor",
  Butik: "Butik",
  Lager: "Lager",
  Servering: "Mat och dryck",
  Frisor: "Skönhetssalong",
};

type GruppFalt = { key: string; label: string; isTags?: boolean };

const GRUPP_FALT: Record<string, GruppFalt[]> = {
  Kontor: [
    { key: "taggar", label: "Taggar (läge/interiör/planlösning/ekonomi/teknisk info)", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Butik: [
    { key: "taggar", label: "Taggar (läge/interiör/planlösning/ekonomi/teknisk info)", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Lager: [
    { key: "taggar", label: "Taggar (läge/interiör/planlösning/ekonomi/teknisk info)", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Frisor: [
    { key: "underrubrik", label: "Typ av verksamhet" },
    { key: "taggar", label: "Taggar (läge/interiör/planlösning/ekonomi)", isTags: true },
    { key: "beskrivning", label: "Övrig info" },
  ],
  Servering: [
    { key: "underrubrik", label: "Typ av verksamhet" },
    { key: "taggar", label: "Taggar (läge/interiör/planlösning/ekonomi)", isTags: true },
    { key: "typAvKok", label: "Köksteknik", isTags: true },
    { key: "utvecklingsmojlighet", label: "Utvecklingsmöjlighet", isTags: true },
    { key: "anledningTillForsaljning", label: "Anledning till försäljning", isTags: true },
    { key: "myndighetskrav", label: "Myndighetskrav", isTags: true },
    { key: "ovrigInfo", label: "Övrig info" },
  ],
};

function Field({ k, v }: { k: string; v?: string }) {
  return (
    <div className="border-b border-dashed border-muted-foreground/30 pb-2">
      <Annotation>{k}</Annotation>
      <div className="mt-1 text-sm">{v || "—"}</div>
    </div>
  );
}

function TagsField({ k, v }: { k: string; v?: string }) {
  const tags = v ? v.split(",").map((t) => t.trim()).filter(Boolean) : [];
  return (
    <div className="border-b border-dashed border-muted-foreground/30 pb-2">
      <Annotation>{k}</Annotation>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {tags.length > 0 ? tags.map((t) => <WireTag key={t}>{t}</WireTag>) : <span className="text-sm">—</span>}
      </div>
    </div>
  );
}

function AdminAnnonsDetail() {
  const { id } = Route.useParams();
  const item = readAnnonser().find((i: any) => i.id === id);
  const onboarding = readOnboardingSaljare();
  const draft = item?.draft ?? {};

  const valdaGrupper = Array.from(
    new Set(
      (draft.verksamhet ? String(draft.verksamhet).split(",") : [])
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((typ: string) => TYP_TILL_GRUPP[typ])
        .filter(Boolean),
    ),
  );

  const cat = CATS[item?.cat ?? ""] ?? null;
  const status = (item?.workflow?.state as WorkflowState | undefined) ?? null;

  return (
    <AdminLayout>
      <Link to="/admin/annonser" className="mb-4 inline-block text-xs text-muted-foreground underline hover:text-foreground">
        ← Tillbaka till Annonser
      </Link>

      <PageHeader
        eyebrow={`TreLink Admin · Annons #${id}`}
        title={item?.titel ?? "Okänd annons"}
        subtitle={status ? stateLabel[status] : "Status okänd"}
      />

      {!item ? (
        <Annotation>Annonsen kunde inte hittas.</Annotation>
      ) : (
        <div className="space-y-6">
          <WireBox label="Bolagsuppgifter">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field k="Bolag" v={onboarding?.bolagsuppgifter.bolag} />
              <Field k="Org.nr" v={onboarding?.bolagsuppgifter.orgnr} />
              <Field k="Ort" v={onboarding?.bolagsuppgifter.ort} />
              <Field k="Adress" v={onboarding?.bolagsuppgifter.adress} />
              <div className="md:col-span-2">
                <Field k="Företagspresentation" v={onboarding?.bolagsuppgifter.presentation} />
              </div>
            </div>
          </WireBox>

          <WireBox label="Kontaktperson / Firmatecknare">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                k="Kontaktperson"
                v={
                  onboarding
                    ? `${onboarding.saljaruppgifter.fornamn} ${onboarding.saljaruppgifter.efternamn}`
                    : undefined
                }
              />
              <Field k="Mobil" v={onboarding?.saljaruppgifter.mobil} />
              <Field k="E-post" v={onboarding?.saljaruppgifter.epost} />
              <Field
                k="Firmatecknare"
                v={onboarding && onboarding.firmatecknare === null ? "Kontaktpersonen är firmatecknare" : undefined}
              />
            </div>
            {onboarding?.firmatecknare && (
              <div className="mt-4 border-t border-dashed border-muted-foreground/40 pt-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field k="Roll" v={onboarding.firmatecknare.roll} />
                  <Field
                    k="Namn"
                    v={`${onboarding.firmatecknare.fornamn} ${onboarding.firmatecknare.efternamn}`}
                  />
                  <Field k="Mail" v={onboarding.firmatecknare.mail} />
                  <Field k="Mobil" v={onboarding.firmatecknare.mobil} />
                </div>
              </div>
            )}
          </WireBox>

          <WireBox label="Objektet">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field k="Ort" v={draft.ort} />
              <Field k="Adress" v={draft.adress} />
              <Field k="Yta" v={draft.yta ? `${draft.yta} m²` : undefined} />
              <Field k="Verksamhetstyp" v={draft.verksamhet} />
            </div>
          </WireBox>

          <WireBox label="Taggar & underlag">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {TAGG_FALT.map((f) => (
                <Field key={f.key} k={f.label} v={draft[f.key]} />
              ))}
            </div>
          </WireBox>

          {valdaGrupper.map((grupp) => (
            <WireBox key={grupp} label={`Verksamhetstypfält · ${GRUPP_NAMN[grupp]}`}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {GRUPP_FALT[grupp].map((f) => {
                  const value = draft.typFalt?.[grupp]?.[f.key];
                  return f.isTags ? (
                    <TagsField key={f.key} k={f.label} v={value} />
                  ) : (
                    <Field key={f.key} k={f.label} v={value} />
                  );
                })}
              </div>
            </WireBox>
          ))}

          <WireBox label="Hyresvärd & BRF">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field k="Hyresvärd namn" v={draft.hyresvardNamn} />
              <Field k="Hyresvärd e-post" v={draft.hyresvardEmail} />
              <Field k="Hyresvärd telefon" v={draft.hyresvardTel} />
              <Field k="BRF-kontaktperson" v={draft.brfKontakt} />
            </div>
          </WireBox>

          <WireBox label="Vald paketnivå">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field k="Paket" v={cat?.name} />
              <Field
                k="Avgift"
                v={cat ? `${cat.avgift}${item.premium ? " + 2 500 kr (premium-tillägg)" : ""}` : undefined}
              />
            </div>
          </WireBox>
        </div>
      )}
    </AdminLayout>
  );
}
