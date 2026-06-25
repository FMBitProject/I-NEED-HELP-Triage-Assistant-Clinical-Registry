import { db } from "@/lib/db";
import { patients, triageLogs } from "@/lib/db/schema";
import { requireApprovedSession } from "@/lib/api-auth";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const { id } = await params;

  const log = await db.query.triageLogs.findFirst({
    where: eq(triageLogs.id, id),
  });

  if (!log) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Verify the patient belongs to this doctor
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, log.patientId),
  });

  if (!patient || patient.doctorId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ log, patient });
}
