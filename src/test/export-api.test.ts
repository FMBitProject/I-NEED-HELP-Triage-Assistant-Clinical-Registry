// Test route GET /api/export: minimalisasi kolom (UU PDP) dan jejak akses.
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  accessLogs: [] as Record<string, unknown>[],
  accessLogFails: false,
}));

vi.mock("@/lib/api-auth", () => ({
  requireAdmin: async () => ({
    session: { user: { id: "adm-1", name: "Admin" } },
    error: null,
  }),
}));

const patientRow = {
  doctorId: "doc-1",
  patientId: "p-1",
  consentBasis: "ETHICS_WAIVER",
  age: 60,
  lvef: 35,
  patientCreatedAt: new Date("2026-11-01T00:00:00Z"),
};

vi.mock("@/lib/db", () => ({
  db: {
    // select().from(patients).innerJoin().orderBy()  → baris pasien
    // select().from(outcomes)                        → outcome (di-await langsung)
    select: () => ({
      from: () => ({
        innerJoin: () => ({ orderBy: async () => [patientRow] }),
        then: (resolve: (v: unknown[]) => void) => resolve([]),
      }),
    }),
    insert: () => ({
      values: (v: Record<string, unknown>) => {
        if (state.accessLogFails) return Promise.reject(new Error("db down"));
        state.accessLogs.push(v);
        return Promise.resolve();
      },
    }),
  },
}));

const { GET } = await import("@/app/api/export/route");

function get() {
  return GET(new Request("http://test/api/export", { headers: { "x-real-ip": "10.0.0.7" } }));
}

beforeEach(() => {
  state.accessLogs = [];
  state.accessLogFails = false;
});

describe("GET /api/export", () => {
  it("CSV tidak memuat inisial pasien maupun nama dokter", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    const header = (await res.text()).split("\n")[0].split(",");
    expect(header).not.toContain("patientInitial");
    expect(header).not.toContain("doctorName");
    expect(header).toContain("patientId");
    expect(header).toContain("consentBasis");
  });

  it("setiap ekspor tercatat di access_logs (siapa, berapa pasien, IP)", async () => {
    await get();
    expect(state.accessLogs).toHaveLength(1);
    expect(state.accessLogs[0]).toMatchObject({
      userId: "adm-1",
      action: "export_csv",
      ipAddress: "10.0.0.7",
    });
    expect(JSON.parse(String(state.accessLogs[0].detail))).toEqual({ patients: 1 });
  });

  it("gagal mencatat → 503 berpesan jelas, file TIDAK dikirim", async () => {
    state.accessLogFails = true;
    const res = await get();
    expect(res.status).toBe(503);
    expect(res.headers.get("Content-Type")).not.toContain("text/csv");
    expect((await res.json()).error).toContain("pencatatan akses gagal");
  });
});
