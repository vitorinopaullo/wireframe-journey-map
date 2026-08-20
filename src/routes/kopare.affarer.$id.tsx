import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireBtn, WireTag, Annotation } from "@/components/wire";
import { getBuyerInterest, statusLabel, statusHint } from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";

export const Route = createFileRoute("/kopare/affarer/$id")({
  component: BuyerCaseDetail,
});

function BuyerCaseDetail() {
  const { id } = Route.useParams();
  const interest = getBuyerInterest(id);

  if (!interest) {
    return (
      <AppLayout mode="kopare">
        <PageHeader eyebrow="Köparläge" title="Ärendet hittades inte" />
        <Link to="/kopare/affarer">
          <WireBtn variant="secondary">← Till mina affärer</WireBtn>
        </Link>
      </AppLayout>
    );
  }

  const annonsTitel = getAnnons(interest.annonsId)?.titel ?? `Annons #${interest.annonsId}`;

  return (
    <AppLayout mode="kopare">
      <Link to="/kopare/affarer" className="mb-4 inline-block text-xs text-muted-foreground hover:underline">
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

      <WireBox label="Ärendehistorik · synlig för dig & TreLink">
        <ul className="mt-1 space-y-3">
          {(interest.timeline ?? []).map((l, i) => (
            <li key={i} className="border-l-2 border-foreground/40 pl-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {new Date(l.ts).toLocaleString("sv-SE")} · {l.vem}
              </div>
              <div className="text-sm">{l.text}</div>
            </li>
          ))}
        </ul>
      </WireBox>
    </AppLayout>
  );
}
