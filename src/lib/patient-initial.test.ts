import { describe, expect, it } from "vitest";
import { normalizePatientInitial } from "./patient-initial";

describe("normalizePatientInitial", () => {
  it("menerima inisial biasa dan menjadikannya huruf besar", () => {
    expect(normalizePatientInitial("bw")).toBe("BW");
    expect(normalizePatientInitial("NKAP")).toBe("NKAP");
  });

  it("membuang titik dan spasi", () => {
    expect(normalizePatientInitial("b.w.")).toBe("BW");
    expect(normalizePatientInitial(" A B ")).toBe("AB");
  });

  it("menolak nama lengkap", () => {
    expect(normalizePatientInitial("Budi Santoso")).toBeNull();
  });

  it("menolak angka (indikasi NIK / no. rekam medis)", () => {
    expect(normalizePatientInitial("RM123")).toBeNull();
    expect(normalizePatientInitial("3171")).toBeNull();
  });

  it("menolak kosong dan non-string", () => {
    expect(normalizePatientInitial("")).toBeNull();
    expect(normalizePatientInitial("...")).toBeNull();
    expect(normalizePatientInitial(null)).toBeNull();
    expect(normalizePatientInitial(42)).toBeNull();
  });
});
