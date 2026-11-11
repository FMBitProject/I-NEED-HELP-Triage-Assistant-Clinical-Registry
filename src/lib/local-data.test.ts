import { afterEach, describe, expect, it, vi } from "vitest";
import { clearLocalPatientData } from "./local-data";

function fakeCaches(urls: string[]) {
  const stored = new Set(urls);
  const cache = {
    keys: async () => [...stored].map((url) => ({ url }) as Request),
    delete: async (r: Request) => stored.delete(r.url),
  };
  return { stored, api: { keys: async () => ["hf-registry-v3"], open: async () => cache } };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("clearLocalPatientData", () => {
  it("menghapus semua respons /api/ tapi membiarkan aset halaman", async () => {
    const { stored, api } = fakeCaches([
      "https://app.test/api/patients",
      "https://app.test/api/patients?page=2",
      "https://app.test/dashboard",
      "https://app.test/_next/static/chunk.js",
    ]);
    vi.stubGlobal("caches", api);
    vi.stubGlobal("location", { origin: "https://app.test" });

    await clearLocalPatientData();

    expect([...stored].sort()).toEqual([
      "https://app.test/_next/static/chunk.js",
      "https://app.test/dashboard",
    ]);
  });

  it("memberi tahu service worker supaya respons yang masih di jalan tidak ditulis ulang", async () => {
    const postMessage = vi.fn();
    vi.stubGlobal("navigator", { serviceWorker: { controller: { postMessage } } });
    vi.stubGlobal("caches", fakeCaches([]).api);
    vi.stubGlobal("location", { origin: "https://app.test" });

    await clearLocalPatientData();

    expect(postMessage).toHaveBeenCalledWith({ type: "CLEAR_PATIENT_DATA" });
  });

  it("tidak pernah melempar error walau Cache API diblokir (logout tidak boleh tertahan)", async () => {
    vi.stubGlobal("caches", { keys: async () => { throw new Error("SecurityError"); } });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(clearLocalPatientData()).resolves.toBeUndefined();
  });
});
