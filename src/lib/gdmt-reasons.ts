import type { GdmtOmissionReason } from "./types";

// Alasan pilar GDMT tidak diberikan — diisi opsional per pilar yang tidak
// dicentang. `label` singkat untuk chip di form, `desc` menjelaskan cakupan
// tiap kategori supaya pengisi tidak ragu memilih. Kategori dibuat saling
// eksklusif agar hasilnya langsung bisa ditabulasi untuk studi deskriptif
// hambatan GDMT (klinis / sistem / inersia peresepan / pasien).
export const GDMT_OMISSION_REASON_LABELS: Record<
  GdmtOmissionReason,
  { label: string; desc: string }
> = {
  CONTRAINDICATED: {
    label: "Kontraindikasi / intoleransi",
    desc: "Hipotensi, hiperkalemia, gangguan ginjal, bradikardia, atau riwayat efek samping",
  },
  NOT_AVAILABLE: {
    label: "Tidak tersedia / tidak ditanggung",
    desc: "Stok kosong, di luar formularium, atau tidak ditanggung BPJS/asuransi",
  },
  NOT_PRESCRIBED: {
    label: "Belum diresepkan",
    desc: "Tidak ada instruksi/advis DPJP — belum sempat dipertimbangkan",
  },
  PATIENT_BARRIER: {
    label: "Faktor pasien",
    desc: "Pasien menolak, tidak patuh, atau terkendala biaya pribadi",
  },
  UNKNOWN: {
    label: "Tidak diketahui",
    desc: "Riwayat obat tidak jelas, mis. pasien baru tanpa data pengobatan",
  },
  OTHER: {
    label: "Lainnya",
    desc: "Alasan lain di luar kategori yang tersedia",
  },
};

export const GDMT_OMISSION_REASON_OPTIONS = Object.entries(
  GDMT_OMISSION_REASON_LABELS
).map(([value, meta]) => ({ value: value as GdmtOmissionReason, ...meta }));
