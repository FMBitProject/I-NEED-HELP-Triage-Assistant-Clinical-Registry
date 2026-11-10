// Test route POST /api/patients dan PATCH /api/patients/[id] dengan DB &
// sesi di-mock — memastikan payload antrean offline lama (edDisposition)
// tidak kehilangan disposisinya, dan field enum divalidasi di server.
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  inserted: null as Record<string, unknown> | null,
  updated: null as Record<string, unknown> | null,
  existing: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/api-auth", () => ({
  requireApprovedSession: async () => ({
    session: { user: { id: "doc-1", name: "Dr. Test", role: "DOCTOR", approved: true } },
    error: null,
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({
      values: (v: Record<string, unknown>) => {
        // insert pasien (punya patientInitial) vs insert audit log (array)
        if (!Array.isArray(v)) state.inserted = v;
        return {
          onConflictDoNothing: () => ({
            returning: async () => [{ id: "p-1", egfr: null, ...v }],
          }),
        };
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
const { PATCH } = await import("@/app/api/patients/[id]/route");

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

beforeEach(() => {
  state.inserted = null;
  state.updated = null;
  state.existing = null;
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
