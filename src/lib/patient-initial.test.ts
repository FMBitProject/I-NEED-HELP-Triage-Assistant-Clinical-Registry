import { describe, expect, it } from "vitest";
import { checkPatientInitial, NAME_LIKE_INITIAL_MESSAGE, normalizePatientInitial } from "./patient-initial";

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

describe("checkPatientInitial — nama depan pendek", () => {
  it.each(["Budi", "Siti", "Dewi", "Agus", "Ani", "tono"])("menolak %s yang terbaca seperti nama", (name) => {
    const r = checkPatientInitial(name);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(NAME_LIKE_INITIAL_MESSAGE);
  });

  it("menerima inisial berbentuk kata bila sengaja ditulis bertitik/berspasi", () => {
    expect(normalizePatientInitial("A.N.I")).toBe("ANI");
    expect(normalizePatientInitial("B U D I")).toBe("BUDI");
  });

  it("tetap menerima inisial biasa yang tidak berpola nama", () => {
    expect(normalizePatientInitial("NKAP")).toBe("NKAP");
    expect(normalizePatientInitial("MRS")).toBe("MRS");
    expect(normalizePatientInitial("BW")).toBe("BW");
  });

  it("menyamakan huruf beraksen (NFC dan NFD tersimpan sama)", () => {
    expect(normalizePatientInitial("\u00C9W")).toBe("EW"); // NFC
    expect(normalizePatientInitial("E\u0301W")).toBe("EW"); // NFD (E + aksen terpisah)
  });

  it("menolak angka non-latin (full-width)", () => {
    expect(normalizePatientInitial("RM１２")).toBeNull();
  });
});
