// Minimalisasi data (UU PDP): registri hanya boleh menyimpan INISIAL pasien.
// Form sudah membatasi 4 karakter, tapi API menerima JSON mentah (antrean
// offline lama, kiriman manual), jadi batasnya ditegakkan juga di server —
// kalau tidak, nama lengkap pasien bisa masuk ke DB lewat jalur lain.
//
// Batasan yang jujur: kode tidak bisa membedakan "ANI" sebagai nama dan "ANI"
// sebagai inisial Ahmad Nur Iskandar. Aturan "mirip nama" di bawah adalah
// mitigasi untuk kasus paling umum (nama depan pendek seperti Budi, Siti,
// Agus), BUKAN jaminan. Dokter yang memang punya inisial berbentuk kata
// diminta menulisnya dengan titik ("A.N.I") — pilihan sadar, bukan kebetulan.

export const MAX_INITIAL_LETTERS = 4;
/** Panjang ketikan maksimal di form: 4 huruf + titik pemisah ("B.U.D.I."). */
export const MAX_INITIAL_INPUT_LENGTH = MAX_INITIAL_LETTERS * 2;

export const INVALID_INITIAL_MESSAGE = `Inisial pasien harus 1–${MAX_INITIAL_LETTERS} huruf saja (contoh: BW) — jangan isi nama lengkap, NIK, atau nomor rekam medis.`;

export const NAME_LIKE_INITIAL_MESSAGE =
  "Inisial ini terbaca seperti nama (mis. BUDI, SITI). Jangan isi nama pasien. Bila memang inisial, tulis dengan titik, contoh: A.N.I";

export type InitialCheck = { ok: true; value: string } | { ok: false; error: string };

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

/**
 * Satu kata ≥3 huruf yang huruf hidup & matinya selang-seling (BUDI, SITI,
 * AGUS, ANI) dan diketik TANPA pemisah. Inisial asli jarang berpola begitu
 * (BW, NKAP, MRS), dan kalaupun iya, dokter bisa menulisnya bertitik.
 */
function looksLikeName(raw: string, letters: string[]): boolean {
  if (letters.length < 3) return false;
  if (/[^\p{L}]/u.test(raw.trim())) return false; // ada titik/spasi = sengaja ditulis sebagai inisial
  return letters.every((ch, i) => i === 0 || VOWELS.has(ch) !== VOWELS.has(letters[i - 1]));
}

/**
 * Normalisasi + validasi inisial: buang titik/spasi/tanda baca & tanda aksen
 * (NFKD, supaya "É" dan "É" tersimpan sama), jadikan huruf besar.
 * "b.w." → "BW".
 */
export function checkPatientInitial(raw: unknown): InitialCheck {
  if (typeof raw !== "string") return { ok: false, error: INVALID_INITIAL_MESSAGE };
  // Angka apa pun (termasuk angka full-width/non-latin) = indikasi NIK / no. RM.
  if (/\p{N}/u.test(raw)) return { ok: false, error: INVALID_INITIAL_MESSAGE };
  // Dihitung per huruf (code point), bukan per unit UTF-16.
  const letters = [...raw.normalize("NFKD").replace(/[^\p{L}]/gu, "").toUpperCase()];
  if (letters.length < 1 || letters.length > MAX_INITIAL_LETTERS) {
    return { ok: false, error: INVALID_INITIAL_MESSAGE };
  }
  if (looksLikeName(raw, letters)) return { ok: false, error: NAME_LIKE_INITIAL_MESSAGE };
  return { ok: true, value: letters.join("") };
}

/** Versi ringkas: inisial ternormalisasi, atau null bila tidak valid. */
export function normalizePatientInitial(raw: unknown): string | null {
  const r = checkPatientInitial(raw);
  return r.ok ? r.value : null;
}
