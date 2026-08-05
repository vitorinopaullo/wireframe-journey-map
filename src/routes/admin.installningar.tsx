import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, AdminComingSoon } from "@/components/layouts/AdminLayout";
import { PageHeader } from "@/components/wire";

export const Route = createFileRoute("/admin/installningar")({
  component: AdminInstallningar,
});

function AdminInstallningar() {
  return (
    <AdminLayout>
      <PageHeader eyebrow="TreLink Admin" title="Inställningar" />
      <AdminComingSoon />
    </AdminLayout>
  );
}
