import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { PageHeader, WireBox, WireBtn, Annotation } from "@/components/wire";
import { BankIdPanel } from "@/components/BankIdPanel";
import { getSession } from "@/lib/mock-auth";

function isSafeNext(v: string | undefined): v is string {
  return !!v && v.startsWith("/") && !v.startsWith("//");
}

export const Route = createFileRoute("/logga-in")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: Login,
});

function Login() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const dest = isSafeNext(next) ? next : "/dashboard";

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Logga in"
        title="Logga in på TreLink"
        subtitle="TreLink använder BankID som enda inloggningssätt — både för köpare och säljare."
      />
      {isSafeNext(next) && (
        <div className="mb-4 border border-dashed border-muted-foreground/40 bg-muted/30 p-3 font-mono text-xs text-muted-foreground">
          Efter inloggning skickas du tillbaka till: {next}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BankIdPanel
          hint="Legitimera dig i BankID-appen. Har du inte skapat konto tidigare hamnar du direkt i onboarding."
          onDone={() => {
            const s = getSession();
            if (!s?.role) return navigate({ to: "/onboarding" });
            if (isSafeNext(next)) window.location.href = next;
            else navigate({ to: "/dashboard" });
          }}
        />

        <div className="space-y-4">
          <WireBox label="Inget konto?" variant="dashed">
            <p className="mb-3 text-sm text-muted-foreground">
              Första gången du legitimerar dig skapas kontot automatiskt. Du väljer sedan om du är köpare eller säljare.
            </p>
            <WireBtn variant="secondary" to="/registrera">
              Skapa konto med BankID →
            </WireBtn>
          </WireBox>

          <WireBox variant="ghost">
            <Annotation>Efter inloggning</Annotation>
            <p className="mt-1 text-sm text-muted-foreground">
              Skickas vidare till: <span className="font-mono">{dest}</span>
            </p>
          </WireBox>

          <WireBox label="TreLink · adminzon" variant="dashed">
            <p className="mb-3 text-sm text-muted-foreground">Separat inloggning för mäklarnav.</p>
            <WireBtn variant="secondary" to="/admin">Gå till adminzon →</WireBtn>
          </WireBox>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Har du redan ett konto men behöver börja om?{" "}
        <Link to="/registrera" className="underline">
          Registrera på nytt
        </Link>
      </p>
    </PublicLayout>
  );
}
