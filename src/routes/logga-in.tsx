import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, PageHeader, WireBtn } from "@/components/wire";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dest = isSafeNext(next) ? next : "/dashboard";

  async function onEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) return setError(err.message);
    if (isSafeNext(next)) window.location.href = next;
    else navigate({ to: "/dashboard" });
  }

  async function onGoogle() {
    setBusy(true);
    setError(null);
    const returnPath = isSafeNext(next) ? next : "";
    const redirect_uri =
      window.location.origin + (returnPath ? `/logga-in?next=${encodeURIComponent(returnPath)}` : "/logga-in");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
    if (result.error) {
      setBusy(false);
      setError(result.error.message);
      return;
    }
    if (result.redirected) return;
    // Popup completed → session set. Navigate.
    if (isSafeNext(next)) window.location.href = next;
    else navigate({ to: "/dashboard" });
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Logga in"
        title="Logga in på TreLink"
        subtitle="Samma konto för köpar- och säljarläge."
      />
      {isSafeNext(next) && (
        <div className="mb-4 border border-dashed border-muted-foreground/40 bg-muted/30 p-3 font-mono text-xs text-muted-foreground">
          Efter inloggning skickas du tillbaka till: {next}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WireBox label="Logga in">
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
          <form onSubmit={onEmailLogin} className="space-y-3">
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
            <button
              type="submit"
              disabled={busy}
              className="w-full border border-foreground bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
            >
              {busy ? "Loggar in…" : "Logga in"}
            </button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Inget konto?{" "}
            <Link
              to="/registrera"
              search={isSafeNext(next) ? { next } : undefined}
              className="underline"
            >
              Registrera dig
            </Link>
            {" · "}
            Skickas vidare till: <span className="font-mono">{dest}</span>
          </p>
        </WireBox>
        <WireBox label="TreLink · adminzon" variant="dashed">
          <p className="mb-4 text-sm text-muted-foreground">
            Separat inloggning för mäklarnav — egna rättigheter.
          </p>
          <WireBtn variant="secondary" to="/george">
            Gå till adminzon →
          </WireBtn>
        </WireBox>
      </div>
    </PublicLayout>
  );
}
