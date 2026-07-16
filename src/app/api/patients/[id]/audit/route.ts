import { db } from "@/lib/db";
import { auditLogs, patients } from "@/lib/db/schema";
import { requireApprovedSession } from "@/lib/api-auth";
import { and, asc, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const { id } = await params;

  // ADMIN boleh membaca audit trail pasien dokter manapun (read-only).
  const isAdmin = (session.user as { role?: string }).role === "ADMIN";
  const patient = await db.query.patients.findFirst({
    where: isAdmin
      ? eq(patients.id, id)
      : and(eq(patients.id, id), eq(patients.doctorId, session.user.id)),
  });

  if (!patient) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.patientId, id))
    .orderBy(asc(auditLogs.createdAt));

  return Response.json(logs);
}
