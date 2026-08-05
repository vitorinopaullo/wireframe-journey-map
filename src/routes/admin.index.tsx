import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, AdminComingSoon } from "@/components/layouts/AdminLayout";
import { PageHeader } from "@/components/wire";

export const Route = createFileRoute("/admin/")({
  component: AdminOversikt,
});

function AdminOversikt() {
  return (
    <AdminLayout>
      <PageHeader eyebrow="TreLink Admin" title="Översikt" subtitle="Sammanfattning av plattformens aktivitet." />
      <AdminComingSoon />
    </AdminLayout>
  );
}
