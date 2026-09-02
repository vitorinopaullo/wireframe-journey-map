import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { PageHeader, WireBox } from "@/components/wire";
import { BankIdPanel } from "@/components/BankIdPanel";

function isSafeNext(v: string | undefined): v is string {
  return !!v && v.startsWith("/") && !v.startsWith("//");
}

export const Route = createFileRoute("/registrera")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" ? { next: s.next } : {},
  component: Register,
});

function Register() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Skapa konto"
        title="Registrera dig med BankID"
        subtitle="TreLink har inga lösenord — legitimera dig med BankID så skapas kontot. Efter det väljer du köpar- eller säljarläge."
      />
      {isSafeNext(next) && (
        <WireBox variant="dashed" className="mb-4">
          <p className="text-sm text-muted-foreground">
            Efter registrering skickas du till: {next}
          </p>
        </WireBox>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BankIdPanel
          label="Legitimera dig med BankID"
          hint="Vi hämtar för- och efternamn samt personnummer från BankID. Inga andra sätt att skapa konto finns."
          onDone={() => navigate({ to: "/onboarding" })}
        />
      </div>
    </PublicLayout>
  );
}
