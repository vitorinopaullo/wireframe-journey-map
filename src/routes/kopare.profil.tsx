import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { WireBox, PageHeader, WireField, WireBtn, WireTag, Annotation } from "@/components/wire";
import { getSession, getAccountByUserId, upsertAdminAccount } from "@/lib/mock-auth";
import { FileUploadRow } from "@/components/FileUploadRow";
import { Check } from "lucide-react";

function isSafeNext(v: string | undefined): v is string {
  return !!v && v.startsWith("/") && !v.startsWith("//");
}

export const Route = createFileRoute("/kopare/profil")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({
    ...(typeof s.next === "string" ? { next: s.next } : {}),
  }),
  component: Profile,
});

function EditableField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex h-11 w-full items-center rounded-button border border-foreground/15 bg-card px-3 text-sm transition-colors duration-150 focus:border-[var(--color-interactive)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/40"
      />
    </label>
  );
}

function Profile() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const session = getSession();
  const account = getAccountByUserId(session?.userId);
  const fullName = session?.bankid ? `${session.bankid.fornamn} ${session.bankid.efternamn}` : "—";
  const [bolag, setBolag] = useState(() => account?.profil?.bolag ?? "");
  const [orgnr, setOrgnr] = useState(() => account?.profil?.orgnr ?? "");
  const [foretagspresentation, setForetagspresentation] = useState(
    () => account?.profil?.foretagspresentation ?? "",
  );
  const [bolagSparat, setBolagSparat] = useState(false);
  const bolagKravsForKop = isSafeNext(next);

  const sparaBolag = () => {
    if (!session) return;
    upsertAdminAccount(session.userId, {
      profil: { ...account?.profil, bolag, orgnr },
    });
    setBolagSparat(true);
    if (bolagKravsForKop) {
      navigate({ to: next });
    }
  };

  return (
    <AppLayout mode="kopare">
      <PageHeader
        eyebrow="Köparläge · Profil"
        title={fullName}
        subtitle="Dina uppgifter delas aldrig med säljare innan signering. TreLink ser endast det som behövs för granskning."
        right={
          <div className="flex flex-col items-end gap-2">
            <WireTag>
              BankID <Check className="inline-block h-3 w-3 align-middle" />
            </WireTag>
            <Annotation>Medlem sedan jan 2026</Annotation>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WireBox label="Personuppgifter">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <WireField label="Namn" placeholder={fullName} hint="Hämtat från BankID — ej redigerbart" />
              <WireField label="E-post" placeholder={account?.profil?.epost || "—"} />
              <WireField label="Telefon" placeholder={account?.profil?.telefon || "—"} />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Annotation>Kommer snart</Annotation>
              <WireBtn
                variant="ghost"
                disabled
                className="cursor-not-allowed border-muted-foreground/30 text-muted-foreground"
              >
                Ångra
              </WireBtn>
              <WireBtn
                variant="secondary"
                disabled
                className="cursor-not-allowed border-muted-foreground/30 text-muted-foreground"
              >
                Spara ändringar
              </WireBtn>
            </div>
          </WireBox>
        </div>
        <aside>
          <WireBox label="Företag (frivilligt)">
            <p className="mb-3 text-sm text-muted-foreground">
              Du behöver inget bolag för att komma igång. När du anmäler intresse för ett objekt
              frågar vi om du redan har ett bolag, vill köpa ett hyllbolag, eller vill starta ett
              nytt.
            </p>
            <div className="space-y-3">
              <EditableField label="Företagsnamn" value={bolag} onChange={setBolag} placeholder="Anna Restauranger AB" />
              <EditableField label="Org.nr" value={orgnr} onChange={setOrgnr} placeholder="556677-8899" />
              <Annotation>
                <span className="mt-1 block">
                  Lägg till org.nr om du redan har ett bolag — sparar tid vid nästa affär.
                </span>
              </Annotation>
              <WireBtn onClick={sparaBolag}>
                {bolagKravsForKop ? "Spara och fortsätt →" : "Spara"}
              </WireBtn>
              {bolagSparat && !bolagKravsForKop && (
                <Annotation>
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3 w-3" /> Sparat
                  </span>
                </Annotation>
              )}
              <div className="border-t border-foreground/10 pt-3">
                <FileUploadRow
                  label="Företagspresentation (frivilligt)"
                  fileName={foretagspresentation}
                  onUpload={(filnamn) => {
                    if (!session) return;
                    upsertAdminAccount(session.userId, {
                      profil: { ...account?.profil, foretagspresentation: filnamn },
                    });
                    setForetagspresentation(filnamn);
                  }}
                />
                <Annotation>
                  <span className="mt-1 block">
                    Kan hjälpa till att snabba upp granskningen senare — krävs inte nu.
                  </span>
                </Annotation>
              </div>
            </div>
          </WireBox>
        </aside>
      </div>
    </AppLayout>
  );
}
