import { db } from "@/lib/db";
import { outcomes, patients, triageLogs, user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await db
    .select({
      // Doctor info
      doctorId: user.id,
      doctorName: user.name,
      institutionType: user.institutionType,
      ethicalClearanceNo: user.ethicalClearanceNo,
      ethicalClearanceDate: user.ethicalClearanceDate,
      // Patient info
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
      comorbidDm: patients.comorbidDm,
      comorbidHtn: patients.comorbidHtn,
      comorbidCkd: patients.comorbidCkd,
      comorbidAf: patients.comorbidAf,
      onAceArni: patients.onAceArni,
      onBb: patients.onBb,
      onMra: patients.onMra,
      onSglt2i: patients.onSglt2i,
      patientCreatedAt: patients.createdAt,
      // Triage
      triageId: triageLogs.id,
      triageScore: triageLogs.score,
      triageCriteriaMet: triageLogs.criteriaMet,
      triageRecommendation: triageLogs.recommendationGiven,
      triageCreatedAt: triageLogs.createdAt,
      // Outcome
      outcomeStatus: outcomes.status,
      outcomeFollowUpDays: outcomes.followUpDays,
      outcomeNotes: outcomes.notes,
      outcomeRecordedAt: outcomes.recordedAt,
    })
    .from(patients)
    .innerJoin(user, eq(patients.doctorId, user.id))
    .leftJoin(triageLogs, eq(triageLogs.patientId, patients.id))
    .leftJoin(outcomes, eq(outcomes.patientId, patients.id))
    .orderBy(patients.createdAt);

  const headers = [
    "doctorId","doctorName","institutionType","ethicalClearanceNo","ethicalClearanceDate",
    "patientId","patientInitial","age","gender",
    "systolicBp","diastolicBp","heartRate",
    "lvef","egfr","ntProbnp",
    "comorbidDm","comorbidHtn","comorbidCkd","comorbidAf",
    "onAceArni","onBb","onMra","onSglt2i",
    "patientCreatedAt",
    "triageId","triageScore","triageCriteriaMet","triageRecommendation","triageCreatedAt",
    "outcomeStatus","outcomeFollowUpDays","outcomeNotes","outcomeRecordedAt",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h as keyof typeof row];
          if (val === null || val === undefined) return "";
          if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          if (typeof val === "string" && val.includes(",")) return `"${val}"`;
          return String(val);
        })
        .join(",")
    ),
  ].join("\n");

  return new Response(csvRows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="registry_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
