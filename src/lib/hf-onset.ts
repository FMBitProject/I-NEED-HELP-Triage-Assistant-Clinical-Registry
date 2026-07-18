import type { HfOnset } from "./types";

// Onset gagal jantung — tombol wajib-isi di form profil, tanpa ketikan.
// Variabel standar Tabel 1 registri HF; penting saat menafsirkan kelengkapan
// GDMT (pasien de novo wajar belum menerima 4 pilar). "Tidak Diketahui"
// sengaja disediakan sebagai jawaban jujur — lebih baik daripada dokter asal
// pilih hanya demi lolos validasi.
export const HF_ONSET_LABELS: Record<HfOnset, { label: string; caption: string }> = {
  DE_NOVO: {
    label: "De Novo",
    caption: "Baru pertama kali terdiagnosis (termasuk pada kunjungan ini)",
  },
  CHRONIC: {
    label: "Kronik",
    caption: "Sudah pernah terdiagnosis gagal jantung sebelumnya",
  },
  UNKNOWN: {
    label: "Tidak Diketahui",
    caption: "Riwayat tak dapat dipastikan (mis. pasien tidak sadar, tanpa pendamping)",
  },
};

export const HF_ONSET_OPTIONS = Object.entries(HF_ONSET_LABELS).map(
  ([value, meta]) => ({ value: value as HfOnset, ...meta })
);
