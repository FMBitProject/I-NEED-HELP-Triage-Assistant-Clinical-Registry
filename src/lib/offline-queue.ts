// Antrean offline untuk form pendaftaran pasien (PRD: PWA "dapat diakses
// offline"). Cara kerja mirip pesan WhatsApp saat tidak ada sinyal: submit
// yang gagal karena jaringan disimpan di IndexedDB, lalu dikirim ulang
// otomatis begitu koneksi kembali. Logika sync menerima storage & fetch
// sebagai parameter supaya bisa di-unit-test tanpa browser.

export interface PendingPatientPayload {
  patientInitial: string;
  age: number;
  gender: "M" | "F";
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  lvef: number | null;
  egfr: number | null;
  ntProbnp: number | null;
  comorbidDm: boolean;
  comorbidHtn: boolean;
  comorbidCkd: boolean;
  comorbidAf: boolean;
  onAceArni: boolean;
  onBb: boolean;
  onMra: boolean;
  onSglt2i: boolean;
  nyhaClass: string | null;
  // Kunci idempotensi: dibuat sekali per submit dan ikut tersimpan di antrean,
  // sehingga percobaan kirim ulang (respons hilang di tengah jalan, tab
  // ditutup) tidak membuat pasien dobel di registri. Opsional karena entri
  // lama di IndexedDB belum punya field ini.
  clientRequestId?: string;
  // Opsional agar antrean lama di IndexedDB (tersimpan sebelum field ini ada)
  // tetap valid saat disinkronkan.
  edDisposition?: string | null;
  hfOnset?: string | null;
  noAceArniReason?: string | null;
  noBbReason?: string | null;
  noMraReason?: string | null;
  noSglt2iReason?: string | null;
  noAceArniReasonOther?: string | null;
  noBbReasonOther?: string | null;
  noMraReasonOther?: string | null;
  noSglt2iReasonOther?: string | null;
}

export interface PendingPatient {
  queueId: string;
  createdAt: string;
  patient: PendingPatientPayload;
  // Berapa kali server menolak entri ini (4xx/5xx selain 401/403), plus alasan
  // terakhirnya. Entri yang ditolak TIDAK dibuang (itu data klinis asli) —
  // hanya ditandai supaya banner bisa memberi tahu dokter, bukan diam-diam
  // menempel "menunggu sinkronisasi" selamanya.
  rejectedAttempts?: number;
  lastError?: string | null;
}

export interface QueueStorage {
  add(entry: PendingPatient): Promise<void>;
  list(): Promise<PendingPatient[]>;
  update(entry: PendingPatient): Promise<void>;
  remove(queueId: string): Promise<void>;
}

export interface SyncResult {
  synced: number;
  remaining: number;
  needsLogin: boolean;
  /** Entri yang ditolak server pada run ini (butuh perhatian manual). */
  rejected: number;
  /** Alasan penolakan terakhir dari server, untuk ditampilkan ke dokter. */
  lastRejectionError: string | null;
}

// ─── IndexedDB storage (default di browser) ──────────────────────────────────

const DB_NAME = "hf-registry-offline";
const STORE_NAME = "pendingPatients";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: "queueId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE_NAME, mode);
        const req = run(t.objectStore(STORE_NAME));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      })
  );
}

// ─── Migrasi dari antrean versi lama ─────────────────────────────────────────
// Sebelum fitur triase dihapus, antrean disimpan di database & store dengan
// nama berbeda. Tanpa migrasi, pasien yang sempat diinput offline oleh dokter
// akan tertinggal di database lama dan hilang diam-diam (banner menampilkan 0
// pending padahal datanya belum pernah sampai ke server).

const LEGACY_DB_NAME = "ineedhelp-offline";
const LEGACY_STORE_NAME = "pendingTriages";

interface LegacyEntry {
  queueId: string;
  createdAt: string;
  patient: PendingPatientPayload | null;
  patientId?: string | null;
}

function openLegacyDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    let isNew = false;
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(LEGACY_DB_NAME);
    } catch {
      resolve(null);
      return;
    }
    // Membuka DB tanpa versi akan MEMBUAT-nya bila belum ada; kalau upgrade
    // terpanggil berarti memang belum pernah ada isinya.
    req.onupgradeneeded = () => {
      isNew = true;
    };
    req.onsuccess = () => {
      const db = req.result;
      if (isNew || !db.objectStoreNames.contains(LEGACY_STORE_NAME)) {
        db.close();
        resolve(null);
        return;
      }
      resolve(db);
    };
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

