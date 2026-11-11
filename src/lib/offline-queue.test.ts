import { describe, expect, it } from "vitest";
import {
  PendingPatient,
  QueueStorage,
  discardPendingPatient,
  listPendingPatientsFor,
  resolvePendingPatient,
  summarizePendingPatients,
  syncPendingPatients,
} from "./offline-queue";

const ME = "dok-A";
const OTHER = "dok-B";

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
    ownerId: ME,
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

    const result = await syncPendingPatients(ME, storage, fetchFn);

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

    const result = await syncPendingPatients(ME, storage, fetchFn);

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

    const result = await syncPendingPatients(ME, storage, fetchFn);

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

    const result = await syncPendingPatients(ME, storage, fetchFn);

    expect(result.synced).toBe(1);
    expect(result.remaining).toBe(1);
    expect(storage.entries[0].queueId).toBe(bad.queueId);
  });

  it("entri yang ditolak server ditandai (bukan dibuang) beserta alasannya", async () => {
    const bad = entry({ createdAt: "2026-01-01T00:00:00Z" });
    const storage = memoryStorage([bad]);
    const fetchFn: typeof fetch = async () =>
      okJson({ error: "NT-proBNP wajib diisi untuk pendaftaran pasien baru" }, 400);

    const result = await syncPendingPatients(ME, storage, fetchFn);

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

  it("gangguan server (5xx) dicoba ulang dan percobaannya terakumulasi", async () => {
    const storage = memoryStorage([entry()]);
    const fetchFn: typeof fetch = async () => okJson({ error: "db down" }, 503);

    await syncPendingPatients(ME, storage, fetchFn);
    await syncPendingPatients(ME, storage, fetchFn);

    expect(storage.entries).toHaveLength(1);
    expect(storage.entries[0].rejectedAttempts).toBe(2);
  });

  it("entri yang ditolak 4xx DITAHAN — tidak dikirim ulang otomatis", async () => {
    const storage = memoryStorage([entry()]);
    let calls = 0;
    const fetchFn: typeof fetch = async () => {
      calls++;
      return okJson({ error: "Dasar persetujuan pasien wajib dipilih" }, 400);
    };

    await syncPendingPatients(ME, storage, fetchFn);
    await syncPendingPatients(ME, storage, fetchFn);

    expect(calls).toBe(1);
    expect(storage.entries[0].lastErrorStatus).toBe(400);
  });

  it("entri milik user lain di perangkat yang sama TIDAK dikirim", async () => {
    const mine = entry();
    const theirs = entry({ ownerId: OTHER });
    const storage = memoryStorage([mine, theirs]);
    const sent: unknown[] = [];
    const fetchFn: typeof fetch = async (_url, init) => {
      sent.push(JSON.parse(String(init?.body)));
      return okJson({ id: "pat-1" });
    };

    const result = await syncPendingPatients(ME, storage, fetchFn);

    expect(sent).toHaveLength(1);
    expect(result.synced).toBe(1);
    // Entri dokter B tetap ada, tapi tidak terhitung untuk dokter A.
    expect(result.remaining).toBe(0);
    expect(storage.entries.map((e) => e.queueId)).toEqual([theirs.queueId]);
  });

  it("entri lama tanpa pemilik tidak dikirim otomatis", async () => {
    const legacy = entry({ ownerId: undefined });
    const storage = memoryStorage([legacy]);
    let calls = 0;
    const fetchFn: typeof fetch = async () => {
      calls++;
      return okJson({ id: "pat-1" });
    };

    const result = await syncPendingPatients(ME, storage, fetchFn);

    expect(calls).toBe(0);
    expect(result.remaining).toBe(1);
  });

  it("penolakan dengan body non-JSON tetap memberi pesan yang bisa dibaca", async () => {
    const storage = memoryStorage([entry()]);
    const fetchFn: typeof fetch = async () =>
      new Response("<html>Bad Gateway</html>", { status: 502 });

    const result = await syncPendingPatients(ME, storage, fetchFn);

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

    await syncPendingPatients(ME, storage, fetchFn);

    expect(sentBody.clientRequestId).toBe("req-fixed-1");
  });
});

describe("penyelesaian manual antrean (/offline-queue)", () => {
  const rejected = (overrides: Partial<PendingPatient> = {}) =>
    entry({ rejectedAttempts: 1, lastError: "persetujuan", lastErrorStatus: 400, ...overrides });

  it("hanya menampilkan entri milik sendiri + entri lama tanpa pemilik", async () => {
    const mine = entry();
    const legacy = entry({ ownerId: undefined });
    const theirs = entry({ ownerId: OTHER });
    const storage = memoryStorage([mine, legacy, theirs]);

    const visible = await listPendingPatientsFor(ME, storage);

    expect(visible.map((e) => e.queueId).sort()).toEqual([mine.queueId, legacy.queueId].sort());
  });

  it("ringkasan memisahkan entri yang butuh tindakan", async () => {
    const storage = memoryStorage([entry(), rejected(), entry({ ownerId: undefined })]);

    expect(await summarizePendingPatients(ME, storage)).toEqual({ total: 3, needsAttention: 2 });
  });

  it("melengkapi entri yang ditahan melepas tahanannya lalu ikut tersinkron", async () => {
    const held = rejected();
    const storage = memoryStorage([held]);

    await resolvePendingPatient(held.queueId, ME, { consentBasis: "ETHICS_WAIVER" }, storage);
    let sentBody: Record<string, unknown> = {};
    const result = await syncPendingPatients(ME, storage, async (_u, init) => {
      sentBody = JSON.parse(String(init?.body));
      return okJson({ id: "pat-1" });
    });

    expect(sentBody.consentBasis).toBe("ETHICS_WAIVER");
    expect(result.synced).toBe(1);
  });

  it("mengklaim entri lama menjadikannya milik user yang mengklaim", async () => {
    const legacy = entry({ ownerId: undefined });
    const storage = memoryStorage([legacy]);

    await resolvePendingPatient(legacy.queueId, ME, {}, storage);

    expect(storage.entries[0].ownerId).toBe(ME);
  });

  it("entri milik user lain tidak bisa diubah maupun dibuang", async () => {
    const theirs = entry({ ownerId: OTHER });
    const storage = memoryStorage([theirs]);

    await expect(resolvePendingPatient(theirs.queueId, ME, {}, storage)).rejects.toThrow();
    await expect(discardPendingPatient(theirs.queueId, ME, storage)).rejects.toThrow();
    expect(storage.entries).toHaveLength(1);
    expect(storage.entries[0].ownerId).toBe(OTHER);
  });

  it("membuang entri menghapusnya dari perangkat", async () => {
    const mine = rejected();
    const storage = memoryStorage([mine]);

    await discardPendingPatient(mine.queueId, ME, storage);

    expect(storage.entries).toHaveLength(0);
  });
});
