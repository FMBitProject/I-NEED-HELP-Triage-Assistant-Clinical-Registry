import { describe, expect, it } from "vitest";
import {
  PendingPatient,
  QueueStorage,
  syncPendingPatients,
} from "./offline-queue";

function memoryStorage(initial: PendingPatient[] = []): QueueStorage & {
  entries: PendingPatient[];
} {
  const entries = [...initial];
  return {
    entries,
    async add(e) {
      entries.push(e);
    },
    async list() {
      return [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async update(e) {
      const i = entries.findIndex((x) => x.queueId === e.queueId);
      entries[i] = e;
    },
    async remove(id) {
      const i = entries.findIndex((x) => x.queueId === id);
      if (i >= 0) entries.splice(i, 1);
    },
  };
}

function entry(overrides: Partial<PendingPatient> = {}): PendingPatient {
  return {
    queueId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    patient: {
      clientRequestId: "req-fixed-1",
      patientInitial: "AB",
      age: 60,
      gender: "M",
      systolicBp: 100,
      diastolicBp: 70,
      heartRate: 95,
      lvef: null,
      egfr: null,
      ntProbnp: null,
      comorbidDm: false,
      comorbidHtn: false,
      comorbidCkd: false,
      comorbidAf: false,
      onAceArni: false,
      onBb: false,
      onMra: false,
      onSglt2i: false,
      nyhaClass: null,
    },
    ...overrides,
  };
}

function okJson(data: unknown, status = 201): Response {
  return new Response(JSON.stringify(data), { status });
}

describe("syncPendingPatients", () => {
  it("mengirim setiap pasien dan mengosongkan antrean", async () => {
    const storage = memoryStorage([entry(), entry()]);
    const calls: string[] = [];
    const fetchFn: typeof fetch = async (url) => {
      calls.push(String(url));
      return okJson({ id: "pat-1" });
    };

    const result = await syncPendingPatients(storage, fetchFn);

    expect(result).toEqual({
      synced: 2,
      remaining: 0,
      needsLogin: false,
      rejected: 0,
      lastRejectionError: null,
    });
    expect(calls).toEqual(["/api/patients", "/api/patients"]);
  });

  it("berhenti (entri tetap tersimpan) saat jaringan masih putus", async () => {
    const storage = memoryStorage([entry(), entry()]);
    const fetchFn: typeof fetch = async () => {
      throw new TypeError("Failed to fetch");
    };

    const result = await syncPendingPatients(storage, fetchFn);

    expect(result).toEqual({
      synced: 0,
      remaining: 2,
      needsLogin: false,
      rejected: 0,
      lastRejectionError: null,
    });
  });

  it("sesi habis (401) → berhenti dan menandai needsLogin, data tidak hilang", async () => {
    const storage = memoryStorage([entry(), entry()]);
    const fetchFn: typeof fetch = async () => okJson({ error: "unauthorized" }, 401);

    const result = await syncPendingPatients(storage, fetchFn);

    expect(result).toEqual({
      synced: 0,
      remaining: 2,
      needsLogin: true,
      rejected: 0,
      lastRejectionError: null,
    });
  });

  it("satu entri ditolak server (400) tidak menyandera entri lain", async () => {
    const bad = entry({ createdAt: "2026-01-01T00:00:00Z" });
    const good = entry({ createdAt: "2026-01-02T00:00:00Z" });
    const storage = memoryStorage([bad, good]);
    let calls = 0;
    const fetchFn: typeof fetch = async () => {
      calls++;
      // Panggilan pertama = entri paling lama (bad) → ditolak validasi server
      return calls === 1 ? okJson({ error: "invalid" }, 400) : okJson({ id: "pat-2" });
    };

    const result = await syncPendingPatients(storage, fetchFn);

    expect(result.synced).toBe(1);
    expect(result.remaining).toBe(1);
    expect(storage.entries[0].queueId).toBe(bad.queueId);
  });

  it("entri yang ditolak server ditandai (bukan dibuang) beserta alasannya", async () => {
    const bad = entry({ createdAt: "2026-01-01T00:00:00Z" });
    const storage = memoryStorage([bad]);
    const fetchFn: typeof fetch = async () =>
      okJson({ error: "NT-proBNP wajib diisi untuk pendaftaran pasien baru" }, 400);

    const result = await syncPendingPatients(storage, fetchFn);

    // Data klinis tidak boleh hilang diam-diam...
    expect(result.remaining).toBe(1);
    expect(storage.entries[0].patient.patientInitial).toBe("AB");
    // ...tapi harus terlaporkan supaya UI bisa memberi tahu dokter.
    expect(result.rejected).toBe(1);
    expect(result.lastRejectionError).toBe(
      "NT-proBNP wajib diisi untuk pendaftaran pasien baru"
    );
    expect(storage.entries[0].rejectedAttempts).toBe(1);
    expect(storage.entries[0].lastError).toBe(
      "NT-proBNP wajib diisi untuk pendaftaran pasien baru"
    );
  });

  it("percobaan penolakan berulang terakumulasi, entri tetap tersimpan", async () => {
    const storage = memoryStorage([entry()]);
    const fetchFn: typeof fetch = async () => okJson({ error: "invalid" }, 400);

    await syncPendingPatients(storage, fetchFn);
    await syncPendingPatients(storage, fetchFn);

    expect(storage.entries).toHaveLength(1);
    expect(storage.entries[0].rejectedAttempts).toBe(2);
  });

  it("penolakan dengan body non-JSON tetap memberi pesan yang bisa dibaca", async () => {
    const storage = memoryStorage([entry()]);
    const fetchFn: typeof fetch = async () =>
      new Response("<html>Bad Gateway</html>", { status: 502 });

    const result = await syncPendingPatients(storage, fetchFn);

    expect(result.rejected).toBe(1);
    expect(result.lastRejectionError).toBe("Ditolak server (HTTP 502)");
  });

  it("clientRequestId ikut terkirim supaya kiriman ulang tidak jadi pasien dobel", async () => {
    const storage = memoryStorage([entry()]);
    let sentBody: Record<string, unknown> = {};
    const fetchFn: typeof fetch = async (_url, init) => {
      sentBody = JSON.parse(String(init?.body));
      return okJson({ id: "pat-1" });
    };

    await syncPendingPatients(storage, fetchFn);

    expect(sentBody.clientRequestId).toBe("req-fixed-1");
  });
});
