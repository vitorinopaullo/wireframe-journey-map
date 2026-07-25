import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { unlockSite } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "TreLink — Lösenordsskyddad" },
      { name: "description", content: "Ange lösenordet för att se prototypen." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Unlock,
});

function Unlock() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(false);
    const password = (new FormData(e.currentTarget).get("password") as string) ?? "";
    try {
      const { ok } = await unlock({ data: { password } });
      if (ok) {
        await router.invalidate();
        await router.navigate({ to: "/" });
      } else {
        setError(true);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-mono">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm border-2 border-dashed border-foreground p-8 space-y-4"
      >
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            [ trelink prototype ]
          </div>
          <h1 className="mt-2 text-xl font-bold">Lösenordsskyddad</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ange lösenordet för att fortsätta.
          </p>
        </div>
        <label className="block text-xs uppercase tracking-widest">Lösenord</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          className="w-full border-2 border-dashed border-foreground bg-background px-3 py-2 text-sm outline-none focus:border-solid"
        />
        {error && (
          <p className="text-xs text-destructive">Fel lösenord. Försök igen.</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full border-2 border-foreground bg-foreground px-3 py-2 text-sm uppercase tracking-widest text-background hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Låser upp…" : "Lås upp"}
        </button>
      </form>
    </div>
  );
}
