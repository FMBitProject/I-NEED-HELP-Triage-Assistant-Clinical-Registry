import { describe, expect, it } from "vitest";
import { getVitalsWarnings } from "./vitals";

describe("getVitalsWarnings", () => {
  it("nilai normal tidak menghasilkan peringatan", () => {
    expect(
      getVitalsWarnings({
        age: 65,
        systolicBp: 120,
        diastolicBp: 80,
        heartRate: 72,
        lvef: 45,
        egfr: 60,
        ntProbnp: 1200,
      })
    ).toEqual([]);
  });

  it("field kosong/belum diisi tidak memicu peringatan", () => {
    expect(getVitalsWarnings({})).toEqual([]);
    expect(getVitalsWarnings({ lvef: null, egfr: undefined })).toEqual([]);
  });

  it("mendeteksi typo tensi (nol dobel)", () => {
    const w = getVitalsWarnings({ systolicBp: 900, diastolicBp: 80 });
    expect(w).toHaveLength(1);
    expect(w[0]).toContain("Sistolik 900");
  });

  it("mendeteksi diastolik >= sistolik", () => {
    const w = getVitalsWarnings({ systolicBp: 80, diastolicBp: 120 });
    expect(w.some((x) => x.includes("Diastolik lebih besar"))).toBe(true);
  });

  it("mendeteksi usia anak dan usia typo", () => {
    expect(getVitalsWarnings({ age: 12 })[0]).toContain("pasien dewasa");
    expect(getVitalsWarnings({ age: 650 })[0]).toContain("salah ketik");
  });

  it("nilai batas masih dianggap wajar", () => {
    expect(
      getVitalsWarnings({ systolicBp: 60, diastolicBp: 30, heartRate: 220, age: 110 })
    ).toEqual([]);
  });

  it("mendeteksi HR, LVEF, eGFR, NT-proBNP tidak wajar", () => {
    expect(getVitalsWarnings({ heartRate: 300 })).toHaveLength(1);
    expect(getVitalsWarnings({ lvef: 90 })).toHaveLength(1);
    expect(getVitalsWarnings({ egfr: 600 })).toHaveLength(1);
    expect(getVitalsWarnings({ ntProbnp: 99999 })).toHaveLength(1);
  });
});
