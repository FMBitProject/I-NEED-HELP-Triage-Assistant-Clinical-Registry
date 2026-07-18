import type { HfOnset } from "./types";

// Onset gagal jantung — dua tombol opsional di form profil, tanpa ketikan.
// Variabel standar Tabel 1 registri HF; penting saat menafsirkan kelengkapan
// GDMT (pasien de novo wajar belum menerima 4 pilar).
export const HF_ONSET_LABELS: Record<HfOnset, { label: string; caption: string }> = {
  DE_NOVO: {
    label: "De Novo",
    caption: "Baru pertama kali terdiagnosis (termasuk pada kunjungan ini)",
  },
  CHRONIC: {
    label: "Kronik",
    caption: "Sudah pernah terdiagnosis gagal jantung sebelumnya",
  },
};

export const HF_ONSET_OPTIONS = Object.entries(HF_ONSET_LABELS).map(
  ([value, meta]) => ({ value: value as HfOnset, ...meta })
);
