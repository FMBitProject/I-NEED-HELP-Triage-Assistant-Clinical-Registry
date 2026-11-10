import type { CareSetting } from "./types";

// Lokasi perawatan saat pasien didaftarkan ke registri. Registri ini diisi oleh
// dokter di poliklinik rawat jalan dan di ruang rawat inap (bukan IGD), jadi
// variabel ini yang memisahkan kedua populasi saat tabulasi — profil GDMT
// pasien poli yang stabil wajar berbeda dari pasien yang sedang dirawat inap.
export const CARE_SETTING_LABELS: Record<
  CareSetting,
  { label: string; icon: string; desc: string }
> = {
  POLI: {
    label: "Poliklinik (Rawat Jalan)",
    icon: "🏥",
    desc: "Pasien kontrol atau konsultasi di poli rawat jalan",
  },
  INPATIENT: {
    label: "Rawat Inap (Bangsal)",
    icon: "🛏️",
    desc: "Pasien sedang dirawat di ruang rawat inap",
  },
};

export const CARE_SETTING_OPTIONS = Object.entries(CARE_SETTING_LABELS).map(
  ([value, meta]) => ({ value: value as CareSetting, ...meta })
);
