import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, WireBtn } from "@/components/wire";

export const Route = createFileRoute("/logga-in")({
  component: Login,
});

function Login() {
  return (
    <PublicLayout>
      <PageHeader eyebrow="BankID-inloggning" title="Logga in" subtitle="Samma konto för köpar- och säljarläge. TreLink loggar in via separat adminzon." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WireBox label="Köpare / Säljare">
          <div className="flex h-48 items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/30 text-sm text-muted-foreground">
            [ BankID-modul ]
          </div>
          <WireBtn to="/dashboard" className="mt-4 w-full">Logga in med BankID</WireBtn>
          <p className="mt-3 text-xs text-muted-foreground">
            Inget konto?{" "}
            <Link to="/registrera" className="underline">Registrera dig</Link>
          </p>
        </WireBox>
        <WireBox label="TreLink · adminzon" variant="dashed">
          <p className="mb-4 text-sm text-muted-foreground">
            Separat inloggning för mäklarnav — egna rättigheter.
          </p>
          <WireBtn variant="secondary" to="/george">Gå till adminzon →</WireBtn>
        </WireBox>
      </div>
    </PublicLayout>
  );
}
