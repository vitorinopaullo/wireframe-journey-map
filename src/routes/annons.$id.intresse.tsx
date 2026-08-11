import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { WireBox, WireBtn, WireTag, Annotation, PageHeader, StatusDot } from "@/components/wire";
import { useIsAuthed } from "@/hooks/use-session";
import { genereraKKod, readBuyerInterests, writeBuyerInterests } from "@/lib/kopare-workflow";

export const Route = createFileRoute("/annons/$id/intresse")({
  component: InterestWizard,
});

/* ---------- typer + utkast ---------- */
type Draft = {
  bankid: "ej" | "verifierad";
  namn: string;
  epost: string;
  telefon: string;
  finansiering: "egna" | "lan" | "investerare" | "";
  budgetOk: boolean;
  ucMedgivande: boolean;
  erfarenhet: "ingen" | "viss" | "stor" | "";
  bransch: string;
  tidsplan: "snarast" | "3-6mn" | "6+mn" | "";
  meddelande: string;
  godkanner: boolean;
  uppdaterad: number;
};

const TOM: Draft = {
  bankid: "ej",
  namn: "",
  epost: "",
  telefon: "",
  finansiering: "",
  budgetOk: false,
  ucMedgivande: false,
  erfarenhet: "",
  bransch: "",
  tidsplan: "",
  meddelande: "",
  godkanner: false,
  uppdaterad: 0,
};

const STEPS = [
  { n: 1, k: "Identitet", b: "BankID + kontakt" },
  { n: 2, k: "Finansiering", b: "Hur betalar du?" },
  { n: 3, k: "Erfarenhet", b: "Bransch & tidsplan" },
  { n: 4, k: "Meddelande", b: "Till säljaren" },
  { n: 5, k: "Bekräfta", b: "Granska & skicka" },
];

const PRIS = 1_950_000;
const HANDPENNING = Math.round(PRIS * 0.1);

/* ---------- små komponenter ---------- */
function RadioCard({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-start gap-1 border p-3 text-left text-sm transition ${
        selected
          ? "border-foreground bg-foreground/5"
          : "border-dashed border-muted-foreground/40 hover:border-foreground/60"
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <span className="font-medium">{label}</span>
        <span
          className={`h-3 w-3 rounded-full ${
            selected ? "bg-foreground" : "border border-foreground/40 bg-background"
          }`}
        />
      </div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full border border-dashed border-muted-foreground/50 bg-background px-3 text-sm focus:border-foreground focus:outline-none"
      />
      {hint && <span className="mt-1 block font-mono text-[10px] text-muted-foreground/70">{hint}</span>}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-muted-foreground/30 py-2 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v || <em className="text-muted-foreground/60">—</em>}</span>
    </div>
  );
}

