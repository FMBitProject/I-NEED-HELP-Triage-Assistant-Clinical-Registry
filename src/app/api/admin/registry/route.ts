import { db } from "@/lib/db";
import { outcomes, patients, triageLogs, user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { desc, eq, inArray } from "drizzle-orm";

// Registry lintas dokter — hanya ADMIN. Read-only: tidak pernah menulis
// atau mengubah data pasien milik dokter manapun.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await db
    .select({
      patient: patients,
      doctorName: user.name,
      doctorEmail: user.email,
      doctorInstitution: user.institutionType,
    })
    .from(patients)
    .innerJoin(user, eq(patients.doctorId, user.id))
    .orderBy(desc(patients.createdAt));

  if (rows.length === 0) return Response.json([]);

  const patientIds = rows.map((r) => r.patient.id);

  const [allLogs, allOutcomes] = await Promise.all([
    db.select().from(triageLogs).where(inArray(triageLogs.patientId, patientIds)),
    db.select().from(outcomes).where(inArray(outcomes.patientId, patientIds)),
  ]);

  const enriched = rows.map(({ patient: p, doctorName, doctorEmail, doctorInstitution }) => ({
    ...p,
    egfr: p.egfr != null ? parseFloat(p.egfr) : null,
    doctorName,
    doctorEmail,
    doctorInstitution,
    triage:
      allLogs
        .filter((l) => l.patientId === p.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ??
      null,
    outcome:
      allOutcomes
        .filter((o) => o.patientId === p.id)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0] ??
      null,
  }));

  return Response.json(enriched);
}
