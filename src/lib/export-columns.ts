// Kolom CSV ekspor riset — satu sumber untuk route /api/export dan halaman
// /export (yang menampilkan jumlah kolom). Jangan di-hardcode di tempat lain.
//
// Minimalisasi data (UU PDP): sengaja TIDAK ada inisial pasien maupun nama
// dokter. Pasien & dokter dikenali lewat ID acak (UUID).
export const EXPORT_HEADERS = [
  "doctorId","institutionType","doctorType","ethicalClearanceNo","ethicalClearanceDate",
  "patientId","consentBasis","careSetting","age","gender",
  "systolicBp","diastolicBp","heartRate",
  "lvef","efCategory","egfr","ntProbnp","nyhaClass","hfOnset",
  "comorbidDm","comorbidHtn","comorbidCkd","comorbidAf",
  "onAceArni","onBb","onMra","onSglt2i",
  "noAceArniReason","noBbReason","noMraReason","noSglt2iReason",
  "noAceArniReasonOther","noBbReasonOther","noMraReasonOther","noSglt2iReasonOther",
  "visitDisposition",
  "patientCreatedAt",
  "outcomeStatus","outcomeFollowUpDays","outcomeNotes",
  "outcomeAdmissionDate","outcomeDischargeDate",
  "outcomeRecordedAt",
] as const;
