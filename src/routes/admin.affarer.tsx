import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminLayout, AdminComingSoon } from "@/components/layouts/AdminLayout";
import { PageHeader } from "@/components/wire";
import { markKategoriRead } from "@/lib/admin-notiser";

export const Route = createFileRoute("/admin/affarer")({
  component: AdminAffarer,
});

function AdminAffarer() {
  useEffect(() => {
    markKategoriRead("affarer");
  }, []);

  return (
    <AdminLayout>
      <PageHeader eyebrow="TreLink Admin" title="Affärer/Uppdrag" />
      <AdminComingSoon />
    </AdminLayout>
  );
}
