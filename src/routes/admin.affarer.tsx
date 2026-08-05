import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, AdminComingSoon } from "@/components/layouts/AdminLayout";
import { PageHeader } from "@/components/wire";

export const Route = createFileRoute("/admin/affarer")({
  component: AdminAffarer,
});

function AdminAffarer() {
  return (
    <AdminLayout>
      <PageHeader eyebrow="TreLink Admin" title="Affärer/Uppdrag" />
      <AdminComingSoon />
    </AdminLayout>
  );
}
