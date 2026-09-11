import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { WireBox, PageHeader, WireTag, WireBtn, Annotation } from "@/components/wire";
import { markKategoriRead } from "@/lib/admin-notiser";
import { Check } from "lucide-react";
import {
  readBuyerInterests,
  patchBuyerInterest,
  STORAGE_KEY as KOPARE_STORAGE_KEY,
  type BuyerInterest,
} from "@/lib/kopare-workflow";
import {
  buildAffarer,
  buildAvslutade,
  granskningKandidater,
  STEG_LABEL,
  type Vantar,
  type Affar,
} from "@/lib/affar-workflow";
import { readAnnonser, STORAGE_KEY as ANNONS_STORAGE_KEY } from "@/lib/annons-workflow";
import { getAccountByUserId } from "@/lib/mock-auth";
import { formatArendeRef, formatDatum } from "@/lib/format";

export const Route = createFileRoute("/admin/affarer/")({
  component: AdminAffarer,
});

function VantarTag({ v }: { v: Vantar }) {
  const map: Record<Vantar, string> = {
    dig: "Väntar på köparen",
    george: "Väntar på TreLink",
    saljare: "Väntar på säljare",
    hyresvard: "Väntar på hyresvärd",
    ingen: "—",
  };
  if (v === "george") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]" />
        {map[v]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      <span className="inline-block h-2 w-2 rounded-full border border-foreground/50 bg-background" />
      {map[v]}
    </span>
  );
}

function AffarsRad({ a }: { a: Affar }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate({ to: "/admin/affarer/$id", params: { id: a.id } })}
      className="cursor-pointer"
    >
      <WireBox className="flex flex-col gap-1 transition-colors duration-500 hover:border-foreground md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <WireTag>{a.kat}</WireTag>
            <span className="text-xs text-muted-foreground">{a.ort}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{formatArendeRef(a.id)}</span>
          </div>
          <h3 className="font-medium">{a.titel}</h3>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
            <span>
              {a.pris} · uppdaterad {a.uppdaterad}
            </span>
            <span>Steg: {STEG_LABEL[a.steg]}</span>
          </div>
        </div>
        <VantarTag v={a.vantar} />
      </WireBox>
    </div>
  );
}

type GranskningGrupp = {
  annonsId: string;
  titel: string;
  ort: string;
  kat: string;
};

/** Grupperar granskningssteget per annons — flera köpare kan konkurrera om
 * samma objekt, och de behöver gå att jämföra i ett svep. Övriga steg har
 * per definition bara en aktiv kandidat och förblir platta rader. */
function groupGranskning(affarer: Affar[]): { grupper: GranskningGrupp[]; ovriga: Affar[] } {
  const granskning = affarer.filter((a) => a.steg === "granskning");
  const ovriga = affarer.filter((a) => a.steg !== "granskning");
  const map = new Map<string, Affar>();
  for (const a of granskning) {
    if (!map.has(a.annonsId)) map.set(a.annonsId, a);
  }
  const grupper = [...map.values()].map((a) => ({
    annonsId: a.annonsId,
    titel: a.titel,
    ort: a.ort,
    kat: a.kat,
  }));
  return { grupper, ovriga };
}

function GranskningKandidatRad({ annonsId, interestId }: { annonsId: string; interestId: string }) {
  const kandidat = granskningKandidater(annonsId).find((k) => k.interestId === interestId);
  if (!kandidat) return null;
  const account = getAccountByUserId(kandidat.userId);
  const bolag = account?.profil?.bolag;
  const orgnr = account?.profil?.orgnr;
  return (
    <tr className="transition-colors duration-150 hover:bg-muted/20">
      <td className="px-3 py-2">
        {account ? (
          <Link
            to="/admin/anvandare/$id"
            params={{ id: account.id }}
            className="text-sm underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
          >
            {account.bankid.fornamn} {account.bankid.efternamn}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">Okänt konto</span>
        )}
      </td>
      <td className="px-3 py-2 font-mono">{kandidat.kKod}</td>
      <td className="px-3 py-2">
        {bolag ? (
          <span className="text-sm">
            {bolag}
            {orgnr && <span className="text-muted-foreground"> · {orgnr}</span>}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Ej ifyllt</span>
        )}
      </td>
      <td className="px-3 py-2">
        {kandidat.foretagspresentation ? (
          <span className="flex items-center gap-1 text-sm">
            <Check className="h-3.5 w-3.5" /> Uppladdad
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Väntar på uppladdning</span>
        )}
      </td>
    </tr>
  );
}

