export type Gender = "M" | "F";

export type OutcomeStatus =
  | "STABLE"
  | "HOSPITALIZED"
  | "REFERRED"
  | "DECEASED"
  | "LOST_TO_FOLLOWUP";

/** Disposisi akhir kunjungan IGD — diketahui hari itu juga, tanpa follow-up. */
export type EdDisposition = "DISCHARGED" | "ADMITTED" | "REFERRED" | "DECEASED_ED";

/**
 * Onset gagal jantung: baru terdiagnosis (de novo) atau kronik. Variabel
 * standar Tabel 1 registri HF — relevan untuk interpretasi GDMT (pasien
 * de novo wajar belum menerima 4 pilar lengkap). UNKNOWN untuk kasus yang
 * riwayatnya memang tak dapat dipastikan (pasien tidak sadar, tanpa
 * keluarga) — katup jujur agar field wajib tidak memancing data karangan.
 */
export type HfOnset = "DE_NOVO" | "CHRONIC" | "UNKNOWN";

/**
 * Alasan satu pilar GDMT tidak diberikan — variabel kunci studi deskriptif
 * hambatan GDMT. Kategorinya mengikuti pembagian baku literatur barrier GDMT:
 * hambatan klinis, sistem/ketersediaan, inersia peresepan, faktor pasien.
 */
export type GdmtOmissionReason =
  | "CONTRAINDICATED"
  | "NOT_AVAILABLE"
  | "NOT_PRESCRIBED"
  | "PATIENT_BARRIER"
  | "UNKNOWN"
  | "OTHER";

export interface Patient {
  id: string;
  doctorId: string;
  patientInitial: string;
  age: number;
  gender: Gender;
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  lvef?: number;
  egfr?: number;
  ntProbnp?: number;
  comorbidDm: boolean;
  comorbidHtn: boolean;
  comorbidCkd: boolean;
  comorbidAf: boolean;
  onAceArni: boolean;
  onBb: boolean;
  onMra: boolean;
  onSglt2i: boolean;
  // Alasan per pilar GDMT yang TIDAK diberikan; null bila pilar diberikan
  // atau alasan tidak diisi (field bersifat opsional di form).
  noAceArniReason?: GdmtOmissionReason | null;
  noBbReason?: GdmtOmissionReason | null;
  noMraReason?: GdmtOmissionReason | null;
  noSglt2iReason?: GdmtOmissionReason | null;
  // Teks bebas penjelas, hanya terisi bila alasannya OTHER.
  noAceArniReasonOther?: string | null;
  noBbReasonOther?: string | null;
  noMraReasonOther?: string | null;
  noSglt2iReasonOther?: string | null;
  nyhaClass?: string | null;
  hfOnset?: HfOnset | null;
  edDisposition?: EdDisposition | null;
  createdAt: string;
  finalizedAt?: string | null;
}

export interface Outcome {
  id: string;
  patientId: string;
  status: OutcomeStatus;
  followUpDays: number;
  recordedAt: string;
  notes?: string;
  admissionDate?: string | null;
  dischargeDate?: string | null;
}

export interface Doctor {
  id: string;
  email: string;
  name: string;
  institutionType: string;
  createdAt: string;
  role: "DOCTOR" | "ADMIN";
  approved: boolean;
  ethicalClearanceNo?: string | null;
  ethicalClearanceDate?: string | null;
}

export interface PatientWithDetails extends Patient {
  outcome: Outcome | null;
}

export interface AuditLog {
  id: string;
  patientId: string;
  userId: string | null;
  userName: string | null;
  action: string;
  changedField: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}
