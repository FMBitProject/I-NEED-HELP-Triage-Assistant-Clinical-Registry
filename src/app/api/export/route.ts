import { db } from "@/lib/db";
import { outcomes, patients, user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { buildCsv } from "@/lib/csv";
import { ACCESS_LOG_FAILED_MESSAGE, recordAccess } from "@/lib/access-log";
import { EXPORT_HEADERS } from "@/lib/export-columns";
import { efCategory } from "@/lib/ef-category";
import { eq } from "drizzle-orm";

// Minimalisasi data (UU PDP): ekspor riset sengaja TIDAK memuat inisial
// pasien maupun nama dokter. Analisis statistik tidak butuh keduanya, dan
// inisial + usia + jenis kelamin + tanggal cukup untuk menebak identitas
// pasien bila file CSV bocor. Pasien & dokter dikenali lewat ID acak (UUID).
export async function GET(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const [patientRows, allOutcomes] = await Promise.all([
    db
      .select({
        doctorId: user.id,
        institutionType: user.institutionType,
        doctorType: user.doctorType,
        ethicalClearanceNo: user.ethicalClearanceNo,
        ethicalClearanceDate: user.ethicalClearanceDate,
        patientId: patients.id,
        consentBasis: patients.consentBasis,
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
        careSetting: patients.careSetting,
        visitDisposition: patients.visitDisposition,
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

    return {
      ...p,
      // Dua kategori: <50 HFrEF, ≥50 HFpEF — lihat src/lib/ef-category.ts.
      efCategory: efCategory(p.lvef),
      outcomeStatus: outcome?.status ?? null,
      outcomeFollowUpDays: outcome?.followUpDays ?? null,
      outcomeNotes: outcome?.notes ?? null,
      outcomeAdmissionDate: outcome?.admissionDate ?? null,
      outcomeDischargeDate: outcome?.dischargeDate ?? null,
      outcomeRecordedAt: outcome?.recordedAt ?? null,
    };
  });

  // CSV dibangun dulu: kalau gagal, jangan sampai log mencatat ekspor yang
  // tidak pernah terkirim.
  const csv = buildCsv([...EXPORT_HEADERS], rows);

  // Catat SEBELUM file dikirim: kalau pencatatan gagal, ekspor ikut gagal —
  // tidak boleh ada unduhan seluruh registri yang tidak meninggalkan jejak.
  try {
    await recordAccess(request, session.user, "export_csv", { patients: rows.length });
  } catch (err) {
    console.error("[export] gagal mencatat access_log, ekspor dibatalkan", err);
    return Response.json({ error: ACCESS_LOG_FAILED_MESSAGE }, { status: 503 });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registry_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
