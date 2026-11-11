// Mode demo: tombol login publik di situs produksi — pengamannya diuji di sini.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  demoRow: null as null | { id: string; role: string; approved: boolean },
  signInCalls: [] as { email: string; password: string }[],
  signInFails: false,
  purged: 0,
  session: null as null | { user: { email: string } },
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: async () => state.session,
      signInEmail: async ({ body }: { body: { email: string; password: string } }) => {
        if (state.signInFails) throw new Error("invalid password");
        state.signInCalls.push(body);
        const h = new Headers();
        h.append("Set-Cookie", "better-auth.session_token=abc; Path=/; HttpOnly");
        return { headers: h, response: {} };
      },
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => (state.demoRow ? [state.demoRow] : []) }) }),
    }),
    delete: () => ({
      where: () => ({
        returning: async () => {
          state.purged++;
          return [];
        },
      }),
    }),
  },
}));

const { GET, POST } = await import("@/app/api/demo/route");
const demo = await import("@/lib/demo");

beforeEach(() => {
  vi.stubEnv("DEMO_USER_EMAIL", "Demo@Registry.test");
  vi.stubEnv("DEMO_USER_PASSWORD", "rahasia-server");
  state.demoRow = { id: "demo-1", role: "DOCTOR", approved: true };
  state.signInCalls = [];
  state.signInFails = false;
  state.purged = 0;
  state.session = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("konfigurasi demo", () => {
  it("mati bila env tidak lengkap — tombol tidak tampil", async () => {
    vi.stubEnv("DEMO_USER_PASSWORD", "");
    expect(demo.isDemoEnabled()).toBe(false);
    expect((await (await GET()).json()).enabled).toBe(false);
    expect((await POST()).status).toBe(404);
  });

  it("isDemoUser tidak peka huruf besar/kecil", () => {
    expect(demo.isDemoUser({ email: "demo@registry.TEST" })).toBe(true);
    expect(demo.isDemoUser({ email: "dokter@rs.id" })).toBe(false);
    expect(demo.isDemoUser(null)).toBe(false);
  });

  it("GET melaporkan apakah sesi saat ini akun demo (untuk banner)", async () => {
    state.session = { user: { email: "demo@registry.test" } };
    expect(await (await GET()).json()).toMatchObject({ enabled: true, active: true });
    state.session = { user: { email: "dokter@rs.id" } };
    expect((await (await GET()).json()).active).toBe(false);
  });
});

describe("POST /api/demo", () => {
  it("login dengan kredensial dari env server dan meneruskan cookie sesi", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    expect(state.signInCalls).toEqual([{ email: "demo@registry.test", password: "rahasia-server" }]);
    expect(res.headers.get("set-cookie")).toContain("session_token");
    // Password tidak pernah ikut di respons ke browser.
    expect(await res.text()).not.toContain("rahasia-server");
  });

  it("membersihkan data demo lama setiap login demo", async () => {
    await POST();
    expect(state.purged).toBe(2); // pasien + sesi
  });

  it("MENOLAK bila env menunjuk akun ADMIN (salah konfigurasi)", async () => {
    state.demoRow = { id: "adm", role: "ADMIN", approved: true };
    const res = await POST();
    expect(res.status).toBe(503);
    expect(state.signInCalls).toHaveLength(0);
  });

  it("menolak bila akun demo belum di-approve atau tidak ada", async () => {
    state.demoRow = { id: "demo-1", role: "DOCTOR", approved: false };
    expect((await POST()).status).toBe(503);
    state.demoRow = null;
    expect((await POST()).status).toBe(503);
    expect(state.signInCalls).toHaveLength(0);
  });

  it("password env salah → 503 berpesan, bukan 500", async () => {
    state.signInFails = true;
    const res = await POST();
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("belum dikonfigurasi");
  });
});

describe("pemblokiran endpoint better-auth untuk akun demo", () => {
  it("mencakup ganti password, hapus akun, dan cabut sesi semua orang", () => {
    for (const p of ["/change-password", "/delete-user", "/update-user", "/revoke-sessions"]) {
      expect(demo.DEMO_BLOCKED_AUTH_PATHS).toContain(p);
    }
    expect(demo.DEMO_BLOCKED_AUTH_PATHS).not.toContain("/sign-out");
  });
});
