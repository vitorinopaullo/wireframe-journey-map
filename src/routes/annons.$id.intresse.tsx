import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { PageHeader } from "@/components/wire";
import { useIsAuthed } from "@/hooks/use-session";
import { findOrCreateInterest } from "@/lib/kopare-workflow";
import { getAnnons } from "@/lib/annons-workflow";
import { addNotis } from "@/lib/admin-notiser";
import { getSession } from "@/lib/mock-auth";
import { formatArendeRef } from "@/lib/format";

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

    const { interest, created } = findOrCreateInterest(id, getSession()?.userId);
    if (created) {
      const annonsTitel = getAnnons(id)?.titel || `Annons ${formatArendeRef(id)}`;
      addNotis(
        "saljare-intresse",
        `Ny intresseanmälan (${interest.kKod}) på "${annonsTitel}"`,
        "/saljare/intressenter",
      );
      addNotis("kopare", `Nytt lead (${interest.kKod}) på "${annonsTitel}"`, "/admin/kopare");
    }

    nav({ to: "/annons/$id/underlag", params: { id }, replace: true });
  }, [isAuthed, id, nav]);

  return (
    <PublicLayout>
      <PageHeader eyebrow={`Annons ${formatArendeRef(id)}`} title="Skickar dig vidare …" />
    </PublicLayout>
  );
}
