import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, WireField, WireBtn, Annotation } from "@/components/wire";

export const Route = createFileRoute("/kontakt")({
  component: Kontakt,
  head: () => ({
    meta: [
      { title: "Kontakta oss — Trelink" },
      { name: "description", content: "Kontakta Trelink. Svar inom 24 timmar på vardagar." },
    ],
  }),
});

function Kontakt() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Support"
        title="Kontakta oss"
        subtitle="Svar inom 24 timmar på vardagar."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <WireBox label="Skicka meddelande" className="md:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WireField label="Namn" placeholder="För- och efternamn" />
            <WireField label="E-post" placeholder="namn@exempel.se" />
            <div className="md:col-span-2">
              <WireField label="Jag är" placeholder="Säljare/Överlåtare / Köpare / Övrigt" type="select" />
            </div>
            <div className="md:col-span-2">
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Meddelande
                </span>
                <div className="flex h-32 items-start border border-dashed border-muted-foreground/50 bg-muted/20 p-3 text-sm text-muted-foreground">
                  [ Ditt meddelande ]
                </div>
              </label>
            </div>
          </div>
          <div className="mt-6">
            <WireBtn>Skicka</WireBtn>
          </div>
        </WireBox>
        <div className="space-y-4">
          <WireBox label="Kontaktuppgifter">
            <div className="space-y-2 text-sm">
              <div>
                <Annotation>E-post</Annotation>
                <div>hej@trelink.se</div>
              </div>
              <div>
                <Annotation>Telefon</Annotation>
                <div>08 — XXX XX XX</div>
              </div>
              <div>
                <Annotation>Adress</Annotation>
                <div>Trelink AB<br />Storgatan 1<br />111 22 Stockholm</div>
              </div>
            </div>
          </WireBox>
          <WireBox variant="dashed">
            <Annotation>Svarstid</Annotation>
            <p className="mt-1 text-sm">Svar inom 24h på vardagar.</p>
          </WireBox>
        </div>
      </div>
    </PublicLayout>
  );
}
