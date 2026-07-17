import { useEffect, useState } from "react";
import { WireBox, WireBtn, WireTag, Annotation, StatusDot } from "@/components/wire";
import { mockBankIdSample, signInWithBankId, type BankIdPayload } from "@/lib/mock-auth";

type Phase = "idle" | "startar" | "vantar" | "verifierar" | "klar";

export function BankIdPanel({
  label = "Logga in med BankID",
  hint,
  onDone,
}: {
  label?: string;
  hint?: string;
  onDone: (bankid: BankIdPayload) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [bankid, setBankid] = useState<BankIdPayload | null>(null);

  useEffect(() => {
    if (phase === "startar") {
      const t = setTimeout(() => setPhase("vantar"), 500);
      return () => clearTimeout(t);
    }
    if (phase === "vantar") {
      const t = setTimeout(() => setPhase("verifierar"), 1200);
      return () => clearTimeout(t);
    }
    if (phase === "verifierar") {
      const t = setTimeout(() => {
        const b = mockBankIdSample();
        setBankid(b);
        signInWithBankId(b);
        setPhase("klar");
      }, 900);
      return () => clearTimeout(t);
    }
    if (phase === "klar" && bankid) {
      const t = setTimeout(() => onDone(bankid), 400);
      return () => clearTimeout(t);
    }
  }, [phase, bankid, onDone]);

  const steg: { key: Phase; label: string }[] = [
    { key: "startar", label: "Öppnar BankID" },
    { key: "vantar", label: "Väntar på legitimering i appen" },
    { key: "verifierar", label: "Verifierar identitet" },
    { key: "klar", label: "Klar" },
  ];

  return (
    <WireBox label={label}>
      {hint && <p className="mb-4 text-sm text-muted-foreground">{hint}</p>}

      {phase === "idle" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center border border-dashed border-muted-foreground/40 bg-muted/20 p-8">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center border border-foreground font-mono text-2xl">
                ▮▮
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                BankID
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Prototyp — trycker du på knappen simuleras BankID-flödet.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <WireBtn onClick={() => setPhase("startar")}>Öppna BankID på denna enhet →</WireBtn>
            <WireBtn variant="secondary" onClick={() => setPhase("startar")}>
              BankID på annan enhet
            </WireBtn>
          </div>
          <Annotation>
            <span className="mt-2 block">
              Inga andra inloggningssätt finns. Alla parter på TreLink är verifierade med BankID.
            </span>
          </Annotation>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2 text-sm">
            {steg.map((s, i) => {
              const currentIdx = steg.findIndex((x) => x.key === phase);
              const state: "done" | "active" | "pending" =
                i < currentIdx ? "done" : i === currentIdx ? "active" : "pending";
              return (
                <li key={s.key} className="flex items-center gap-2">
                  <StatusDot state={state} />
                  <span className={state === "pending" ? "text-muted-foreground" : ""}>{s.label}</span>
                </li>
              );
            })}
          </ul>
          {bankid && phase === "klar" && (
            <div className="mt-3 border border-foreground/40 bg-muted/40 p-3 text-xs">
              <div className="mb-1 flex items-center gap-2">
                <WireTag>Verifierad</WireTag>
                <span className="font-mono">{bankid.personnr}</span>
              </div>
              <div>
                {bankid.fornamn} {bankid.efternamn}
              </div>
            </div>
          )}
        </div>
      )}
    </WireBox>
  );
}
