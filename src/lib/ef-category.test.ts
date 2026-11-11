import { describe, expect, it } from "vitest";
import { efCategory } from "./ef-category";

describe("efCategory", () => {
  it("LVEF < 50 → HFrEF (termasuk kelompok 41–49 yang dulu HFmrEF)", () => {
    expect(efCategory(25)).toBe("HFrEF");
    expect(efCategory(40)).toBe("HFrEF");
    expect(efCategory(45)).toBe("HFrEF");
    expect(efCategory(49.9)).toBe("HFrEF");
  });

  it("LVEF ≥ 50 → HFpEF", () => {
    expect(efCategory(50)).toBe("HFpEF");
    expect(efCategory(65)).toBe("HFpEF");
  });

  it("hanya dua kategori — tidak pernah menghasilkan HFmrEF", () => {
    for (let ef = 5; ef <= 80; ef++) expect(["HFrEF", "HFpEF"]).toContain(efCategory(ef));
  });

  it("LVEF kosong / tidak valid → null", () => {
    expect(efCategory(null)).toBeNull();
    expect(efCategory(undefined)).toBeNull();
    expect(efCategory(Number.NaN)).toBeNull();
  });
});
