import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, WireTag, StatusDot, Annotation, WireBtn } from "@/components/wire";

export const Route = createFileRoute("/affar/$id")({
  component: DealDetail,
});

const timeline = [
  { label: "Annons godkänd & publicerad", state: "done", note: "George granskade och publicerade 28 maj" },
  { label: "Köpare matchad", state: "done", note: "Intresseanmälan godkänd 12 jun · UC OK" },
  { label: "Hyresvärdens godkännande (lokal)", state: "active", note: "George inväntar svar på anonym profil — skickad 13 jun" },
  { label: "Handpenning fakturerad", state: "pending", note: "Faktura skickas till klientmedelskonto vid godkänd hyresvärd" },
  { label: "Avtal signerat (BankID · Signicat)", state: "pending", note: "Båda parter signerar — kontaktuppgifter avslöjas" },
  { label: "Tillträde & medel frigörs", state: "pending", note: "Säljaren får betalt · Trelinks avgift dras nu" },
];

function DealDetail() {
  const { id } = Route.useParams();
  return (
    <PublicLayout>
      <div className="mb-4 text-xs text-muted-foreground">
        Affär #{id} · Lokal · Stockholm
      </div>
      <PageHeader
        eyebrow="Affärsstatus · spårning"
        title="Restauranglokal · Södermalm"
        subtitle="Full transparens för båda parter. George styr status — du ser exakt var affären står och vad som händer härnäst."
        right={<WireTag>Pågår</WireTag>}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WireBox label="Tidslinje">
            <ol className="space-y-5">
              {timeline.map((t, i) => (
                <li key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <StatusDot state={t.state as never} />
                    {i < timeline.length - 1 && <div className="mt-1 h-12 w-px bg-foreground/20" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{t.label}</h4>
                      <WireTag>
                        {t.state === "done" ? "Klar" : t.state === "active" ? "Pågår" : "Kommande"}
                      </WireTag>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </WireBox>
        </div>

        <aside className="space-y-4">
          <WireBox label="Parter">
            <div className="space-y-3 text-sm">
              <div>
                <Annotation>Säljare</Annotation>
                <p>Anonym tills signering</p>
              </div>
              <div>
                <Annotation>Köpare</Annotation>
                <p>Anonym tills signering</p>
              </div>
              <div>
                <Annotation>Mäklare</Annotation>
                <p>George · når dig via mejl</p>
              </div>
            </div>
          </WireBox>

          <WireBox label="Hyresvärd · anonym profil" variant="dashed">
            <p className="text-xs text-muted-foreground">
              Skickad till hyresvärd: ekonomi · UC · verksamhetstyp. Inga personuppgifter.
            </p>
            <WireBtn variant="ghost" className="mt-3 w-full">Visa skickad profil</WireBtn>
          </WireBox>

          <WireBox label="Dokument" variant="ghost">
            <ul className="space-y-2 text-xs">
              <li>▤ Köpeavtal (utkast)</li>
              <li>▤ Hyreskontrakt</li>
              <li>▤ Inventarielista</li>
            </ul>
          </WireBox>
        </aside>
      </div>
    </PublicLayout>
  );
}
