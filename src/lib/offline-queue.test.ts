import { describe, expect, it } from "vitest";
import {
  PendingTriage,
  QueueStorage,
  syncPendingTriages,
} from "./offline-queue";
import type { TriageCriteria } from "./types";

const CRITERIA: TriageCriteria = {
  I: false, N: true, E1: false, E2: false, D: false, H: false, E3: false, L: false, P: false,
};

function memoryStorage(initial: PendingTriage[] = []): QueueStorage & {
  entries: PendingTriage[];
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

function entry(overrides: Partial<PendingTriage> = {}): PendingTriage {
  return {
    queueId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    patient: {
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
    patientId: null,
    criteria: CRITERIA,
    ...overrides,
  };
}

function okJson(data: unknown, status = 201): Response {
  return new Response(JSON.stringify(data), { status });
}

describe("syncPendingTriages", () => {
  it("mengirim pasien lalu triase, dan mengosongkan antrean", async () => {
    const storage = memoryStorage([entry(), entry()]);
    const calls: string[] = [];
    const fetchFn: typeof fetch = async (url) => {
      calls.push(String(url));
      if (String(url).includes("/api/patients")) return okJson({ id: "pat-1" });
      return okJson({ id: "tri-1" });
    };

    const result = await syncPendingTriages(storage, fetchFn);

    expect(result).toEqual({ synced: 2, remaining: 0, needsLogin: false });
    expect(calls).toEqual([
      "/api/patients", "/api/triage",
      "/api/patients", "/api/triage",
    ]);
  });

  it("entri dengan patientId (pasien sudah tersimpan) tidak membuat pasien dobel", async () => {
    const storage = memoryStorage([entry({ patient: null, patientId: "pat-9" })]);
    const calls: string[] = [];
    const fetchFn: typeof fetch = async (url, init) => {
      calls.push(String(url));
      expect(JSON.parse(String(init?.body)).patientId).toBe("pat-9");
      return okJson({ id: "tri-1" });
    };

    const result = await syncPendingTriages(storage, fetchFn);

    expect(result.synced).toBe(1);
    expect(calls).toEqual(["/api/triage"]);
  });

  it("berhenti (entri tetap tersimpan) saat jaringan masih putus", async () => {
    const storage = memoryStorage([entry(), entry()]);
    const fetchFn: typeof fetch = async () => {
      throw new TypeError("Failed to fetch");
    };

    const result = await syncPendingTriages(storage, fetchFn);

    expect(result).toEqual({ synced: 0, remaining: 2, needsLogin: false });
  });

  it("jaringan putus di antara dua request: patientId disimpan agar sync ulang tidak dobel", async () => {
    const storage = memoryStorage([entry()]);
    let call = 0;
    const fetchFn: typeof fetch = async (url) => {
      call++;
      if (String(url).includes("/api/patients")) return okJson({ id: "pat-1" });
      throw new TypeError("Failed to fetch"); // putus saat kirim triase
    };

    const first = await syncPendingTriages(storage, fetchFn);
    expect(first.synced).toBe(0);
    expect(first.remaining).toBe(1);
    expect(storage.entries[0].patientId).toBe("pat-1");
    expect(storage.entries[0].patient).toBeNull();

    // Koneksi kembali: hanya triase yang dikirim, tidak ada POST pasien kedua.
    const calls2: string[] = [];
    const fetchFn2: typeof fetch = async (url) => {
      calls2.push(String(url));
      return okJson({ id: "tri-1" });
    };
    const second = await syncPendingTriages(storage, fetchFn2);
    expect(second).toEqual({ synced: 1, remaining: 0, needsLogin: false });
    expect(calls2).toEqual(["/api/triage"]);
    expect(call).toBe(2);
  });

  it("sesi habis (401) → berhenti dan menandai needsLogin, data tidak hilang", async () => {
    const storage = memoryStorage([entry(), entry()]);
    const fetchFn: typeof fetch = async () => okJson({ error: "unauthorized" }, 401);

    const result = await syncPendingTriages(storage, fetchFn);

    expect(result).toEqual({ synced: 0, remaining: 2, needsLogin: true });
  });

  it("satu entri ditolak server (400) tidak menyandera entri lain", async () => {
    const bad = entry({ createdAt: "2026-01-01T00:00:00Z" });
    const good = entry({ createdAt: "2026-01-02T00:00:00Z" });
    const storage = memoryStorage([bad, good]);
    let patientCalls = 0;
    const fetchFn: typeof fetch = async (url) => {
      if (String(url).includes("/api/patients")) {
        patientCalls++;
        // Panggilan pertama = entri paling lama (bad) → ditolak validasi server
        return patientCalls === 1
          ? okJson({ error: "invalid" }, 400)
          : okJson({ id: "pat-2" });
      }
      return okJson({ id: "tri-2" });
    };

    const result = await syncPendingTriages(storage, fetchFn);

    expect(result.synced).toBe(1);
    expect(result.remaining).toBe(1);
    expect(storage.entries[0].queueId).toBe(bad.queueId);
  });
});
