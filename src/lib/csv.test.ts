import { describe, expect, it } from "vitest";
import { buildCsv, escapeCsvValue } from "./csv";

describe("escapeCsvValue", () => {
  it("mengembalikan string kosong untuk null/undefined", () => {
    expect(escapeCsvValue(null)).toBe("");
    expect(escapeCsvValue(undefined)).toBe("");
  });

  it("meneruskan nilai sederhana tanpa quoting", () => {
    expect(escapeCsvValue("AB")).toBe("AB");
    expect(escapeCsvValue(65)).toBe("65");
  });

  it("menulis boolean sebagai 1/0 (dummy variable SPSS/Stata)", () => {
    expect(escapeCsvValue(true)).toBe("1");
    expect(escapeCsvValue(false)).toBe("0");
  });

  it("membungkus nilai yang mengandung koma", () => {
    expect(escapeCsvValue("edema, sesak")).toBe('"edema, sesak"');
  });

  it("menggandakan tanda kutip di dalam nilai", () => {
    expect(escapeCsvValue('pasien bilang "sesak"')).toBe(
      '"pasien bilang ""sesak"""'
    );
  });

  it("membungkus nilai yang mengandung baris baru", () => {
    expect(escapeCsvValue("baris1\nbaris2")).toBe('"baris1\nbaris2"');
    expect(escapeCsvValue("baris1\r\nbaris2")).toBe('"baris1\r\nbaris2"');
  });

  it("men-serialize objek sebagai JSON yang di-escape", () => {
    expect(escapeCsvValue({ a: 1 })).toBe('"{""a"":1}"');
  });
});

describe("buildCsv", () => {
  it("menyusun header + baris sesuai urutan header", () => {
    const csv = buildCsv(
      ["name", "age"],
      [
        { name: "AB", age: 60 },
        { age: 71, name: "CD" },
      ]
    );
    expect(csv).toBe("name,age\nAB,60\nCD,71");
  });

  it("mengisi kolom yang hilang dengan string kosong", () => {
    const csv = buildCsv(["a", "b"], [{ a: "x" }]);
    expect(csv).toBe("a,b\nx,");
  });

  it("catatan dokter dengan kutip dan enter tidak merusak struktur CSV", () => {
    const csv = buildCsv(
      ["patientInitial", "outcomeNotes", "outcomeStatus"],
      [
        {
          patientInitial: "AB",
          outcomeNotes: 'Keluhan "berat",\nedema membaik',
          outcomeStatus: "STABLE",
        },
      ]
    );
    const lines = csv.split("\n");
    // Baris data pecah karena newline di notes — tapi harus tetap satu record
    // CSV yang valid: kolom terakhir (STABLE) tetap ada di record yang sama.
    expect(lines[0]).toBe("patientInitial,outcomeNotes,outcomeStatus");
    expect(csv).toContain('"Keluhan ""berat"",\nedema membaik"');
    expect(csv.endsWith(",STABLE")).toBe(true);
  });
});
