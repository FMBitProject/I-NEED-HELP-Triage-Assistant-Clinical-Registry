/**
 * Validasi field enum (string dengan himpunan nilai tetap) di sisi server.
 *
 * Form klien sudah membatasi pilihan lewat tombol, tapi API tetap menerima
 * JSON mentah — dari antrean offline lama, tab browser basi, atau kiriman
 * manual. Tanpa validasi di server, nilai sembarang ("IGD", "foo") masuk ke
 * DB, UI diam-diam menyembunyikannya, dan baru ketahuan saat analisis CSV.
 */

/**
 * True bila `value` adalah salah satu key milik `labels` sendiri.
 * Sengaja memakai hasOwnProperty, BUKAN operator `in`: `"toString" in labels`
 * bernilai true karena ikut memeriksa prototype chain.
 */
export function isEnumValue<T extends string>(
  labels: Record<T, unknown>,
  value: unknown
): value is T {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(labels, value);
}

export type EnumParseResult<T> =
  | { ok: true; value: T | null }
  | { ok: false; error: string };

/**
 * Parse field enum opsional. undefined / null / "" → null (tidak diisi).
 * Nilai lain harus salah satu key `labels`; selain itu → error yang
 * menyebutkan nama field dan nilainya, supaya jelas untuk dokter (muncul
 * sebagai alasan penolakan di antrean offline) maupun developer.
 */
export function parseOptionalEnum<T extends string>(
  field: string,
  raw: unknown,
  labels: Record<T, unknown>
): EnumParseResult<T> {
  if (raw === undefined || raw === null || raw === "") return { ok: true, value: null };
  if (isEnumValue(labels, raw)) return { ok: true, value: raw };
  return {
    ok: false,
    error: `Nilai ${field} tidak valid: "${String(raw).slice(0, 50)}"`,
  };
}
