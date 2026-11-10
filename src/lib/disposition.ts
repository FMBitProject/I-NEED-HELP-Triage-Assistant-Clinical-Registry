import type { CareSetting, VisitDisposition } from "./types";

// Disposisi akhir episode perawatan — endpoint minimal yang diketahui dokter
// tanpa perlu menghubungi pasien lagi. `desc` menjelaskan tiap pilihan agar
// tetap jelas untuk kedua lokasi pengisian registri: poliklinik rawat jalan
// maupun ruang rawat inap.
//
// Satu kode = satu arti klinis. ADMITTED hanya berarti "dari poli diputuskan
// rawat inap". Pasien bangsal yang masih dirawat TIDAK diberi ADMITTED —
// disposisinya dibiarkan kosong (null) sampai pasien pulang/dirujuk/meninggal.
export const VISIT_DISPOSITION_LABELS: Record<
  VisitDisposition,
  { label: string; icon: string; desc: string }
> = {
  DISCHARGED: {
    label: "Pulang (Rawat Jalan)",
    icon: "🏠",
    desc: "Selesai kunjungan poli, atau pulang setelah selesai rawat inap",
  },
  ADMITTED: {
    label: "Rawat Inap",
    icon: "🛏️",
    desc: "Dari poli diputuskan rawat inap",
  },
  REFERRED: {
    label: "Dirujuk ke Faskes Lain",
    icon: "➡️",
    desc: "Dikirim ke faskes lain yang lebih mampu",
  },
  DECEASED: {
    label: "Meninggal",
    icon: "🕊️",
    desc: "Meninggal selama episode perawatan di RS ini",
  },
};

export const VISIT_DISPOSITION_OPTIONS = Object.entries(VISIT_DISPOSITION_LABELS).map(
  ([value, meta]) => ({ value: value as VisitDisposition, ...meta })
);

/**
 * Nilai disposisi dari versi lama (era IGD) → nilai baru. Masih bisa datang
 * dari entri antrean offline yang tersimpan sebelum rename, atau dari baris
 * DB yang belum dimigrasi.
 */
const LEGACY_DISPOSITION_MAP: Record<string, VisitDisposition> = {
  DECEASED_ED: "DECEASED",
};

/**
 * Ambil nilai disposisi mentah dari body request, termasuk nama field lama
 * `edDisposition` (antrean offline lama), lalu petakan nilai lama ke nilai
 * baru. TIDAK memvalidasi — hasilnya tetap harus lewat parseOptionalEnum.
 */
export function readRawDisposition(body: Record<string, unknown>): unknown {
  const raw = body.visitDisposition ?? body.edDisposition;
  if (typeof raw === "string" && Object.prototype.hasOwnProperty.call(LEGACY_DISPOSITION_MAP, raw)) {
    return LEGACY_DISPOSITION_MAP[raw];
  }
  return raw;
}

/**
 * Kombinasi lokasi perawatan × disposisi yang tidak bermakna. Saat ini satu:
 * pasien yang didaftarkan DI bangsal tidak bisa "diputuskan rawat inap".
 */
// Parameter bertipe string (bukan CareSetting/VisitDisposition) karena nilai
// dari baris DB bertipe text mentah.
export function isDispositionAllowed(
  careSetting: CareSetting | string | null | undefined,
  disposition: VisitDisposition | string | null | undefined
): boolean {
  return !(careSetting === "INPATIENT" && disposition === "ADMITTED");
}

/** Opsi disposisi yang boleh dipilih untuk lokasi perawatan tertentu. */
export function dispositionOptionsFor(careSetting: CareSetting | "" | null | undefined) {
  return VISIT_DISPOSITION_OPTIONS.filter((opt) =>
    isDispositionAllowed(careSetting || null, opt.value)
  );
}
