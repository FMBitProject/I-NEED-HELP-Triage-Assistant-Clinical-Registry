// Test route POST /api/patients dan PATCH /api/patients/[id] dengan DB &
// sesi di-mock — memastikan payload antrean offline lama (edDisposition)
// tidak kehilangan disposisinya, dan field enum divalidasi di server.
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  inserted: null as Record<string, unknown> | null,
  updated: null as Record<string, unknown> | null,
  existing: null as Record<string, unknown> | null,
  audit: [] as Record<string, unknown>[],
  accessLogs: [] as Record<string, unknown>[],
  accessLogFails: false,
  deleted: false,
  role: "DOCTOR" as "DOCTOR" | "ADMIN",
  email: "dok@rs.id",
  demoPatientCount: 0,
}));

vi.mock("@/lib/api-auth", () => ({
  requireApprovedSession: async () => ({
    session: { user: { id: "doc-1", name: "Dr. Test", email: state.email, role: state.role, approved: true } },
    error: null,
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({
      values: (v: Record<string, unknown> | Record<string, unknown>[]) => {
        // Tiga jenis insert: audit log (array), access log (punya ipAddress),
        // dan pasien.
        if (Array.isArray(v)) {
          state.audit.push(...v);
        } else if ("ipAddress" in v) {
          if (state.accessLogFails) return Promise.reject(new Error("db down"));
          state.accessLogs.push(v);
          return Promise.resolve();
        } else {
          state.inserted = v;
        }
        return {
          onConflictDoNothing: () => ({
            returning: async () => [{ id: "p-1", egfr: null, ...(v as Record<string, unknown>) }],
          }),
        };
      },
    }),
    select: () => ({
      from: () => ({ where: async () => [{ n: state.demoPatientCount }] }),
    }),
    delete: () => ({
      where: async () => {
        state.deleted = true;
      },
    }),
    update: () => ({
      set: (v: Record<string, unknown>) => {
        state.updated = v;
        return {
          where: () => ({ returning: async () => [{ ...state.existing, ...v }] }),
        };
      },
    }),
    query: {
      patients: { findFirst: async () => state.existing },
    },
  },
}));

const { POST } = await import("@/app/api/patients/route");
const { PATCH, DELETE } = await import("@/app/api/patients/[id]/route");

const basePayload = {
  patientInitial: "AB",
  age: 60,
  gender: "M",
  systolicBp: 120,
  diastolicBp: 80,
  heartRate: 80,
  ntProbnp: 1500,
  nyhaClass: "II",
  hfOnset: "CHRONIC",
  consentBasis: "INFORMED_CONSENT",
};

function post(body: Record<string, unknown>) {
  return POST(
    new Request("http://test/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

function patch(body: Record<string, unknown>) {
  return PATCH(
    new Request("http://test/api/patients/p-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "p-1" }) }
  );
}

function rawRequest(method: string, body: string) {
  return new Request("http://test/api/patients", {
    method,
    headers: { "Content-Type": "application/json" },
    body,
  });
}

function del() {
  return DELETE(new Request("http://test/api/patients/p-1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "p-1" }),
  });
}

beforeEach(() => {
  state.inserted = null;
  state.updated = null;
  state.existing = null;
  state.audit = [];
  state.accessLogs = [];
  state.accessLogFails = false;
  state.deleted = false;
  state.role = "DOCTOR";
  state.email = "dok@rs.id";
  state.demoPatientCount = 0;
  vi.unstubAllEnvs();
});

describe("POST /api/patients", () => {
  it("payload antrean lama: edDisposition DECEASED_ED tersimpan sebagai visitDisposition DECEASED", async () => {
    const res = await post({ ...basePayload, edDisposition: "DECEASED_ED" });
    expect(res.status).toBe(201);
    expect(state.inserted?.visitDisposition).toBe("DECEASED");
    expect(state.inserted?.careSetting).toBeNull();
  });

  it("payload baru tersimpan apa adanya", async () => {
    const res = await post({ ...basePayload, careSetting: "POLI", visitDisposition: "ADMITTED" });
    expect(res.status).toBe(201);
    expect(state.inserted?.careSetting).toBe("POLI");
    expect(state.inserted?.visitDisposition).toBe("ADMITTED");
  });

  it("careSetting tak dikenal ditolak 400 dengan pesan yang menyebut field, tanpa insert", async () => {
    const res = await post({ ...basePayload, careSetting: "IGD" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("careSetting");
    expect(state.inserted).toBeNull();
  });

  it("hfOnset tak dikenal ditolak 400", async () => {
    const res = await post({ ...basePayload, hfOnset: "SOMETIMES" });
    expect(res.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it("INPATIENT + ADMITTED ditolak 400", async () => {
    const res = await post({ ...basePayload, careSetting: "INPATIENT", visitDisposition: "ADMITTED" });
    expect(res.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  // ─── UU PDP ───────────────────────────────────────────────────────────────
  it("tanpa consentBasis ditolak 400 (termasuk entri antrean offline lama)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { consentBasis, ...legacy } = basePayload;
    const res = await post(legacy);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("persetujuan");
    expect(state.inserted).toBeNull();
  });

  it("consentBasis tak dikenal ditolak 400", async () => {
    const res = await post({ ...basePayload, consentBasis: "VERBAL" });
    expect(res.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it("consentBasis tersimpan", async () => {
    const res = await post({ ...basePayload, consentBasis: "ETHICS_WAIVER" });
    expect(res.status).toBe(201);
    expect(state.inserted?.consentBasis).toBe("ETHICS_WAIVER");
  });

  it("nama lengkap sebagai inisial ditolak 400", async () => {
    const res = await post({ ...basePayload, patientInitial: "Budi Santoso" });
    expect(res.status).toBe(400);
    expect(state.inserted).toBeNull();
  });

  it("inisial dinormalisasi sebelum disimpan", async () => {
    const res = await post({ ...basePayload, patientInitial: "b.w." });
    expect(res.status).toBe(201);
    expect(state.inserted?.patientInitial).toBe("BW");
  });
});

describe("PATCH /api/patients/[id]", () => {
  const existingRow = {
    id: "p-1",
    doctorId: "doc-1",
    finalizedAt: null,
    careSetting: "POLI",
    visitDisposition: null,
    hfOnset: "CHRONIC",
  };

  it("careSetting yang sudah terisi tidak boleh dikosongkan", async () => {
    state.existing = { ...existingRow };
    const res = await patch({ careSetting: null });
    expect(res.status).toBe(400);
    expect(state.updated).toBeNull();
  });

  it("data lama (careSetting null) boleh tetap null", async () => {
    state.existing = { ...existingRow, careSetting: null };
    const res = await patch({ careSetting: null, age: 61 });
    expect(res.status).toBe(200);
    expect(state.updated?.careSetting).toBeNull();
  });

  it("kombinasi dicek dengan nilai efektif: existing INPATIENT + update ADMITTED ditolak", async () => {
    state.existing = { ...existingRow, careSetting: "INPATIENT" };
    const res = await patch({ visitDisposition: "ADMITTED" });
    expect(res.status).toBe(400);
    expect(state.updated).toBeNull();
  });

  it("nilai lama DECEASED_ED dipetakan ke DECEASED", async () => {
    state.existing = { ...existingRow };
    const res = await patch({ visitDisposition: "DECEASED_ED" });
    expect(res.status).toBe(200);
    expect(state.updated?.visitDisposition).toBe("DECEASED");
  });

  it("visitDisposition tak dikenal ditolak 400", async () => {
    state.existing = { ...existingRow };
    const res = await patch({ visitDisposition: "LOST" });
    expect(res.status).toBe(400);
    expect(state.updated).toBeNull();
  });

  it("consentBasis yang sudah tercatat tidak boleh dihapus", async () => {
    state.existing = { ...existingRow, consentBasis: "INFORMED_CONSENT" };
    const res = await patch({ consentBasis: null });
    expect(res.status).toBe(400);
    expect(state.updated).toBeNull();
  });

  it("data lama tanpa consentBasis boleh dilengkapi", async () => {
    state.existing = { ...existingRow, consentBasis: null };
    const res = await patch({ consentBasis: "ETHICS_WAIVER" });
    expect(res.status).toBe(200);
    expect(state.updated?.consentBasis).toBe("ETHICS_WAIVER");
  });

  it("PATCH nama lengkap sebagai inisial ditolak", async () => {
    state.existing = { ...existingRow };
    const res = await patch({ patientInitial: "Siti Aminah" });
    expect(res.status).toBe(400);
    expect(state.updated).toBeNull();
  });
});

// ─── Temuan review lanjutan ──────────────────────────────────────────────────
describe("body request tidak valid", () => {
  it("POST dengan JSON rusak → 400 berpesan, bukan 500", async () => {
    const res = await POST(rawRequest("POST", "{bukan json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("JSON");
  });

  it("POST dengan body null → 400", async () => {
    const res = await POST(rawRequest("POST", "null"));
    expect(res.status).toBe(400);
  });

  it("PATCH dengan body array → 400", async () => {
    state.existing = { id: "p-1", doctorId: "doc-1", finalizedAt: null };
    const res = await PATCH(rawRequest("PATCH", "[]"), { params: Promise.resolve({ id: "p-1" }) });
    expect(res.status).toBe(400);
    expect(state.updated).toBeNull();
  });
});

describe("pesan consentBasis", () => {
  it("nilai salah ketik dapat pesan 'tidak valid', bukan 'wajib dipilih'", async () => {
    const res = await post({ ...basePayload, consentBasis: "VERBAL" });
    const { error } = await res.json();
    expect(error).toContain("tidak valid");
    expect(error).toContain("VERBAL");
  });

  it("nama depan pendek sebagai inisial ditolak dengan pesan 'terbaca seperti nama'", async () => {
    const res = await post({ ...basePayload, patientInitial: "Budi" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("seperti nama");
  });
});

describe("PATCH inisial & audit trail", () => {
  const row = { id: "p-1", doctorId: "doc-1", finalizedAt: null, careSetting: "POLI", visitDisposition: null };

  it("inisial lama yang kini 'mirip nama' tidak memblokir edit field lain bila tidak diubah", async () => {
    state.existing = { ...row, patientInitial: "ANI", age: 60 };
    const res = await patch({ patientInitial: "ANI", age: 61 });
    expect(res.status).toBe(200);
    expect(state.updated).not.toHaveProperty("patientInitial");
    expect(state.updated?.age).toBe(61);
  });

  it("koreksi inisial tidak menyalin nilai lama (bisa nama lengkap) ke audit trail", async () => {
    state.existing = { ...row, patientInitial: "BUDI SANTOSO" };
    const res = await patch({ patientInitial: "BS" });
    expect(res.status).toBe(200);
    const entry = state.audit.find((a) => a.changedField === "patientInitial");
    expect(entry?.oldValue).toBe("[disamarkan]");
    expect(entry?.newValue).toBe("[disamarkan]");
    expect(JSON.stringify(state.audit)).not.toContain("SANTOSO");
  });
});

describe("DELETE /api/patients/[id]", () => {
  it("penghapusan dicatat di access_logs sebelum data dihapus", async () => {
    state.existing = { id: "p-1", doctorId: "doc-1", finalizedAt: null };
    const res = await del();
    expect(res.status).toBe(200);
    expect(state.deleted).toBe(true);
    expect(state.accessLogs).toHaveLength(1);
    expect(state.accessLogs[0].action).toBe("delete_patient");
    expect(JSON.parse(String(state.accessLogs[0].detail))).toMatchObject({ patientId: "p-1" });
  });

  it("gagal mencatat → 503 dan data TIDAK dihapus", async () => {
    state.existing = { id: "p-1", doctorId: "doc-1", finalizedAt: null };
    state.accessLogFails = true;
    const res = await del();
    expect(res.status).toBe(503);
    expect(state.deleted).toBe(false);
  });

  it("admin bisa menghapus pasien final milik dokter lain (jalur hak hapus)", async () => {
    state.role = "ADMIN";
    state.existing = { id: "p-1", doctorId: "doc-LAIN", finalizedAt: new Date() };
    const res = await del();
    expect(res.status).toBe(200);
    expect(state.deleted).toBe(true);
    expect(JSON.parse(String(state.accessLogs[0].detail))).toMatchObject({
      ownerDoctorId: "doc-LAIN",
      finalized: true,
    });
  });

  it("dokter biasa tidak bisa menghapus pasien yang sudah final", async () => {
    state.existing = { id: "p-1", doctorId: "doc-1", finalizedAt: new Date() };
    const res = await del();
    expect(res.status).toBe(423);
    expect(state.deleted).toBe(false);
  });
});

describe("batas pasien akun demo", () => {
  beforeEach(() => {
    vi.stubEnv("DEMO_USER_EMAIL", "demo@registry.test");
    vi.stubEnv("DEMO_USER_PASSWORD", "x");
  });

  it("akun demo yang sudah penuh ditolak 429 (antrean offline menahannya, tidak retry)", async () => {
    state.email = "demo@registry.test";
    state.demoPatientCount = 30;
    const res = await post(basePayload);
    expect(res.status).toBe(429);
    expect(state.inserted).toBeNull();
  });

  it("akun demo yang belum penuh tetap bisa menyimpan", async () => {
    state.email = "demo@registry.test";
    state.demoPatientCount = 3;
    expect((await post(basePayload)).status).toBe(201);
  });

  it("dokter biasa tidak terkena batas demo", async () => {
    state.demoPatientCount = 999;
    expect((await post(basePayload)).status).toBe(201);
  });
});
