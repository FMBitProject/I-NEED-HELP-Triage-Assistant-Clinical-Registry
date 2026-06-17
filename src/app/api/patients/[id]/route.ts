import { db } from "@/lib/db";
import { patients, triageLogs, outcomes } from "@/lib/db/schema";
import { requireSession } from "@/lib/api-auth";
import { and, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;

  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.id, id), eq(patients.doctorId, session.user.id)),
  });

  if (!patient) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const triage = await db.query.triageLogs.findFirst({
    where: eq(triageLogs.patientId, id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  const outcome = await db.query.outcomes.findFirst({
    where: eq(outcomes.patientId, id),
    orderBy: (o, { desc }) => [desc(o.recordedAt)],
  });

  return Response.json({ patient, triage: triage ?? null, outcome: outcome ?? null });
}