function InterestWizard() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const isAuthed = useIsAuthed();
  const STORAGE_KEY = `kopare-intresse-${id}`;

  useEffect(() => {
    if (isAuthed === false) {
      nav({ to: "/logga-in", search: { next: `/annons/${id}/intresse` } });
    }
  }, [isAuthed, id, nav]);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(TOM);
  const [savedAt, setSavedAt] = useState<number | null>(null);


  /* ladda utkast */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDraft({ ...TOM, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, [STORAGE_KEY]);

  /* auto-save */
  useEffect(() => {
    const t = setTimeout(() => {
      const next = { ...draft, uppdaterad: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedAt(next.uppdaterad);
    }, 500);
    return () => clearTimeout(t);
  }, [draft, STORAGE_KEY]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  /* validering per steg */
  const errors = useMemo(() => {
    const e: string[][] = [[], [], [], [], []];
    if (draft.bankid !== "verifierad") e[0].push("BankID krävs");
    if (!draft.namn) e[0].push("Namn saknas");
    if (!/^\S+@\S+\.\S+$/.test(draft.epost)) e[0].push("Giltig e-post krävs");
    if (!draft.telefon) e[0].push("Telefon krävs");

    if (!draft.finansiering) e[1].push("Välj finansiering");
    if (!draft.budgetOk) e[1].push("Bekräfta budget");
    if (!draft.ucMedgivande) e[1].push("Medge UC-kontroll");

    if (!draft.erfarenhet) e[2].push("Välj erfarenhetsnivå");
    if (!draft.tidsplan) e[2].push("Välj tidsplan");

    if (draft.meddelande.length < 40) e[3].push("Skriv minst 40 tecken till säljaren");

    if (!draft.godkanner) e[4].push("Godkänn villkoren");
    return e;
  }, [draft]);

  const kanGaVidare = errors[step].length === 0;
  const alltOk = errors.every((e) => e.length === 0);

  const reset = () => {
    if (!confirm("Radera utkast?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setDraft(TOM);
    setStep(0);
  };

  const skicka = () => {
    if (!alltOk) return;
    localStorage.removeItem(STORAGE_KEY);
    const interests = readBuyerInterests();
    const interest = {
      id: `bi-${Date.now()}`,
      annonsId: id,
      kKod: genereraKKod(),
      status: "väntar-pdf" as const,
      skapadAt: new Date().toISOString(),
    };
    writeBuyerInterests([...interests, interest]);
    nav({ to: "/annons/$id/underlag", params: { id } });
  };

  /* ---------- WIZARD ---------- */
  return (
    <PublicLayout>
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/annons/$id" params={{ id }} className="hover:underline">
          ← Tillbaka till annonsen
        </Link>
      </div>

      <PageHeader
        eyebrow={`Anmäl intresse · Annons #${id}`}
        title="Intresseanmälan — 5 steg"
        subtitle="Gratis. Du binder dig inte. TreLink kontaktar dig efter granskning."
        right={
          <div className="flex items-center gap-2">
            {savedAt && (
              <Annotation>
                Sparat {new Date(savedAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
              </Annotation>
            )}
            <WireBtn variant="ghost" onClick={reset}>
              Radera utkast
            </WireBtn>
          </div>
        }
      />

      {/* Stepper */}
      <div className="mb-8">
        <div className="mb-3 h-1 w-full bg-muted">
          <div
            className="h-1 bg-foreground transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <ol className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {STEPS.map((s, i) => {
            const aktiv = i === step;
            const klar = i < step && errors[i].length === 0;
            return (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={`flex w-full flex-col items-start gap-1 border p-2 text-left text-xs transition ${
                    aktiv
                      ? "border-foreground bg-foreground/5"
                      : klar
                      ? "border-foreground/40"
                      : "border-dashed border-muted-foreground/40"
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Steg {s.n} {klar ? <Check className="inline-block h-3 w-3 align-middle" /> : null}
                  </span>
                  <span className="font-medium">{s.k}</span>
                  <span className="text-muted-foreground">{s.b}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* STEG 1 */}
          {step === 0 && (
            <WireBox label="Identitet & kontakt">
              <div className="mb-4 flex items-center justify-between border border-dashed border-muted-foreground/40 p-3">
                <div>
                  <Annotation>BankID-verifiering</Annotation>
                  <p className="mt-1 text-sm">
                    {draft.bankid === "verifierad"
                      ? <><Check className="inline-block h-3.5 w-3.5 mr-1 align-middle" />Verifierad som privatperson</>
                      : "Verifiera dig en gång — gäller alla framtida intressen."}
                  </p>
                </div>
                {draft.bankid === "verifierad" ? (
                  <WireTag>Verifierad</WireTag>
                ) : (
                  <WireBtn
                    onClick={() => {
                      set("bankid", "verifierad");
                      if (!draft.namn) set("namn", "Anna Andersson");
                    }}
                  >
                    Starta BankID
                  </WireBtn>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Namn"
                  value={draft.namn}
                  onChange={(v) => set("namn", v)}
                  placeholder="Anna Andersson"
                  hint="Hämtas från BankID — kan inte ändras"
                />
                <Field
                  label="E-post"
                  value={draft.epost}
                  onChange={(v) => set("epost", v)}
                  placeholder="anna@exempel.se"
                  type="email"
                />
                <Field
                  label="Telefon"
                  value={draft.telefon}
                  onChange={(v) => set("telefon", v)}
                  placeholder="+46 70 123 45 67"
                />
                <Field
                  label="Företag (frivilligt)"
                  value={draft.bransch}
                  onChange={(v) => set("bransch", v)}
                  placeholder="AB / Org.nr"
                />
              </div>
            </WireBox>
          )}

          {/* STEG 2 */}
          {step === 1 && (
            <WireBox label="Finansiering">
              <Annotation>Hur planerar du att betala?</Annotation>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                <RadioCard
                  label="Egna medel"
                  hint="Likvida pengar finns"
                  selected={draft.finansiering === "egna"}
                  onClick={() => set("finansiering", "egna")}
                />
                <RadioCard
                  label="Banklån / förvärvslån"
                  hint="Förhandsbesked från bank"
                  selected={draft.finansiering === "lan"}
                  onClick={() => set("finansiering", "lan")}
                />
                <RadioCard
                  label="Investerare / partner"
                  hint="Kapital via tredje part"
                  selected={draft.finansiering === "investerare"}
                  onClick={() => set("finansiering", "investerare")}
                />
              </div>

              <div className="mt-6 border border-dashed border-muted-foreground/40 p-4">
                <Annotation>Budgetbekräftelse</Annotation>
                <p className="mt-2 text-sm">
                  Pris: <span className="font-mono">{PRIS.toLocaleString("sv-SE")} kr</span>
                  <br />
                  Handpenning vid signering (10 %):{" "}
                  <span className="font-mono">{HANDPENNING.toLocaleString("sv-SE")} kr</span>
                </p>
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.budgetOk}
                    onChange={(e) => set("budgetOk", e.target.checked)}
                    className="mt-1"
                  />
                  <span>Jag bekräftar att jag kan finansiera köpet inkl. handpenning.</span>
                </label>
              </div>

              <label className="mt-4 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.ucMedgivande}
                  onChange={(e) => set("ucMedgivande", e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Jag medger att TreLink tar en UC-kontroll på mig som en del av granskningen.
                  <span className="block text-xs text-muted-foreground">
                    Krävs innan din profil visas för säljaren. Kostnadsfritt för dig.
                  </span>
                </span>
              </label>
            </WireBox>
          )}

          {/* STEG 3 */}
          {step === 2 && (
            <WireBox label="Erfarenhet & tidsplan">
              <Annotation>Branscherfarenhet</Annotation>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                <RadioCard
                  label="Ingen tidigare"
                  hint="Första företaget"
                  selected={draft.erfarenhet === "ingen"}
                  onClick={() => set("erfarenhet", "ingen")}
                />
                <RadioCard
                  label="Viss erfarenhet"
                  hint="Drivit / lett bolag"
                  selected={draft.erfarenhet === "viss"}
                  onClick={() => set("erfarenhet", "viss")}
                />
                <RadioCard
                  label="Stor erfarenhet"
                  hint="Köpt verksamhet förr"
                  selected={draft.erfarenhet === "stor"}
                  onClick={() => set("erfarenhet", "stor")}
                />
              </div>

              <div className="mt-6">
                <Annotation>När vill du tillträda?</Annotation>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                  <RadioCard
                    label="Snarast (< 3 mån)"
                    selected={draft.tidsplan === "snarast"}
                    onClick={() => set("tidsplan", "snarast")}
                  />
                  <RadioCard
                    label="3–6 månader"
                    selected={draft.tidsplan === "3-6mn"}
                    onClick={() => set("tidsplan", "3-6mn")}
                  />
                  <RadioCard
                    label="6+ månader"
                    selected={draft.tidsplan === "6+mn"}
                    onClick={() => set("tidsplan", "6+mn")}
                  />
                </div>
              </div>
            </WireBox>
          )}

          {/* STEG 4 */}
          {step === 3 && (
            <WireBox label="Meddelande till säljaren">
              <Annotation>Varför just du? (säljaren läser detta efter UC)</Annotation>
              <textarea
                value={draft.meddelande}
                onChange={(e) => set("meddelande", e.target.value)}
                rows={8}
                placeholder="Berätta kort om dig, varför verksamheten passar dig och dina planer framåt. (min 40 tecken)"
                className="mt-2 w-full border border-dashed border-muted-foreground/50 bg-background p-3 text-sm focus:border-foreground focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{draft.meddelande.length} tecken</span>
                <span>{draft.meddelande.length >= 40 ? <><Check className="inline-block h-3.5 w-3.5 mr-1 align-middle" />Tillräckligt</> : "Minst 40 tecken"}</span>
              </div>

              <Annotation>
                <span className="mt-4 block">
                  Tips: säljare väljer ofta köpare på driv och plan — inte högsta budet.
                </span>
              </Annotation>
            </WireBox>
          )}

          {/* STEG 5 */}
          {step === 4 && (
            <WireBox label="Granska & skicka">
              <div className="space-y-1">
                <Row k="BankID" v={draft.bankid === "verifierad" ? "Verifierad" : ""} />
                <Row k="Namn" v={draft.namn} />
                <Row k="E-post" v={draft.epost} />
                <Row k="Telefon" v={draft.telefon} />
                <Row
                  k="Finansiering"
                  v={
                    draft.finansiering === "egna"
                      ? "Egna medel"
                      : draft.finansiering === "lan"
                      ? "Banklån"
                      : draft.finansiering === "investerare"
                      ? "Investerare"
                      : ""
                  }
                />
                <Row k="Budget bekräftad" v={draft.budgetOk ? "Ja" : ""} />
                <Row k="UC-medgivande" v={draft.ucMedgivande ? "Ja" : ""} />
                <Row
                  k="Erfarenhet"
                  v={
                    draft.erfarenhet === "ingen"
                      ? "Ingen"
                      : draft.erfarenhet === "viss"
                      ? "Viss"
                      : draft.erfarenhet === "stor"
                      ? "Stor"
                      : ""
                  }
                />
                <Row
                  k="Tidsplan"
                  v={
                    draft.tidsplan === "snarast"
                      ? "Snarast"
                      : draft.tidsplan === "3-6mn"
                      ? "3–6 mån"
                      : draft.tidsplan === "6+mn"
                      ? "6+ mån"
                      : ""
                  }
                />
                <Row k="Meddelande" v={`${draft.meddelande.length} tecken`} />
              </div>

              <label className="mt-6 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.godkanner}
                  onChange={(e) => set("godkanner", e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Jag godkänner Trelinks villkor och att uppgifterna delas med TreLink samt
                  (anonymiserat) med säljaren.
                </span>
              </label>
            </WireBox>
          )}

          {/* Felruta */}
          {errors[step].length > 0 && (
            <WireBox variant="dashed">
              <Annotation>Att åtgärda i detta steg</Annotation>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {errors[step].map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </WireBox>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <WireBtn
              variant="ghost"
              onClick={() => (step === 0 ? nav({ to: "/annons/$id", params: { id } }) : setStep(step - 1))}
            >
              ← Tillbaka
            </WireBtn>
            {step < STEPS.length - 1 ? (
              <WireBtn
                onClick={() => kanGaVidare && setStep(step + 1)}
                className={!kanGaVidare ? "opacity-40 pointer-events-none" : ""}
              >
                Nästa →
              </WireBtn>
            ) : (
              <WireBtn
                onClick={skicka}
                className={!alltOk ? "opacity-40 pointer-events-none" : ""}
              >
                Skicka intresseanmälan →
              </WireBtn>
            )}
          </div>
        </div>

        {/* Sidopanel */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <WireBox label="Du anmäler intresse för" variant="dashed">
            <p className="text-sm font-medium">Restauranglokal · 180 m² · Hornstull</p>
            <p className="mt-1 font-mono text-lg">{PRIS.toLocaleString("sv-SE")} kr</p>
            <Link
              to="/annons/$id"
              params={{ id }}
              className="mt-2 inline-block text-xs text-muted-foreground hover:underline"
            >
              Se annons →
            </Link>
          </WireBox>

          <WireBox label="Vad TreLink ser">
            <ul className="space-y-2 text-xs">
              {[
                ["Identitet & UC", draft.bankid === "verifierad" && draft.ucMedgivande],
                ["Finansieringsplan", !!draft.finansiering && draft.budgetOk],
                ["Erfarenhet & tidsplan", !!draft.erfarenhet && !!draft.tidsplan],
                ["Personligt meddelande", draft.meddelande.length >= 40],
              ].map(([t, ok]) => (
                <li key={t as string} className="flex items-center gap-2">
                  <StatusDot state={ok ? "done" : "pending"} />
                  <span className={ok ? "" : "text-muted-foreground"}>{t}</span>
                </li>
              ))}
            </ul>
          </WireBox>

          <WireBox label="Integritet" variant="ghost">
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>· Säljaren ser aldrig din e-post eller telefon innan signering.</li>
              <li>· UC-kontrollen syns bara för TreLink.</li>
              <li>· Du kan dra tillbaka intresseanmälan när som helst.</li>
            </ul>
          </WireBox>
        </aside>
      </div>
    </PublicLayout>
  );
}
