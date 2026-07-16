import type { EdDisposition } from "./types";

// Disposisi akhir kunjungan IGD — endpoint minimal yang diketahui dokter
// hari itu juga tanpa perlu menghubungi pasien lagi. `desc` menjelaskan tiap
// pilihan agar tidak rancu antar-jenis faskes: di RS rujukan (mis. Tipe A/B)
// pasien skor "Rujuk" umumnya cukup dirawat inap di RS sendiri — pilih Rawat
// Inap, bukan Dirujuk.
export const ED_DISPOSITION_LABELS: Record<
  EdDisposition,
  { label: string; icon: string; desc: string }
> = {
  DISCHARGED: {
    label: "Pulang (Rawat Jalan)",
    icon: "🏠",
    desc: "Pulang dari IGD, lanjut rawat jalan",
  },
  ADMITTED: {
    label: "Rawat Inap",
    icon: "🛏️",
    desc: "Dirawat inap di RS ini — di RS rujukan, ini sudah tindak lanjut yang sesuai",
  },
  REFERRED: {
    label: "Dirujuk ke Faskes Lain",
    icon: "➡️",
    desc: "Dikirim ke faskes lain yang lebih mampu (lazim dari puskesmas/klinik/RS kecil)",
  },
  DECEASED_ED: {
    label: "Meninggal di IGD",
    icon: "🕊️",
    desc: "Meninggal selama perawatan di IGD",
  },
};

export const ED_DISPOSITION_OPTIONS = Object.entries(ED_DISPOSITION_LABELS).map(
  ([value, meta]) => ({ value: value as EdDisposition, ...meta })
);
