// Enkelt notissystem för admin — localStorage-baserad logg, grupperad per
// kategori så att t.ex. Köpare/Intressenter och Affärer/Uppdrag kan koppla in
// sig senare utan omskrivning av strukturen (se AdminLayout.tsx för hur
// Användare redan är kopplad).

export type AdminNotisKategori = "anvandare" | "kopare" | "affarer";

export type AdminNotis = {
  id: string;
  kategori: AdminNotisKategori;
  text: string;
  lank?: string;
  createdAt: number;
  read: boolean;
};

export const STORAGE_KEY = "trelink-admin-notiser";

export function readNotiser(): AdminNotis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminNotis[]) : [];
  } catch {
    return [];
  }
}

function writeNotiser(list: AdminNotis[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addNotis(kategori: AdminNotisKategori, text: string, lank?: string) {
  if (typeof window === "undefined") return;
  const list = readNotiser();
  list.unshift({
    id: `notis_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    kategori,
    text,
    lank,
    createdAt: Date.now(),
    read: false,
  });
  writeNotiser(list);
}

export function unreadCountByKategori(kategori: AdminNotisKategori): number {
  return readNotiser().filter((n) => n.kategori === kategori && !n.read).length;
}

/** Markerar alla notiser i kategorin som lästa — anropas t.ex. vid sidbesök. */
export function markKategoriRead(kategori: AdminNotisKategori) {
  if (typeof window === "undefined") return;
  const list = readNotiser();
  let changed = false;
  for (const n of list) {
    if (n.kategori === kategori && !n.read) {
      n.read = true;
      changed = true;
    }
  }
  if (changed) writeNotiser(list);
}
