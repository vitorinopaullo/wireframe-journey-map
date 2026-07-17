import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthorizationDetails = {
  client?: { name?: string; client_uri?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};

// Local typed wrapper for the beta auth.oauth namespace.
type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: Error | null }>;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) {
      throw redirect({ to: "/logga-in", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold">Kunde inte läsa förfrågan</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Auktoriseringsservern returnerade ingen redirect.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "en app";

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="font-mono text-lg font-semibold">
        Anslut {clientName} till ditt TreLink-konto
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {clientName} kommer att kunna anropa TreLinks aktiverade MCP-verktyg som dig
        medan du är inloggad. Detta går inte förbi TreLinks behörigheter eller RLS.
      </p>
      {details?.scope && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Scopes: {details.scope}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          disabled={busy}
          onClick={() => decide(true)}
          className="border border-foreground bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          Godkänn
        </button>
        <button
          disabled={busy}
          onClick={() => decide(false)}
          className="border border-foreground/40 px-4 py-2 text-sm disabled:opacity-50"
        >
          Neka
        </button>
      </div>
    </main>
  );
}
