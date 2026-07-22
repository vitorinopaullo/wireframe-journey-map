import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";

export const Route = createFileRoute("/saljare/annons-inskickad")({
  component: TackPage,
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
});

function TackPage() {
  const { id } = Route.useSearch();
  const ref = "TRL-" + (id ? id.slice(-6).toUpperCase() : Math.floor(100000 + Math.random() * 900000));
  return (
    <AppLayout mode="saljare">
      <PageHeader
        eyebrow="TreLink · din digitala mäklare"
        title="Tack — vi tar det härifrån"
        subtitle="Underlaget är låst för redigering under granskningen. TreLink återkommer när nästa steg är klart."
        right={<WireTag>Ärende {ref}</WireTag>}
      />

      <WireBox className="p-6 space-y-3">
        <div className="flex items-center gap-2 text-xl"><CheckCircle2 className="h-6 w-6 shrink-0" />Underlaget är mottaget</div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Du hittar ärendet under <strong>Mina annonser</strong> med status <strong>Granskas</strong>.
          Där ser du också alla steg framåt — uppdragsavtal, hyresvärdsdialog, annonsutkast och publicering.
        </p>
        <Annotation>Så här går det till härnäst</Annotation>
        <ol className="text-sm space-y-1 pl-4 list-decimal">
          <li>TreLink granskar underlaget (kan begära komplettering).</li>
          <li>Vid godkännande skickas <strong>uppdragsavtal</strong> för digital signering (Signicat + BankID).</li>
          <li>TreLink informerar <strong>hyresvärden</strong> om att processen startat.</li>
          <li>TreLink tar fram <strong>annonsutkast</strong> — du godkänner eller ger feedback.</li>
          <li>Annonsen publiceras och du får en bekräftelse per e-post.</li>
        </ol>
      </WireBox>

      <div className="flex flex-wrap gap-2 mt-6">
        {id && (
          <Link to="/saljare/annons/$id" params={{ id }}>
            <WireBtn>Öppna ärendet →</WireBtn>
          </Link>
        )}
        <Link to="/saljare/mina-annonser">
          <WireBtn variant="secondary">Mina annonser</WireBtn>
        </Link>
        <Link to="/dashboard">
          <WireBtn variant="ghost">Till min panel</WireBtn>
        </Link>
      </div>
    </AppLayout>
  );
}