function GranskningGruppKort({ grupp }: { grupp: GranskningGrupp }) {
  const kandidater = granskningKandidater(grupp.annonsId);
  return (
    <details className="group border border-foreground/30 bg-background">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <WireTag>{grupp.kat}</WireTag>
            <span className="text-xs text-muted-foreground">{grupp.ort}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatArendeRef(grupp.annonsId)}
            </span>
          </div>
          <h3 className="font-medium">{grupp.titel}</h3>
        </div>
        <div className="flex items-center gap-2">
          <WireTag>
            {kandidater.length} kandidat{kandidater.length === 1 ? "" : "er"}
          </WireTag>
          <span className="font-mono text-xs text-muted-foreground transition group-open:rotate-45">
            +
          </span>
        </div>
      </summary>
      <div className="overflow-x-auto border-t border-foreground/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/30 bg-muted/30">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                Köpare
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                Köpar-ID
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                Bolag
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.02em] text-muted-foreground">
                Företagspresentation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-muted-foreground/30">
            {kandidater.map((k) => (
              <GranskningKandidatRad
                key={k.interestId}
                annonsId={grupp.annonsId}
                interestId={k.interestId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function PubliceradRad({ item }: { item: any }) {
  const navigate = useNavigate();
  const titel = item.workflow?.utkast?.rubrik || item.titel || "—";
  return (
    <div
      onClick={() => navigate({ to: "/admin/annonser/$id", params: { id: item.id } })}
      className="cursor-pointer"
    >
      <WireBox className="flex flex-col gap-1 transition-colors hover:border-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">{formatArendeRef(item.id)}</span>
        </div>
        <h3 className="font-medium">{titel}</h3>
        <Annotation>
          {item.draft?.adress || "Ingen adress angiven"} ·{" "}
          {item.pris ? `${item.pris} kr` : "Pris ej satt"} · publicerad{" "}
          {formatDatum(item.workflow?.publiceradAt)}
        </Annotation>
      </WireBox>
    </div>
  );
}

function AdminAffarer() {
  const [interests, setInterests] = useState<BuyerInterest[]>(() => readBuyerInterests());
  const [annonser, setAnnonser] = useState<any[]>(() => readAnnonser());
  const [tab, setTab] = useState<"affarer" | "publicerade">("affarer");

  useEffect(() => {
    markKategoriRead("affarer");
  }, []);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === KOPARE_STORAGE_KEY) setInterests(readBuyerInterests());
      if (e.key === ANNONS_STORAGE_KEY) setAnnonser(readAnnonser());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const affarer = useMemo(() => buildAffarer(interests), [interests]);
  const avslutade = useMemo(() => buildAvslutade(interests, "admin"), [interests]);
  const { grupper, ovriga } = useMemo(() => groupGranskning(affarer), [affarer]);

  function toggleRemarketing(id: string) {
    patchBuyerInterest(id, (item) => ({ ...item, remarketingTag: !item.remarketingTag }));
    setInterests(readBuyerInterests());
  }
  const publicerade = useMemo(
    () => annonser.filter((a) => a.workflow?.state === "publicerad" && !a.reserverad),
    [annonser],
  );

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="TreLink Admin"
        title="Affärer/Uppdrag"
        subtitle="Alla pågående och avslutade affärer, över samtliga säljare och köpare."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <WireTag active={tab === "affarer"} onClick={() => setTab("affarer")}>
          Affärer ({affarer.length + avslutade.length})
        </WireTag>
        <WireTag active={tab === "publicerade"} onClick={() => setTab("publicerade")}>
          Publicerade annonser ({publicerade.length})
        </WireTag>
      </div>

      {tab === "affarer" ? (
        affarer.length === 0 && avslutade.length === 0 ? (
          <WireBox variant="dashed">
            <Annotation>Inga aktiva affärer än.</Annotation>
          </WireBox>
        ) : (
          <div className="space-y-6">
            {(grupper.length > 0 || ovriga.length > 0) && (
              <div className="space-y-3">
                {grupper.map((grupp) => (
                  <GranskningGruppKort key={grupp.annonsId} grupp={grupp} />
                ))}
                {ovriga.map((a) => (
                  <AffarsRad key={a.id} a={a} />
                ))}
              </div>
            )}

            {avslutade.length > 0 && (
              <div>
                <Annotation>Avslutade</Annotation>
                <div className="mt-3 space-y-3">
                  {avslutade.map((a) => (
                    <WireBox key={a.id} className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{a.titel}</h3>
                        <Annotation>
                          {formatArendeRef(a.id)} · {a.pris} · {a.resultat}
                        </Annotation>
                      </div>
                      {a.typ === "avbojt" &&
                        (a.remarketingTag ? (
                          <span className="flex shrink-0 items-center gap-1 text-sm">
                            <Check className="h-3.5 w-3.5" /> Märkt
                          </span>
                        ) : (
                          <WireBtn variant="secondary" onClick={() => toggleRemarketing(a.id)}>
                            Märk för ombokning
                          </WireBtn>
                        ))}
                    </WireBox>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : publicerade.length === 0 ? (
        <WireBox variant="dashed">
          <Annotation>Inga publicerade annonser än.</Annotation>
        </WireBox>
      ) : (
        <div className="space-y-3">
          {publicerade.map((item) => (
            <PubliceradRad key={item.id} item={item} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
