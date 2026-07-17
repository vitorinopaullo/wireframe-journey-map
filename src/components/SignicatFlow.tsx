import { useEffect, useState } from "react";

type Screen = "doc" | "start-modal" | "bankid" | "done";

export type SignicatSellerInfo = {
  bolag?: string;
  orgnr?: string;
  adress?: string;
  objektAdress?: string;
  utgangspris?: string;
};

export function SignicatFlow({
  open,
  seller,
  onCancel,
  onSigned,
}: {
  open: boolean;
  seller: SignicatSellerInfo;
  onCancel: () => void;
  onSigned: () => void;
}) {
  const [screen, setScreen] = useState<Screen>("doc");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (open) {
      setScreen("doc");
      setChecked(false);
    }
  }, [open]);

  useEffect(() => {
    if (screen !== "bankid") return;
    const t = setTimeout(() => setScreen("done"), 3000);
    return () => clearTimeout(t);
  }, [screen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-auto">
      {/* Cancel link top-left (always visible except done) */}
      {screen !== "done" && (
        <button
          onClick={onCancel}
          className="fixed left-4 top-4 z-[110] text-xs text-gray-500 hover:text-gray-900"
        >
          ✕ Avbryt signering
        </button>
      )}

      {(screen === "doc" || screen === "start-modal") && (
        <DocViewer
          seller={seller}
          onSign={() => setScreen("start-modal")}
          blurred={screen === "start-modal"}
        />
      )}

      {screen === "start-modal" && (
        <StartModal
          checked={checked}
          setChecked={setChecked}
          onCancel={() => setScreen("doc")}
          onContinue={() => setScreen("bankid")}
        />
      )}

      {screen === "bankid" && <BankIdScreen onCancel={() => setScreen("start-modal")} />}

      {screen === "done" && <DoneScreen seller={seller} onClose={onSigned} />}
    </div>
  );
}

