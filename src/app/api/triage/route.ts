import { db } from "@/lib/db";
import { patients, triageLogs } from "@/lib/db/schema";
import { requireSession } from "@/lib/api-auth";
import { getTriageResult } from "@/lib/triage";
import { and, eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const { patientId, criteria } = body;

  // Verify patient belongs to this doctor
  const patient = await db.query.patients.findFirst({
    where: and(
      eq(patients.id, patientId),
      eq(patients.doctorId, session.user.id)
    ),
  });

  if (!patient) {
    return Response.json({ error: "Patient not found" }, { status: 404 });
  }

  const result = getTriageResult(criteria);

  const [log] = await db
    .insert(triageLogs)
    .values({
      patientId,
      score: result.score,
      criteriaMet: criteria,
      recommendationGiven: result.recommendation,
    })
    .returning();

  return Response.json({ ...log, result }, { status: 201 });
}
