import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, AdminComingSoon } from "@/components/layouts/AdminLayout";
import { PageHeader } from "@/components/wire";

export const Route = createFileRoute("/admin/annonser")({
  component: AdminAnnonser,
});

function AdminAnnonser() {
  return (
    <AdminLayout>
      <PageHeader eyebrow="TreLink Admin" title="Annonser" />
      <AdminComingSoon />
    </AdminLayout>
  );
}