/* ---------- Screen 1: Document viewer ---------- */
function DocViewer({
  seller,
  onSign,
  blurred,
}: {
  seller: SignicatSellerInfo;
  onSign: () => void;
  blurred: boolean;
}) {
  return (
    <div
      className={`min-h-screen ${blurred ? "blur-sm pointer-events-none" : ""}`}
      style={{ backgroundColor: "#FAFAFA", fontFamily: "Inter, sans-serif" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between bg-white px-6 py-3"
        style={{ borderBottom: "1px solid #E7E5E4" }}
      >
        <div className="text-sm text-black">100%</div>
        <div className="text-sm text-black">🌐 English</div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-black">More actions ▾</button>
          <button
            onClick={onSign}
            className="px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: "#0F0F0F", borderRadius: "3px" }}
          >
            Sign documents
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-6 p-6">
        {/* Document */}
        <div className="flex-1">
          <DocumentPage seller={seller} />
          {/* Page break */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ backgroundColor: "#E7E5E4" }} />
            <span className="text-[10px] uppercase tracking-widest text-black/60">Sida 2</span>
            <div className="h-px flex-1" style={{ backgroundColor: "#E7E5E4" }} />
          </div>
          <DocumentPage2 />
        </div>

        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-black">Documents</div>
          <div
            className="mt-3 bg-white p-4"
            style={{ border: "1px solid #E7E5E4", borderRadius: "3px" }}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-black">Uppdragsavtal</div>
              <span
                className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-black"
                style={{ border: "1px solid #0F0F0F", borderRadius: "3px" }}
              >
                Reading
              </span>
            </div>
            <div className="mt-2 text-xs text-black/60">2 sidor ›</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DocumentPage({ seller }: { seller: SignicatSellerInfo }) {
  return (
    <div
      className="mx-auto max-w-2xl bg-white p-10"
      style={{ border: "1px solid #E7E5E4", borderRadius: "3px" }}
    >
      <div className="mb-8 text-xl font-bold text-black">⬡ TreLink</div>

      <h1 className="mb-8 text-2xl font-bold text-black">Uppdragsavtal</h1>

      <Section title="Förmedlare">
        <p>George Kashou</p>
        <p>Trelink AB</p>
      </Section>

      <Section title="Uppdragsgivare">
        <p>{seller.bolag || "—"}</p>
        <p>Org.nr: {seller.orgnr || "—"}</p>
        <p>{seller.adress || "—"}</p>
      </Section>

      <Section title="Förmedlingsuppdrag">
        <p>
          Uppdragsgivaren är hyresgäst i nedanstående Förmedlingsobjekt. Uppdragsgivaren ger
          Förmedlaren med ensamrätt i uppdrag att överlåta nedanstående Förmedlingsobjekt.
        </p>
      </Section>

      <Section title="Förmedlingsobjekt">
        <p>Hyresrätten till lokalen {seller.objektAdress || seller.adress || "—"}.</p>
      </Section>

      <Section title="Utgångspris">
        <p>
          För förmedlingsarbetet gäller ett utgångspris för lokalen om{" "}
          {seller.utgangspris || "kronor"}, vilket uppdragsgivaren ej behöver acceptera och som kan
          komma att överskridas eller underskridas efter överenskommelse med uppdragsgivaren.
        </p>
      </Section>

      <Section title="Avtalstid">
        <p>
          Detta Uppdragsavtal är förenat med ensamrätt under en tid av tre (3) månader från och med
          att båda parter har undertecknat detta Uppdragsavtal.
        </p>
        <p>
          Om inte uppsägning sker senast tio (10) dagar före Avtalstidens utgång förlängs
          Uppdragsavtalet på oförändrade villkor med en (1) månad åt gången.
        </p>
        <p>
          Om Uppdragsgivaren ensidigt häver detta Uppdragsavtal under dess löptid, utan Mäklarens
          medgivande äger Mäklaren rätt till full Förmedlingsprovision.
        </p>
      </Section>

      <Section title="Förmedlingsprovision">
        <p>Förmedlingsprovision till Mäklaren utgår med 10% av årshyran, dock lägst 54 900 kr.</p>
        <p>Mervärdeskatt tillkommer på ovanstående Förmedlingsprovision.</p>
        <p>
          I det fall uppdragsavtalet har löpt ut gäller under en period om sex månader att full rätt
          till förmedlingsprovision föreligger, i det fall uppdragsgivaren själv eller på annat sätt
          finner en hyresgäst bland de intressenter som Mäklaren har haft dokumenterad kommunikation
          med gällande förmedlingsuppdraget.
        </p>
        <p>
          Skulle uppdragsgivaren under avtalstiden själv eller på annat sätt finna ny hyresgäst till
          förmedlingsobjektet har Mäklaren rätt till full förmedlingsprovision enligt detta avtal.
        </p>
        <p>
          Mäklarens rätt till förmedlingsprovision påverkas ej i det fall överlåtelsen inte sker på
          grund av Uppdragsgivaren eller dennes motparts avtalsbrott.
        </p>
      </Section>

      <div className="mt-10 text-center text-[11px] text-black/50">Trelink AB · GK25733 · 1/2</div>
    </div>
  );
}

function DocumentPage2() {
  return (
    <div
      className="mx-auto max-w-2xl bg-white p-10"
      style={{ border: "1px solid #E7E5E4", borderRadius: "3px" }}
    >
      <Section title="Rätt till Förmedlingsprovision">
        <p>
          Rätt till Förmedlingsprovision föreligger om bindande avtal om överlåtelse av
          Förmedlingsobjektet träffats mellan Uppdragsgivaren, Hyresvärd och Ny hyresgäst.
        </p>
        <p>
          Förmedlingsprovision skall även betalas i de fall Uppdragsgivaren väljer att inte ingå
          avtal om överlåtelse av Förmedlingsobjektet med Spekulanten, trots att denne erbjuder en
          köpeskilling om minst det mellan Uppdragsgivaren och Mäklarens överenskomna Acceptpriset
          för Förmedlingsobjektet.
        </p>
        <p>
          Förmedlingsprovision skall i sådant fall utgöra 10% av årshyran, dock lägst 54 900 kr ex
          moms av överenskommet acceptpris.
        </p>
      </Section>

      <Section title="Förfallodag">
        <p>
          Överenskommen provision är förfallen till betalning vid anfordran då rätt till provision
          föreligger och så snart bindande avtal eller annat därmed jämförligt avtal utväxlats
          mellan parterna.
        </p>
      </Section>

      <Section title="Övrigt">
        <p>
          Uppdragsgivaren skall hålla Förmedlingsobjektet med förrådsutrymmen tillgängliga för
          visningar, besiktning, värdering etc. som utförs av eller på uppdrag av Mäklaren.
        </p>
        <p>
          Uppdragsgivaren skall tillhandahålla korrekt information till Mäklaren för upprättande av
          beskrivning, prospekt etc. av Förmedlingsobjektet.
        </p>
        <p>
          Om Mäklaren på grund av semester, sjukdom eller av annan orsak är förhindrad att utföra
          del av uppdraget, godkänner Uppdragsgivaren att en av Mäklaren utsedd kollega har rätt att
          utföra den aktuella delen av uppdraget.
        </p>
        <p>
          Uppdragsgivaren skall löpande hålla Mäklaren informerad om väsentliga händelser för
          Förmedlingsuppdragets genomförande.
        </p>
        <p>Textmanus och den bildproduktion som Mäklaren låter ta fram äger Trelink AB rättigheterna till.</p>
        <p>
          Mäklaren ansvarar för direkt eller indirekt skada som orsakas av Mäklaren, om denne har
          varit vårdslös vid utförande av sitt uppdrag. Mäklarens skadeståndsansvar är dock alltid
          begränsat till högst 50 000 kronor.
        </p>
      </Section>

      <Section title="Tvist">
        <p>
          Tvist med anledning av detta Uppdragsavtal skall avgöras i allmän domstol med Stockholms
          tingsrätt som första instans.
        </p>
      </Section>

      <Section title="Utväxling av Uppdragsavtal">
        <p>Detta Uppdragsavtal är upprättat i två exemplar varav parterna tagit var sitt.</p>
      </Section>

      <div className="mt-10 grid grid-cols-2 gap-8 text-sm text-black">
        <div>
          <div className="mb-10 border-b border-black/30 pb-1">&nbsp;</div>
          <div className="text-xs text-black/70">Uppdragsgivarens underskrift</div>
          <div className="mt-6 mb-10 border-b border-black/30 pb-1">&nbsp;</div>
          <div className="text-xs text-black/70">Ort och datum</div>
        </div>
        <div>
          <div className="mb-2 text-xs text-black/70">Ovanstående uppdrag bekräftas av</div>
          <div className="mb-1 font-medium">Stockholm 2026-07-16</div>
          <div className="mb-10 text-xs text-black/70">Ort och datum</div>
          <div className="mb-1 font-medium">Fastighetskonsult George Kashou</div>
          <div className="text-xs text-black/70">Mäklarens underskrift</div>
        </div>
      </div>

      <div className="mt-10 text-center text-[11px] text-black/50">Trelink AB · GK25733 · 2/2</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 text-sm font-bold text-black">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-black">{children}</div>
    </div>
  );
}

/* ---------- Screen 2: Start modal ---------- */
function StartModal({
  checked,
  setChecked,
  onCancel,
  onContinue,
}: {
  checked: boolean;
  setChecked: (v: boolean) => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Start signing</h2>
        <p className="mt-2 text-sm text-gray-600">You are about to sign the following document(s):</p>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-100 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-gray-900">Document</div>
            <div className="text-xs text-gray-500">2 pages</div>
          </div>
          <button className="text-sm font-medium text-[#4444FF] hover:underline">Review</button>
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I have read and understood the presented documents and am ready to start signing
          </span>
        </label>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button
            onClick={onContinue}
            disabled={!checked}
            className={`rounded px-4 py-2 text-sm font-medium text-white ${
              checked ? "bg-[#4444FF] hover:opacity-90" : "cursor-not-allowed bg-gray-300"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Screen 3: BankID ---------- */
function BankIdScreen({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 text-3xl font-bold" style={{ color: "#183B6A" }}>
          BankID
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Identifiera dig med BankID</h1>
        <p className="mt-2 text-sm text-gray-600">
          Öppna BankID-appen på din mobil och bekräfta din identitet för att signera dokumentet.
        </p>

        <div className="my-8 flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-gray-500"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <div className="text-xs text-gray-500">Väntar på BankID-appen…</div>
        </div>

        <div className="text-left">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Personnummer
          </label>
          <input
            readOnly
            value="XXXXXX-XXXX"
            className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
        </div>

        <button
          onClick={onCancel}
          className="mt-6 text-sm text-gray-500 hover:text-gray-900"
        >
          Avbryt
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ---------- Screen 4: Done ---------- */
function DoneScreen({ seller, onClose }: { seller: SignicatSellerInfo; onClose: () => void }) {
  const dt = new Date().toLocaleString("sv-SE");
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-lg text-center">
        <svg
          className="mx-auto mb-6"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="32" cy="32" r="30" />
          <path d="M18 33 L28 43 L46 23" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <h1 className="text-2xl font-bold text-gray-900">Uppdragsavtalet är signerat</h1>
        <p className="mt-2 text-sm text-gray-500">Signeringen genomfördes med BankID · {dt}</p>

        <hr className="my-6 border-gray-200" />

        <div className="space-y-2 text-left text-sm">
          <Row k="Dokument:" v="Uppdragsavtal · 2 sidor" />
          <Row k="Signerat av:" v={seller.bolag || "—"} />
          <Row k="Förmedlare:" v="Trelink AB" />
        </div>

        <hr className="my-6 border-gray-200" />

        <div className="rounded bg-gray-50 p-3 text-xs text-gray-600">
          En kopia av det signerade avtalet har skickats till din e-postadress. Du hittar det även
          under dina dokument i plattformen.
        </div>

        <button
          onClick={onClose}
          className="mx-auto mt-6 block w-full max-w-xs rounded bg-black px-6 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          Tillbaka till min annons
        </button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{k}</span>
      <span className="font-medium text-gray-900">{v}</span>
    </div>
  );
}
