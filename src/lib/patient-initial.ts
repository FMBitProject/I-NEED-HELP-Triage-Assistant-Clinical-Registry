// Minimalisasi data (UU PDP): registri hanya boleh menyimpan INISIAL pasien.
// Form sudah membatasi 4 karakter, tapi API menerima JSON mentah (antrean
// offline lama, kiriman manual), jadi batasnya ditegakkan juga di server —
// kalau tidak, nama lengkap pasien bisa masuk ke DB lewat jalur lain.

export const MAX_INITIAL_LETTERS = 4;

export const INVALID_INITIAL_MESSAGE = `Inisial pasien harus 1–${MAX_INITIAL_LETTERS} huruf saja (contoh: BW) — jangan isi nama lengkap, NIK, atau nomor rekam medis.`;

/**
 * Normalisasi inisial: buang titik/spasi/tanda baca, jadikan huruf besar.
 * "b.w." → "BW". Mengembalikan null bila hasilnya kosong, lebih dari
 * MAX_INITIAL_LETTERS huruf, atau mengandung angka (indikasi NIK / no. RM).
 */
export function normalizePatientInitial(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (/\d/.test(raw)) return null;
  const letters = raw.replace(/[^\p{L}]/gu, "").toUpperCase();
  if (letters.length < 1 || letters.length > MAX_INITIAL_LETTERS) return null;
  return letters;
}
