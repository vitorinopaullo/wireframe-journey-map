import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader } from "@/components/wire";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const returnPath = isSafeNext(next) ? next : "/onboarding";
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + returnPath,
      },
    });
    setBusy(false);
    if (err) return setError(err.message);
    if (data.session) {
      navigate({ to: "/onboarding" });
    } else {
      setInfo("Konto skapat. Kolla din e-post för att bekräfta innan du loggar in.");
    }
  }

  async function onGoogle() {
    setBusy(true);
    setError(null);
    const returnPath = isSafeNext(next) ? next : "/onboarding";
    const redirect_uri =
      window.location.origin + `/logga-in?next=${encodeURIComponent(returnPath)}`;
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
    if (result.error) {
      setBusy(false);
      setError(result.error.message);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/onboarding" });
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Ett konto · två lägen"
        title="Registrera dig"
        subtitle="En person, ett konto. Använd samma konto för både köpar- och säljarläge."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <WireBox label="Skapa konto">
          <button
            onClick={onGoogle}
            disabled={busy}
            className="w-full border border-foreground px-4 py-2 text-sm font-medium hover:bg-muted/40 disabled:opacity-50"
          >
            Fortsätt med Google
          </button>
          <div className="my-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-muted-foreground/30" />
            eller
            <span className="h-px flex-1 bg-muted-foreground/30" />
          </div>
          <form onSubmit={onSignup} className="space-y-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                E-post
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-foreground/40 bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Lösenord
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-foreground/40 bg-background px-3 py-2 text-sm"
              />
            </label>
            {error && (
              <p role="alert" className="border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {error}
              </p>
            )}
            {info && (
              <p className="border border-foreground/40 bg-muted/40 p-2 text-xs">{info}</p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full border border-foreground bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
            >
              {busy ? "Skapar konto…" : "Skapa konto"}
            </button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Har du redan konto?{" "}
            <Link
              to="/logga-in"
              search={isSafeNext(next) ? { next } : undefined}
              className="underline"
            >
              Logga in
            </Link>
          </p>
        </WireBox>
        <WireBox label="Vad händer sen?" variant="dashed">
          <p className="text-sm text-muted-foreground">
            Efter registrering går du igenom onboarding där du väljer om du är köpare
            eller säljare och fyller i grunduppgifter. Du kan alltid växla läge senare.
          </p>
        </WireBox>
      </div>
    </PublicLayout>
  );
}
