// Kategori gagal jantung berdasarkan LVEF — kolom turunan di CSV ekspor,
// dipakai sebagai denominator saat menabulasi kelengkapan GDMT.
//
// Registry ini memakai DUA kategori: LVEF < 50% = HFrEF, ≥ 50% = HFpEF.
// Kelompok 41–49% (dulu "HFmrEF" di ESC 2021) sengaja digabung ke HFrEF,
// sesuai keputusan klinis tim registry. Nilai LVEF mentah tetap diekspor,
// jadi analis tetap bisa membuat pembagian lain bila dibutuhkan.

export type EfCategory = "HFrEF" | "HFpEF";

export const HFREF_UPPER_LIMIT = 50; // LVEF di bawah angka ini = HFrEF

export function efCategory(lvef: number | null | undefined): EfCategory | null {
  if (lvef == null || !Number.isFinite(lvef)) return null;
  return lvef < HFREF_UPPER_LIMIT ? "HFrEF" : "HFpEF";
}
