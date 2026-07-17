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
    <div className={`min-h-screen bg-white ${blurred ? "blur-sm pointer-events-none" : ""}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="text-sm text-gray-600">100%</div>
        <div className="text-sm text-gray-700">🌐 English</div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-gray-700">More actions ▾</button>
          <button
            onClick={onSign}
            className="rounded bg-[#4444FF] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Sign documents
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-6 p-6">
        {/* Document */}
        <div className="flex-1 bg-[#f7f7f7] p-8">
          <div className="mx-auto max-w-2xl bg-white p-10 shadow-sm">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Uppdragsavtal</h1>

            <Section title="Förmedlare">
              <p>Trelink AB</p>
              <p className="text-gray-500">[Förmedlarens adress fylls i före produktion]</p>
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
              <p>{seller.objektAdress || seller.adress || "—"}</p>
            </Section>

            <Section title="Utgångspris">
              <p>{seller.utgangspris || "Enligt överenskommelse"}</p>
            </Section>

            <Section title="Avtalstid">
              <p>
                Detta Uppdragsavtal är förenat med ensamrätt under en tid av tre (3) månader från
                och med att båda parter har undertecknat detta Uppdragsavtal.
              </p>
            </Section>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Documents
          </div>
          <div className="mt-3 border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900">Document</div>
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Reading</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">2 pages ›</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-700">{title}</h2>
      <div className="text-sm leading-relaxed text-gray-800">{children}</div>
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
