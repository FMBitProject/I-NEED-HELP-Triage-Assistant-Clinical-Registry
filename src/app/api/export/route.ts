import { db } from "@/lib/db";
import { outcomes, patients, triageLogs, user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { buildCsv } from "@/lib/csv";
import { eq } from "drizzle-orm";
import type { TriageCriteria } from "@/lib/types";

// Kunci kriteria I-NEED-HELP, dipecah jadi kolom boolean terpisah agar CSV
// langsung siap dianalisis di SPSS/Stata/R (tanpa parsing JSON).
const CRITERIA_KEYS: (keyof TriageCriteria)[] = [
  "I",
  "N",
  "E1",
  "E2",
  "D",
  "H",
  "E3",
  "L",
  "P",
];

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  // Kueri dipisah (bukan double left-join) supaya pasien dengan >1 triase dan
  // >1 outcome tidak menghasilkan baris perkalian silang (duplikasi data).
  const [patientRows, allLogs, allOutcomes] = await Promise.all([
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
        comorbidDm: patients.comorbidDm,
        comorbidHtn: patients.comorbidHtn,
        comorbidCkd: patients.comorbidCkd,
        comorbidAf: patients.comorbidAf,
        onAceArni: patients.onAceArni,
        onBb: patients.onBb,
        onMra: patients.onMra,
        onSglt2i: patients.onSglt2i,
        patientCreatedAt: patients.createdAt,
      })
      .from(patients)
      .innerJoin(user, eq(patients.doctorId, user.id))
      .orderBy(patients.createdAt),
    db.select().from(triageLogs),
    db.select().from(outcomes),
  ]);

  const logsByPatient = new Map<string, typeof allLogs>();
  for (const log of allLogs) {
    const list = logsByPatient.get(log.patientId) ?? [];
    list.push(log);
    logsByPatient.set(log.patientId, list);
  }

  // Satu outcome (yang terakhir dicatat) per pasien — konsisten dengan
  // endpoint /api/patients.
  const latestOutcomeByPatient = new Map<string, (typeof allOutcomes)[number]>();
  for (const o of allOutcomes) {
    const existing = latestOutcomeByPatient.get(o.patientId);
    if (!existing || new Date(o.recordedAt) > new Date(existing.recordedAt)) {
      latestOutcomeByPatient.set(o.patientId, o);
    }
  }

  // Format long: 1 baris per triase; pasien tanpa triase tetap muncul 1 baris.
  const rows: Record<string, unknown>[] = [];
  for (const p of patientRows) {
    const logs = (logsByPatient.get(p.patientId) ?? []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const outcome = latestOutcomeByPatient.get(p.patientId);

    const outcomeCols = {
      outcomeStatus: outcome?.status ?? null,
      outcomeFollowUpDays: outcome?.followUpDays ?? null,
      outcomeNotes: outcome?.notes ?? null,
      outcomeAdmissionDate: outcome?.admissionDate ?? null,
      outcomeDischargeDate: outcome?.dischargeDate ?? null,
      outcomeNotReferredReason: outcome?.notReferredReason ?? null,
      outcomeRecordedAt: outcome?.recordedAt ?? null,
    };

    if (logs.length === 0) {
      rows.push({ ...p, ...outcomeCols });
      continue;
    }

    for (const log of logs) {
      const criteriaCols = Object.fromEntries(
        CRITERIA_KEYS.map((k) => [`crit_${k}`, log.criteriaMet?.[k] ?? false])
      );
      rows.push({
        ...p,
        triageId: log.id,
        triageScore: log.score,
        ...criteriaCols,
        triageRecommendation: log.recommendationGiven,
        triageCreatedAt: log.createdAt,
        ...outcomeCols,
      });
    }
  }

  const headers = [
    "doctorId","doctorName","institutionType","ethicalClearanceNo","ethicalClearanceDate",
    "patientId","patientInitial","age","gender",
    "systolicBp","diastolicBp","heartRate",
    "lvef","egfr","ntProbnp","nyhaClass",
    "comorbidDm","comorbidHtn","comorbidCkd","comorbidAf",
    "onAceArni","onBb","onMra","onSglt2i",
    "patientCreatedAt",
    "triageId","triageScore",
    ...CRITERIA_KEYS.map((k) => `crit_${k}`),
    "triageRecommendation","triageCreatedAt",
    "outcomeStatus","outcomeFollowUpDays","outcomeNotes",
    "outcomeAdmissionDate","outcomeDischargeDate","outcomeNotReferredReason",
    "outcomeRecordedAt",
  ];

  return new Response(buildCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registry_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
