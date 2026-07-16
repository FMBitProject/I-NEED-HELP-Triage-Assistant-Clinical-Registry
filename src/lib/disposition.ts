import type { EdDisposition } from "./types";

// Disposisi akhir kunjungan IGD — endpoint minimal yang diketahui dokter
// hari itu juga tanpa perlu menghubungi pasien lagi.
export const ED_DISPOSITION_LABELS: Record<EdDisposition, { label: string; icon: string }> = {
  DISCHARGED: { label: "Pulang (Rawat Jalan)", icon: "🏠" },
  ADMITTED: { label: "Rawat Inap", icon: "🛏️" },
  REFERRED: { label: "Dirujuk ke Faskes Lanjut", icon: "➡️" },
  DECEASED_ED: { label: "Meninggal di IGD", icon: "🕊️" },
};

export const ED_DISPOSITION_OPTIONS = Object.entries(ED_DISPOSITION_LABELS).map(
  ([value, meta]) => ({ value: value as EdDisposition, ...meta })
);
