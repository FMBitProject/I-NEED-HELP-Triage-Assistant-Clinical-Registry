import type { DoctorType } from "./types";
import { isEnumValue } from "./enum-field";

// Registri ini diisi oleh dokter di poliklinik maupun ruang rawat inap, dan
// terbuka untuk dokter umum maupun spesialis. Kategorinya ikut dicatat sebagai
// provenans data: pola peresepan GDMT oleh dokter umum dan spesialis jantung
// wajar berbeda, dan itu justru temuan yang ingin dilihat registri.
export const DOCTOR_TYPE_LABELS: Record<DoctorType, string> = {
  GENERAL_PRACTITIONER: "Dokter Umum",
  INTERNAL_MEDICINE: "Spesialis Penyakit Dalam (Sp.PD)",
  CARDIOLOGY: "Spesialis Jantung & Pembuluh Darah (Sp.JP)",
  OTHER_SPECIALIST: "Spesialis Lainnya",
};

export const DOCTOR_TYPE_OPTIONS = Object.entries(DOCTOR_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as DoctorType, label })
);

export function isValidDoctorType(value: unknown): value is DoctorType {
  return isEnumValue(DOCTOR_TYPE_LABELS, value);
}

export const INVALID_DOCTOR_TYPE_MESSAGE =
  "Jenis dokter wajib dipilih (dokter umum, Sp.PD, Sp.JP, atau spesialis lainnya).";
