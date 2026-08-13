import { db } from "@/lib/db";
import { outcomes, patients, user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { buildCsv } from "@/lib/csv";
import { eq } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [patientRows, allOutcomes] = await Promise.all([
    db
      .select({
        doctorId: user.id,
        doctorName: user.name,
        institutionType: user.institutionType,
        ethicalClearanceNo: user.ethicalClearanceNo,
        ethicalClearanceDate: user.ethicalClearanceDate,
        patientId: patients.id,
        patientInitial: patients.patientInitial,
        age: patients.age,
        gender: patients.gender,
        systolicBp: patients.systolicBp,
        diastolicBp: patients.diastolicBp,
        heartRate: patients.heartRate,
        lvef: patients.lvef,
        egfr: patients.egfr,
        ntProbnp: patients.ntProbnp,
        nyhaClass: patients.nyhaClass,
        hfOnset: patients.hfOnset,
        comorbidDm: patients.comorbidDm,
        comorbidHtn: patients.comorbidHtn,
        comorbidCkd: patients.comorbidCkd,
        comorbidAf: patients.comorbidAf,
        onAceArni: patients.onAceArni,
        onBb: patients.onBb,
        onMra: patients.onMra,
        onSglt2i: patients.onSglt2i,
        noAceArniReason: patients.noAceArniReason,
        noBbReason: patients.noBbReason,
        noMraReason: patients.noMraReason,
        noSglt2iReason: patients.noSglt2iReason,
        noAceArniReasonOther: patients.noAceArniReasonOther,
        noBbReasonOther: patients.noBbReasonOther,
        noMraReasonOther: patients.noMraReasonOther,
        noSglt2iReasonOther: patients.noSglt2iReasonOther,
        edDisposition: patients.edDisposition,
        patientCreatedAt: patients.createdAt,
      })
      .from(patients)
      .innerJoin(user, eq(patients.doctorId, user.id))
      .orderBy(patients.createdAt),
    db.select().from(outcomes),
  ]);

  // Satu outcome (yang terakhir dicatat) per pasien — konsisten dengan
  // endpoint /api/patients.
  const latestOutcomeByPatient = new Map<string, (typeof allOutcomes)[number]>();
  for (const o of allOutcomes) {
    const existing = latestOutcomeByPatient.get(o.patientId);
    if (!existing || new Date(o.recordedAt) > new Date(existing.recordedAt)) {
      latestOutcomeByPatient.set(o.patientId, o);
    }
  }

  // Satu baris per pasien.
  const rows: Record<string, unknown>[] = patientRows.map((p) => {
    const outcome = latestOutcomeByPatient.get(p.patientId);

    // Kolom turunan dari LVEF (batas ESC/PERKI: <40 HFrEF, 40–49 HFmrEF,
    // ≥50 HFpEF) — denominator yang benar saat menabulasi kelengkapan GDMT,
    // tanpa input tambahan dari pengguna.
    const efCategory =
      p.lvef == null
        ? null
        : p.lvef < 40
          ? "HFrEF"
          : p.lvef < 50
            ? "HFmrEF"
            : "HFpEF";

    return {
      ...p,
      efCategory,
      outcomeStatus: outcome?.status ?? null,
      outcomeFollowUpDays: outcome?.followUpDays ?? null,
      outcomeNotes: outcome?.notes ?? null,
      outcomeAdmissionDate: outcome?.admissionDate ?? null,
      outcomeDischargeDate: outcome?.dischargeDate ?? null,
      outcomeRecordedAt: outcome?.recordedAt ?? null,
    };
  });

  const headers = [
    "doctorId","doctorName","institutionType","ethicalClearanceNo","ethicalClearanceDate",
    "patientId","patientInitial","age","gender",
    "systolicBp","diastolicBp","heartRate",
    "lvef","efCategory","egfr","ntProbnp","nyhaClass","hfOnset",
    "comorbidDm","comorbidHtn","comorbidCkd","comorbidAf",
    "onAceArni","onBb","onMra","onSglt2i",
    "noAceArniReason","noBbReason","noMraReason","noSglt2iReason",
    "noAceArniReasonOther","noBbReasonOther","noMraReasonOther","noSglt2iReasonOther",
    "edDisposition",
    "patientCreatedAt",
    "outcomeStatus","outcomeFollowUpDays","outcomeNotes",
    "outcomeAdmissionDate","outcomeDischargeDate",
    "outcomeRecordedAt",
  ];

  return new Response(buildCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registry_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
