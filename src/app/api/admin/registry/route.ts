import { db } from "@/lib/db";
import { outcomes, patients, user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { desc, eq, inArray } from "drizzle-orm";
import { ACCESS_LOG_FAILED_MESSAGE, recordAccess } from "@/lib/access-log";

// Registry lintas dokter — hanya ADMIN. Read-only: tidak pernah menulis
// atau mengubah data pasien milik dokter manapun.
//
// Respons ini berisi SELURUH registri (lebih lengkap dari CSV ekspor), jadi
// setiap aksesnya dicatat di access_logs sama seperti ekspor.
export async function GET(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    await recordAccess(request, session.user, "view_registry", {});
  } catch (err) {
    console.error("[admin/registry] gagal mencatat access_log", err);
    return Response.json({ error: ACCESS_LOG_FAILED_MESSAGE }, { status: 503 });
  }

  const rows = await db
    .select({
      patient: patients,
      doctorName: user.name,
      doctorEmail: user.email,
      doctorInstitution: user.institutionType,
      doctorType: user.doctorType,
    })
    .from(patients)
    .innerJoin(user, eq(patients.doctorId, user.id))
    .orderBy(desc(patients.createdAt));

  if (rows.length === 0) return Response.json([]);

  const patientIds = rows.map((r) => r.patient.id);

  const allOutcomes = await db
    .select()
    .from(outcomes)
    .where(inArray(outcomes.patientId, patientIds));

  const enriched = rows.map(({ patient: p, doctorName, doctorEmail, doctorInstitution, doctorType }) => ({
    ...p,
    egfr: p.egfr != null ? parseFloat(p.egfr) : null,
    doctorName,
    doctorEmail,
    doctorInstitution,
    doctorType,
    outcome:
      allOutcomes
        .filter((o) => o.patientId === p.id)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0] ??
      null,
  }));

  return Response.json(enriched);
}
