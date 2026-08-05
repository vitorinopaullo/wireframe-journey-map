import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, AdminComingSoon } from "@/components/layouts/AdminLayout";
import { PageHeader } from "@/components/wire";

export const Route = createFileRoute("/admin/kopare")({
  component: AdminKopare,
});

function AdminKopare() {
  return (
    <AdminLayout>
      <PageHeader eyebrow="TreLink Admin" title="Köpare/Intressenter" />
      <AdminComingSoon />
    </AdminLayout>
  );
}
