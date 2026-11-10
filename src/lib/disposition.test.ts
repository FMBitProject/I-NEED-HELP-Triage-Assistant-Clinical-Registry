import { describe, expect, it } from "vitest";
import {
  dispositionOptionsFor,
  isDispositionAllowed,
  readRawDisposition,
  VISIT_DISPOSITION_LABELS,
} from "./disposition";
import { isEnumValue, parseOptionalEnum } from "./enum-field";
import { isValidDoctorType } from "./doctor-type";
import { CARE_SETTING_LABELS } from "./care-setting";

describe("readRawDisposition", () => {
  it("membaca field baru visitDisposition", () => {
    expect(readRawDisposition({ visitDisposition: "DISCHARGED" })).toBe("DISCHARGED");
  });

  it("jatuh balik ke field lama edDisposition (antrean offline lama)", () => {
    expect(readRawDisposition({ edDisposition: "ADMITTED" })).toBe("ADMITTED");
  });

  it("memetakan nilai lama DECEASED_ED → DECEASED dari kedua nama field", () => {
    expect(readRawDisposition({ edDisposition: "DECEASED_ED" })).toBe("DECEASED");
    expect(readRawDisposition({ visitDisposition: "DECEASED_ED" })).toBe("DECEASED");
  });

  it("field baru menang bila keduanya ada", () => {
    expect(readRawDisposition({ visitDisposition: "REFERRED", edDisposition: "ADMITTED" })).toBe(
      "REFERRED"
    );
  });

  it("tidak tertipu nama properti bawaan prototype", () => {
    expect(readRawDisposition({ visitDisposition: "toString" })).toBe("toString");
  });

  it("undefined bila tidak ada keduanya", () => {
    expect(readRawDisposition({})).toBeUndefined();
  });
});

describe("isDispositionAllowed / dispositionOptionsFor", () => {
  it("menolak INPATIENT + ADMITTED", () => {
    expect(isDispositionAllowed("INPATIENT", "ADMITTED")).toBe(false);
  });

  it("mengizinkan kombinasi lain dan nilai kosong", () => {
    expect(isDispositionAllowed("POLI", "ADMITTED")).toBe(true);
    expect(isDispositionAllowed("INPATIENT", "DISCHARGED")).toBe(true);
    expect(isDispositionAllowed(null, "ADMITTED")).toBe(true);
    expect(isDispositionAllowed("INPATIENT", null)).toBe(true);
  });

  it("menyembunyikan opsi ADMITTED hanya untuk INPATIENT", () => {
    expect(dispositionOptionsFor("INPATIENT").map((o) => o.value)).not.toContain("ADMITTED");
    expect(dispositionOptionsFor("POLI").map((o) => o.value)).toContain("ADMITTED");
    expect(dispositionOptionsFor("")).toHaveLength(Object.keys(VISIT_DISPOSITION_LABELS).length);
  });
});

describe("parseOptionalEnum / isEnumValue", () => {
  it("kosong → null", () => {
    for (const raw of [undefined, null, ""]) {
      expect(parseOptionalEnum("careSetting", raw, CARE_SETTING_LABELS)).toEqual({
        ok: true,
        value: null,
      });
    }
  });

  it("nilai valid diteruskan", () => {
    expect(parseOptionalEnum("careSetting", "POLI", CARE_SETTING_LABELS)).toEqual({
      ok: true,
      value: "POLI",
    });
  });

  it("nilai tak dikenal / tipe salah → error yang menyebut field", () => {
    for (const raw of ["IGD", 1, true, {}, "toString", "__proto__"]) {
      const r = parseOptionalEnum("careSetting", raw, CARE_SETTING_LABELS);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("careSetting");
    }
  });

  it("isEnumValue tidak menerima properti prototype", () => {
    expect(isEnumValue(CARE_SETTING_LABELS, "constructor")).toBe(false);
  });
});

describe("isValidDoctorType", () => {
  it("menerima keempat kategori", () => {
    for (const v of ["GENERAL_PRACTITIONER", "INTERNAL_MEDICINE", "CARDIOLOGY", "OTHER_SPECIALIST"]) {
      expect(isValidDoctorType(v)).toBe(true);
    }
  });

  it("menolak kosong, null, nilai sembarang, dan payload formula CSV", () => {
    for (const v of [undefined, null, "", "cardiology", "=HYPERLINK(\"x\")", 3]) {
      expect(isValidDoctorType(v)).toBe(false);
    }
  });
});
