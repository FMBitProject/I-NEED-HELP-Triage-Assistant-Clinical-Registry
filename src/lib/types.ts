export type Gender = "M" | "F";

export type OutcomeStatus =
  | "STABLE"
  | "HOSPITALIZED"
  | "REFERRED"
  | "DECEASED"
  | "LOST_TO_FOLLOWUP";

/** Disposisi akhir kunjungan IGD — diketahui hari itu juga, tanpa follow-up. */
export type EdDisposition = "DISCHARGED" | "ADMITTED" | "REFERRED" | "DECEASED_ED";

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
  nyhaClass?: string | null;
  edDisposition?: EdDisposition | null;
  createdAt: string;
  finalizedAt?: string | null;
}

export interface TriageCriteria {
  I: boolean; // Inotropik IV
  N: boolean; // NYHA IIIB/IV atau Natriuretic Peptide
  E1: boolean; // End-organ dysfunction
  E2: boolean; // EF (LVEF) < 35%
  D: boolean; // Defibrillator shock
  H: boolean; // Hospitalisasi > 1x/tahun
  E3: boolean; // Edema persisten
  L: boolean; // Low BP, High HR
  P: boolean; // Intolerasi GDMT
}

export interface TriageLog {
  id: string;
  patientId: string;
  score: number;
  criteriaMet: TriageCriteria;
  recommendationGiven: "REFER" | "CONTINUE_GDMT";
  createdAt: string;
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
  notReferredReason?: string | null;
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
  triage: TriageLog | null;
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
