import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import {
  WireBox,
  PageHeader,
  WireBtn,
  WireField,
  Annotation,
  WireTag,
  StatusDot,
} from "@/components/wire";
import { getSession, upsertAdminAccount, updateSession } from "@/lib/mock-auth";

function isSafeNext(v: string | undefined): v is string {
  return !!v && v.startsWith("/") && !v.startsWith("//");
}

export const Route = createFileRoute("/onboarding")({
  validateSearch: (s: Record<string, unknown>): { next?: string; role?: "kopare" | "saljare" } => ({
    ...(typeof s.next === "string" ? { next: s.next } : {}),
    ...((s.role === "kopare" || s.role === "saljare") ? { role: s.role } : {}),
  }),
  component: Onboarding,
});

type Role = "kopare" | "saljare" | null;
type Step = 1 | 2;

// Läses av Grunduppgifter-sidan i ett senare steg.
const ONBOARDING_SALJARE_KEY = "trelink-onboarding-saljare-uppgifter";

function Onboarding() {
  const { next, role: roleParam } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role>(null);
  const [session, setSessionState] = useState(() => getSession());

  useEffect(() => {
    const s = getSession();
    setSessionState(s);
    if (!s) {
      navigate({ to: "/logga-in" });
      return;
    }
    if (roleParam && role === null) {
      setRole(roleParam);
      upsertAdminAccount(s.userId, { role: roleParam });
      setStep(2);
    }
  }, [navigate, roleParam, role]);

  const bankid = session?.bankid;

  const steps = [
    { n: 1, label: "Välj roll" },
    { n: 2, label: "Dina uppgifter" },
  ] as const;

  function handleRoleChosen() {
    if (!role || !session) return;
    upsertAdminAccount(session.userId, { role });
    setStep(2);
  }

  function handleFinish(profil: Record<string, string>) {
    if (!role || !bankid || !session) return;
    updateSession({ role });
    upsertAdminAccount(session.userId, { role, profil });
    if (isSafeNext(next)) {
      window.location.href = next;
      return;
    }
    navigate({ to: "/dashboard", search: { mode: role } });
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow={`Onboarding · steg ${step} av 2`}
        title="Sätt upp ditt konto"
        subtitle="Ett konto — två lägen. Du kan alltid växla mellan köpare och säljare senare. Informationen du fyller i följer med respektive läge."
        right={
          <div className="flex flex-col items-end gap-1">
            <WireTag>BankID ✓</WireTag>
            {bankid && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {bankid.fornamn} {bankid.efternamn} · {bankid.personnr}
              </span>
            )}
          </div>
        }
      />

      {role && step === 2 && (
        <div className="mb-6 flex items-center gap-2 border border-dashed border-muted-foreground/40 bg-muted/20 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Du registrerar dig som
          </span>
          <WireTag active>{role === "kopare" ? "Köpare" : "Säljare/Överlåtare"}</WireTag>
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-2">
        {steps.map((s) => {
          const state = s.n < step ? "done" : s.n === step ? "active" : "pending";
          return (
            <div
              key={s.n}
              className="flex items-center gap-2 border border-dashed border-muted-foreground/40 p-3"
            >
              <StatusDot state={state as "done" | "active" | "pending"} />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Steg {s.n}
                </div>
                <div className="text-sm">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <Step1
          role={role}
          onPick={(r) => setRole(r)}
          onNext={handleRoleChosen}
        />
      )}

      {step === 2 && role && bankid && session && (
        <Step2
          role={role}
          bankid={bankid}
          userId={session.userId}
          onBack={() => setStep(1)}
          onFinish={handleFinish}
        />
      )}
    </PublicLayout>
  );
}


function Step1({
  role,
  onPick,
  onNext,
}: {
  role: Role;
  onPick: (r: "kopare" | "saljare") => void;
  onNext: () => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RoleCard
          active={role === "kopare"}
          title="Jag vill köpa"
          tagline="Hitta en verksamhet, lokal eller bolag att ta över."
          bullets={[
            "Spara favoriter och jämför objekt",
            "Bevakningar på nya annonser",
            "BankID-verifiering vid intresseanmälan",
          ]}
          onPick={() => onPick("kopare")}
        />
        <RoleCard
          active={role === "saljare"}
          title="Jag vill sälja"
          tagline="Publicera en annons för din verksamhet eller lokal."
          bullets={[
            "Gratis att annonsera",
            "Avgift 29 500 – 79 500 kr först vid genomförd affär",
            "TreLink granskar och driver processen",
          ]}
          onPick={() => onPick("saljare")}
        />
      </div>

      <WireBox variant="dashed" className="mt-6">
        <Annotation>Bra att veta</Annotation>
        <p className="mt-2 text-sm text-muted-foreground">
          Ditt val nu bestämmer bara vilket <em>startläge</em> du hamnar i. Du
          kan alltid växla till det andra läget uppe i headern — utan att
          registrera dig igen.
        </p>
      </WireBox>

      <NavBar
        primary={
          <WireBtn
            variant={role ? "primary" : "ghost"}
            onClick={role ? onNext : undefined}
          >
            Fortsätt →
          </WireBtn>
        }
      />
    </>
  );
}

function RoleCard({
  active,
  title,
  tagline,
  bullets,
  onPick,
}: {
  active: boolean;
  title: string;
  tagline: string;
  bullets: string[];
  onPick: () => void;
}) {
  return (
    <button
      onClick={onPick}
      className={`rounded-card text-left border p-6 shadow-sm transition-shadow duration-150 ease-standard active:scale-[0.99] ${
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-white)]"
          : "border-foreground/15 hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title}</h3>
        {active ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <StatusDot state="pending" />
        )}
      </div>
      <p className={`mt-2 text-sm ${active ? "text-background/70" : "text-muted-foreground"}`}>
        {tagline}
      </p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className={active ? "text-background/70" : "text-muted-foreground"}>·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

function Step2({
  role,
  bankid,
  userId,
  onBack,
  onFinish,
}: {
  role: "kopare" | "saljare";
  bankid: { fornamn: string; efternamn: string; personnr: string };
  userId: string;
  onBack: () => void;
  onFinish: (profil: Record<string, string>) => void;
}) {
  const [telefon, setTelefon] = useState("");
  const [epost, setEpost] = useState("");
  const [ort, setOrt] = useState("");
  const [adress, setAdress] = useState("");
  const [bolag, setBolag] = useState("");
  const [orgnr, setOrgnr] = useState("");
  const [presentation, setPresentation] = useState("");

  const [arFirmatecknare, setArFirmatecknare] = useState(true);
  const [ftRoll, setFtRoll] = useState("");
  const [ftFornamn, setFtFornamn] = useState("");
  const [ftEfternamn, setFtEfternamn] = useState("");
  const [ftMail, setFtMail] = useState("");
  const [ftMobil, setFtMobil] = useState("");

  const [adressTouched, setAdressTouched] = useState(false);
  const [orgnrTouched, setOrgnrTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const ORGNR_REGEX = /^\d{6}-\d{4}$/;
  const adressSaknas = role === "saljare" && adress.trim() === "";
  const orgnrFelFormat = orgnr.trim() !== "" && !ORGNR_REGEX.test(orgnr.trim());
  const adressError = (adressTouched || submitAttempted) && adressSaknas ? "Adress krävs." : undefined;
  const orgnrError =
    (orgnrTouched || submitAttempted) && orgnrFelFormat ? "Ogiltigt format. Ange som XXXXXX-XXXX." : undefined;

  const kanFortsatta = telefon.trim() && epost.trim() && !adressSaknas && !orgnrFelFormat;


  function submit() {
    setSubmitAttempted(true);
    if (!kanFortsatta) return;

    if (role === "saljare") {
      localStorage.setItem(
        `${ONBOARDING_SALJARE_KEY}:${userId}`,
        JSON.stringify({
          bolagsuppgifter: { bolag, orgnr, ort, adress, presentation },
          saljaruppgifter: {
            fornamn: bankid.fornamn,
            efternamn: bankid.efternamn,
            mobil: telefon,
            epost,
          },
          firmatecknare: arFirmatecknare
            ? null
            : { roll: ftRoll, fornamn: ftFornamn, efternamn: ftEfternamn, mail: ftMail, mobil: ftMobil },
        }),
      );
    }

    onFinish({
      fornamn: bankid.fornamn,
      efternamn: bankid.efternamn,
      personnr: bankid.personnr,
      telefon,
      epost,
      ...(role === "saljare" && { ort, adress }),
      ...(bolag && { bolag }),
      ...(orgnr && { orgnr }),
      ...(presentation && { presentation }),
      ...(role === "saljare" && { arFirmatecknare: arFirmatecknare ? "ja" : "nej" }),
      ...(role === "saljare" &&
        !arFirmatecknare && {
          ftRoll,
          ftFornamn,
          ftEfternamn,
          ftMail,
          ftMobil,
        }),
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {role === "kopare" ? (
            <>
              <WireBox label="Bolagsuppgifter">
                <div className="mb-3 flex items-center justify-between">
                  <Annotation>Frivilligt nu</Annotation>
                  <WireTag>Krävs innan köp</WireTag>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField label="Bolag" value={bolag} onChange={setBolag} placeholder="Anna Restauranger AB" />
                  <InputField label="Org.nr" value={orgnr} onChange={setOrgnr} placeholder="556677-8899" />
                  <div className="md:col-span-2">
                    <InputField
                      label="Företagspresentation"
                      value={presentation}
                      onChange={setPresentation}
                      placeholder="Kort beskrivning av bolag, ägare och bakgrund…"
                      multiline
                      hint="Frivilligt nu — hjälper säljare att välja dig. Måste vara på plats innan du kan slutföra ett köp."
                    />
                  </div>
                </div>
              </WireBox>

              <WireBox label="Köparuppgifter">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ReadonlyField label="Förnamn *" value={bankid.fornamn} hint="Från BankID" />
                  <ReadonlyField label="Efternamn *" value={bankid.efternamn} hint="Från BankID" />
                  <InputField label="Telefon *" value={telefon} onChange={setTelefon} placeholder="+46 70 123 45 67" />
                  <InputField label="E-post *" value={epost} onChange={setEpost} placeholder="namn@exempel.se" type="email" />
                </div>
              </WireBox>
            </>
          ) : (
            <>
              <WireBox label="Bolagsuppgifter">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField label="Bolag" value={bolag} onChange={setBolag} placeholder="Anna Restauranger AB" />
                  <InputField
                    label="Org.nr"
                    value={orgnr}
                    onChange={setOrgnr}
                    onBlur={() => setOrgnrTouched(true)}
                    placeholder="556677-8899"
                    error={orgnrError}
                  />
                  <InputField label="Ort" value={ort} onChange={setOrt} placeholder="Stockholm" />
                  <InputField
                    label="Adress *"
                    value={adress}
                    onChange={setAdress}
                    onBlur={() => setAdressTouched(true)}
                    placeholder="Storgatan 1, 113 27"
                    error={adressError}
                  />
                  <div className="md:col-span-2">
                    <InputField
                      label="Företagspresentation"
                      value={presentation}
                      onChange={setPresentation}
                      placeholder="Kort beskrivning av bolag, ägare och bakgrund…"
                      multiline
                      hint="Frivilligt — visas på dina annonser för att skapa förtroende."
                    />
                  </div>
                </div>
              </WireBox>

              <WireBox label="Säljar-/Överlåtaruppgifter">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ReadonlyField label="Förnamn *" value={bankid.fornamn} hint="Från BankID" />
                  <ReadonlyField label="Efternamn *" value={bankid.efternamn} hint="Från BankID" />
                  <InputField label="Mobil nr *" value={telefon} onChange={setTelefon} placeholder="+46 70 123 45 67" />
                  <InputField label="E-post *" value={epost} onChange={setEpost} placeholder="namn@exempel.se" type="email" />
                </div>

                <div className="mt-6 border-t border-dashed border-muted-foreground/40 pt-6">
                  <Annotation>Firmatecknare</Annotation>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <WireBtn
                      variant="secondary"
                      className={
                        arFirmatecknare
                          ? "!border-[var(--color-interactive)] !bg-[var(--color-interactive)]/10 !text-[var(--color-interactive)] hover:!opacity-100"
                          : ""
                      }
                      onClick={() => setArFirmatecknare(true)}
                    >
                      Jag är firmatecknare
                    </WireBtn>
                    <WireBtn
                      variant="secondary"
                      className={
                        !arFirmatecknare
                          ? "!border-[var(--color-interactive)] !bg-[var(--color-interactive)]/10 !text-[var(--color-interactive)] hover:!opacity-100"
                          : ""
                      }
                      onClick={() => setArFirmatecknare(false)}
                    >
                      Jag är inte firmatecknare
                    </WireBtn>
                  </div>
                </div>
              </WireBox>

              {!arFirmatecknare && (
                <WireBox label="Firmatecknarens uppgifter" variant="dashed">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField label="Roll" value={ftRoll} onChange={setFtRoll} placeholder="VD / Styrelseordförande" />
                    <InputField label="Förnamn" value={ftFornamn} onChange={setFtFornamn} placeholder="Förnamn" />
                    <InputField label="Efternamn" value={ftEfternamn} onChange={setFtEfternamn} placeholder="Efternamn" />
                    <InputField label="Mail" value={ftMail} onChange={setFtMail} placeholder="namn@exempel.se" type="email" />
                    <InputField label="Mobil" value={ftMobil} onChange={setFtMobil} placeholder="+46 70 123 45 67" />
                  </div>
                </WireBox>
              )}
            </>
          )}
        </div>

        <aside className="space-y-4">
          <WireBox label="Skickas till TreLink admin" variant="dashed">
            <p className="text-sm text-muted-foreground">
              När du sparar skickas ditt BankID-verifierade namn, personnummer och dessa uppgifter till TreLinks admin
              för granskning av nytt konto.
            </p>
          </WireBox>

          <WireBox label="Vad ser andra?" variant="ghost">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>· Motpart ser bara det som behövs — aldrig personnummer eller kontaktuppgifter innan match.</li>
              <li>· TreLink ser allt för att kunna granska.</li>
              <li>· Bolagspresentation visas i intresseanmälan.</li>
            </ul>
          </WireBox>

          {role === "kopare" && (
            <WireBox label="Varför frivilligt?" variant="dashed">
              <p className="text-sm text-muted-foreground">
                Många köpare startar bolag <em>i samband</em> med köpet. Du kan skapa konto och börja titta direkt —
                men innan handpenning och signering måste bolag och org.nr finnas på plats.
              </p>
            </WireBox>
          )}
        </aside>
      </div>

      <NavBar
        secondary={<WireBtn variant="ghost" onClick={onBack}>← Tillbaka</WireBtn>}
        primary={
          <WireBtn variant={kanFortsatta ? "primary" : "ghost"} onClick={submit}>
            Spara & skicka till TreLink →
          </WireBtn>
        }
      />
    </>
  );
}

function InputField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  hint,
  error,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-foreground/40 bg-background px-3 py-2 text-sm"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`h-11 w-full rounded-button border bg-background px-3 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 ${
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive/40"
              : "border-foreground/15 focus:border-[var(--color-interactive)] focus:ring-[var(--color-focus-ring)]/40"
          }`}
        />
      )}
      {error ? (
        <span className="mt-1 block font-mono text-[10px] text-destructive">{error}</span>
      ) : (
        hint && <span className="mt-1 block font-mono text-[10px] text-muted-foreground/70">{hint}</span>
      )}
    </label>
  );
}

function ReadonlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex h-10 items-center border border-dashed border-muted-foreground/50 bg-muted/20 px-3 text-sm">
        {value}
      </div>
      {hint && <span className="mt-1 block font-mono text-[10px] text-muted-foreground/70">{hint}</span>}
    </label>
  );
}


function NavBar({
  secondary,
  primary,
}: {
  secondary?: React.ReactNode;
  primary: React.ReactNode;
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-dashed border-muted-foreground/40 pt-6">
      <div>{secondary}</div>
      <div>{primary}</div>
    </div>
  );
}
