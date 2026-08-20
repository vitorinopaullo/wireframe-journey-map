import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { PageHeader } from "@/components/wire";
import { useIsAuthed } from "@/hooks/use-session";
import { genereraKKod, readBuyerInterests, writeBuyerInterests } from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { addNotis } from "@/lib/admin-notiser";

export const Route = createFileRoute("/annons/$id/intresse")({
  component: InterestRedirect,
});

function InterestRedirect() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const isAuthed = useIsAuthed();

  useEffect(() => {
    if (isAuthed === false) {
      nav({ to: "/logga-in", search: { next: `/annons/${id}/intresse`, role: "kopare" } });
      return;
    }
    if (isAuthed !== true) return;

    const interests = readBuyerInterests();
    if (!interests.some((i) => i.annonsId === id)) {
      const interest = {
        id: `bi-${Date.now()}`,
        annonsId: id,
        kKod: genereraKKod(),
        status: "väntar-pdf" as const,
        skapadAt: new Date().toISOString(),
        timeline: [{ ts: new Date().toISOString(), vem: "Köpare" as const, text: "Skickade intresseanmälan" }],
      };
      writeBuyerInterests([...interests, interest]);
      const annonsTitel = getAnnons(id)?.titel || `Annons #${id}`;
      addNotis(
        "saljare-intresse",
        `Ny intresseanmälan (${interest.kKod}) på "${annonsTitel}"`,
        "/saljare/intressenter",
      );
    }

    nav({ to: "/annons/$id/underlag", params: { id }, replace: true });
  }, [isAuthed, id, nav]);

  return (
    <PublicLayout>
      <PageHeader eyebrow={`Annons #${id}`} title="Skickar dig vidare …" />
    </PublicLayout>
  );
}
