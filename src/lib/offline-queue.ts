// Antrean offline untuk form triase (PRD: PWA "dapat diakses offline").
// Cara kerja mirip pesan WhatsApp saat tidak ada sinyal: submit yang gagal
// karena jaringan disimpan di IndexedDB, lalu dikirim ulang otomatis begitu
// koneksi kembali. Logika sync menerima storage & fetch sebagai parameter
// supaya bisa di-unit-test tanpa browser.

import type { TriageCriteria } from "./types";

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
  // Opsional agar antrean lama di IndexedDB (tersimpan sebelum field ini ada)
  // tetap valid saat disinkronkan.
  edDisposition?: string | null;
  noAceArniReason?: string | null;
  noBbReason?: string | null;
  noMraReason?: string | null;
  noSglt2iReason?: string | null;
}

export interface PendingTriage {
  queueId: string;
  createdAt: string;
  // Kalau pasien sudah sempat tersimpan di server sebelum koneksi putus,
  // patientId terisi dan patient null — sync tinggal mengirim triasenya saja
  // (mencegah pasien dobel).
  patient: PendingPatientPayload | null;
  patientId: string | null;
  criteria: TriageCriteria;
}

export interface QueueStorage {
  add(entry: PendingTriage): Promise<void>;
  list(): Promise<PendingTriage[]>;
  update(entry: PendingTriage): Promise<void>;
  remove(queueId: string): Promise<void>;
}

export interface SyncResult {
  synced: number;
  remaining: number;
  needsLogin: boolean;
}

// ─── IndexedDB storage (default di browser) ──────────────────────────────────

const DB_NAME = "ineedhelp-offline";
const STORE_NAME = "pendingTriages";

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

const indexedDbStorage: QueueStorage = {
  add: (entry) => tx("readwrite", (s) => s.add(entry)).then(() => {}),
  list: () =>
    tx<PendingTriage[]>("readonly", (s) => s.getAll()).then((entries) =>
      entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    ),
  update: (entry) => tx("readwrite", (s) => s.put(entry)).then(() => {}),
  remove: (queueId) => tx("readwrite", (s) => s.delete(queueId)).then(() => {}),
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

export async function enqueuePendingTriage(
  entry: Omit<PendingTriage, "queueId" | "createdAt">,
  storage: QueueStorage = indexedDbStorage
): Promise<PendingTriage> {
  const full: PendingTriage = {
    ...entry,
    queueId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await storage.add(full);
  notifyQueueChanged();
  return full;
}

export async function countPendingTriages(
  storage: QueueStorage = indexedDbStorage
): Promise<number> {
  return (await storage.list()).length;
}

/**
 * Kirim semua entri antrean ke server, urut dari yang paling lama.
 *
 * - Gagal jaringan (fetch reject) → berhenti, entri tetap di antrean.
 * - 401/403 (sesi habis) → berhenti, tandai needsLogin.
 * - Error server lain → entri dilewati (tetap di antrean), lanjut ke entri
 *   berikutnya supaya satu entri bermasalah tidak menyandera yang lain.
 */
export async function syncPendingTriages(
  storage: QueueStorage = indexedDbStorage,
  fetchFn: typeof fetch = fetch
): Promise<SyncResult> {
  const entries = await storage.list();
  let synced = 0;
  let needsLogin = false;

  for (const entry of entries) {
    try {
      let patientId = entry.patientId;

      if (!patientId && entry.patient) {
        const res = await fetchFn("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry.patient),
        });
        if (res.status === 401 || res.status === 403) {
          needsLogin = true;
          break;
        }
        if (!res.ok) continue;
        patientId = ((await res.json()) as { id: string }).id;
        // Simpan patientId dulu — kalau proses mati sebelum triase terkirim,
        // sync berikutnya tidak membuat pasien dobel.
        await storage.update({ ...entry, patientId, patient: null });
      }

      if (!patientId) continue;

      const triageRes = await fetchFn("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, criteria: entry.criteria }),
      });
      if (triageRes.status === 401 || triageRes.status === 403) {
        needsLogin = true;
        break;
      }
      if (!triageRes.ok) continue;

      await storage.remove(entry.queueId);
      synced++;
    } catch {
      // Masih offline / jaringan putus di tengah — coba lagi nanti.
      break;
    }
  }

  if (synced > 0) notifyQueueChanged();
  return {
    synced,
    remaining: (await storage.list()).length,
    needsLogin,
  };
}

/** Deteksi kegagalan karena jaringan (bukan penolakan server). */
export function isNetworkError(err: unknown): boolean {
  return (
    (typeof navigator !== "undefined" && !navigator.onLine) ||
    err instanceof TypeError
  );
}