function deleteLegacyDb(): Promise<void> {
  return new Promise((resolve) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.deleteDatabase(LEGACY_DB_NAME);
    } catch {
      resolve();
      return;
    }
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

async function migrateLegacyQueue(): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  const legacy = await openLegacyDb();
  if (!legacy) {
    // Tidak ada yang perlu dipindah; sekalian bersihkan DB kosong yang mungkin
    // ikut terbuat saat pengecekan di atas.
    await deleteLegacyDb();
    return;
  }

  let entries: LegacyEntry[] = [];
  try {
    entries = await new Promise<LegacyEntry[]>((resolve, reject) => {
      const t = legacy.transaction(LEGACY_STORE_NAME, "readonly");
      const req = t.objectStore(LEGACY_STORE_NAME).getAll();
      req.onsuccess = () => resolve((req.result as LegacyEntry[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  } finally {
    legacy.close();
  }

  // Entri dengan patient === null berarti pasiennya SUDAH tersimpan di server
  // (dulu yang tersisa hanya kiriman triasenya). Karena triase sudah dihapus,
  // entri seperti itu tidak punya sisa pekerjaan — memindahkannya justru akan
  // membuat pasien dobel di registri.
  const carryOver = entries.filter((e) => e && e.patient);

  for (const e of carryOver) {
    await tx("readwrite", (s) =>
      s.put({
        queueId: e.queueId,
        createdAt: e.createdAt,
        patient: e.patient as PendingPatientPayload,
      })
    );
  }

  await deleteLegacyDb();
  if (carryOver.length > 0) notifyQueueChanged();
}

// Migrasi dijalankan sekali per sesi halaman, dan setiap operasi antrean
// menunggunya lebih dulu supaya list/count/sync tidak pernah melihat antrean
// yang setengah termigrasi.
let migrationPromise: Promise<void> | null = null;
function ensureMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateLegacyQueue().catch(() => {
      // Migrasi gagal (mis. IndexedDB diblokir) — antrean baru tetap jalan.
    });
  }
  return migrationPromise;
}

const indexedDbStorage: QueueStorage = {
  add: async (entry) => {
    await ensureMigrated();
    await tx("readwrite", (s) => s.add(entry));
  },
  list: async () => {
    await ensureMigrated();
    const entries = await tx<PendingPatient[]>("readonly", (s) => s.getAll());
    return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  update: async (entry) => {
    await ensureMigrated();
    await tx("readwrite", (s) => s.put(entry));
  },
  remove: async (queueId) => {
    await ensureMigrated();
    await tx("readwrite", (s) => s.delete(queueId));
  },
};

export function getDefaultStorage(): QueueStorage {
  return indexedDbStorage;
}

// ─── Notifikasi perubahan antrean (untuk banner/badge UI) ────────────────────

export const QUEUE_CHANGED_EVENT = "inh-offline-queue-changed";

export function notifyQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT));
  }
}

// ─── API antrean ──────────────────────────────────────────────────────────────

export async function enqueuePendingPatient(
  patient: PendingPatientPayload,
  storage: QueueStorage = indexedDbStorage
): Promise<PendingPatient> {
  const full: PendingPatient = {
    patient,
    queueId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await storage.add(full);
  notifyQueueChanged();
  return full;
}

export async function countPendingPatients(
  storage: QueueStorage = indexedDbStorage
): Promise<number> {
  return (await storage.list()).length;
}

/**
 * Kirim semua entri antrean ke server, urut dari yang paling lama.
 *
 * - Gagal jaringan (fetch reject) → berhenti, entri tetap di antrean.
 * - 401/403 (sesi habis) → berhenti, tandai needsLogin.
 * - Error server lain → entri DITANDAI ditolak (tetap tersimpan, tidak pernah
 *   dibuang karena ini data klinis asli) lalu dilewati, supaya satu entri
 *   bermasalah tidak menyandera yang lain. Jumlahnya dilaporkan lewat
 *   `rejected` agar UI bisa memberi tahu dokter — tanpa ini entri yang selalu
 *   ditolak akan menempel sebagai "menunggu sinkronisasi" selamanya.
 */
export async function syncPendingPatients(
  storage: QueueStorage = indexedDbStorage,
  fetchFn: typeof fetch = fetch
): Promise<SyncResult> {
  const entries = await storage.list();
  let synced = 0;
  let rejected = 0;
  let needsLogin = false;
  let lastRejectionError: string | null = null;

  for (const entry of entries) {
    try {
      const res = await fetchFn("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.patient),
      });
      if (res.status === 401 || res.status === 403) {
        needsLogin = true;
        break;
      }
      if (!res.ok) {
        const reason = await readErrorMessage(res);
        rejected++;
        lastRejectionError = reason;
        await storage
          .update({
            ...entry,
            rejectedAttempts: (entry.rejectedAttempts ?? 0) + 1,
            lastError: reason,
          })
          .catch(() => {});
        continue;
      }

      await storage.remove(entry.queueId);
      synced++;
    } catch {
      // Masih offline / jaringan putus di tengah — coba lagi nanti.
      break;
    }
  }

  if (synced > 0 || rejected > 0) notifyQueueChanged();
  return {
    synced,
    remaining: (await storage.list()).length,
    needsLogin,
    rejected,
    lastRejectionError,
  };
}

/** Ambil pesan error dari body JSON server; jatuh balik ke pesan generik. */
async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // Body bukan JSON — pakai pesan generik di bawah.
  }
  return `Ditolak server (HTTP ${res.status})`;
}

/**
 * Deteksi kegagalan karena jaringan (bukan penolakan server).
 *
 * TODO(minor): `!navigator.onLine` dianggap otoritatif, padahal browser bisa
 * melaporkan online:false sementara request sebenarnya sampai ke server (atau
 * sebaliknya, captive portal membalas HTML saat onLine:true). Pemanggil di
 * form pendaftaran sudah aman karena mengecek ServerRejectionError lebih dulu;
 * yang tersisa hanya jalur di luar itu. Belum diubah — perlu dipikirkan
 * bareng strategi retry, bukan tambal sepotong.
 */
export function isNetworkError(err: unknown): boolean {
  return (
    (typeof navigator !== "undefined" && !navigator.onLine) ||
    err instanceof TypeError
  );
}
