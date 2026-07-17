import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { PageHeader, WireBox } from "@/components/wire";
import { BankIdPanel } from "@/components/BankIdPanel";

function isSafeNext(v: string | undefined): v is string {
  return !!v && v.startsWith("/") && !v.startsWith("//");
}

export const Route = createFileRoute("/registrera")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
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
        <div className="mb-4 border border-dashed border-muted-foreground/40 bg-muted/30 p-3 font-mono text-xs text-muted-foreground">
          Efter registrering skickas du till: {next}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BankIdPanel
          label="Legitimera dig med BankID"
          hint="Vi hämtar för- och efternamn samt personnummer från BankID. Inga andra sätt att skapa konto finns."
          onDone={() => navigate({ to: "/onboarding" })}
        />
        <WireBox label="Vad händer sen?" variant="dashed">
          <ol className="ml-4 list-decimal space-y-2 text-sm text-muted-foreground">
            <li>Du väljer köpare eller säljare.</li>
            <li>Du fyller i telefon, e-post och (för säljare) adress.</li>
            <li>Bolagsuppgifter är frivilligt nu — men krävs innan du kan köpa eller sälja.</li>
            <li>All information skickas till TreLinks admin för granskning.</li>
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            Redan konto?{" "}
            <Link to="/logga-in" className="underline">
              Logga in med BankID
            </Link>
          </p>
        </WireBox>
      </div>
    </PublicLayout>
  );
}
