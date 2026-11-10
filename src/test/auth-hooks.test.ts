// Test hook validasi doctorType yang terdaftar di konfigurasi better-auth.
// DB di-mock — hook ini tidak menyentuh DB, yang diuji hanya keputusan
// terima/tolaknya.
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

const { auth } = await import("@/lib/auth");
const hooks = auth.options.databaseHooks!.user!;

const baseUser = {
  id: "u-1",
  email: "a@b.c",
  name: "Dr. A",
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("databaseHooks.user.create.before", () => {
  it("menerima doctorType valid", async () => {
    await expect(
      hooks.create!.before!({ ...baseUser, doctorType: "CARDIOLOGY" })
    ).resolves.toBeUndefined();
  });

  it.each([undefined, null, "", "Sp.JP", "=cmd()"])("menolak sign-up dengan doctorType %s", async (v) => {
    await expect(hooks.create!.before!({ ...baseUser, doctorType: v })).rejects.toThrow(
      /Jenis dokter wajib dipilih/
    );
  });
});

describe("databaseHooks.user.update.before", () => {
  it("tidak mengganggu update yang tidak menyentuh doctorType (mis. akun lama, emailVerified)", async () => {
    await expect(hooks.update!.before!({ emailVerified: true })).resolves.toBeUndefined();
  });

  it("menerima perubahan ke nilai valid", async () => {
    await expect(
      hooks.update!.before!({ doctorType: "GENERAL_PRACTITIONER" })
    ).resolves.toBeUndefined();
  });

  it.each([null, "", "ADMIN"])("menolak perubahan doctorType ke %s", async (v) => {
    await expect(hooks.update!.before!({ doctorType: v })).rejects.toThrow(
      /Jenis dokter wajib dipilih/
    );
  });
});
