import { db } from "@/lib/db";
import { outcomes, patients } from "@/lib/db/schema";
import { requireSession } from "@/lib/api-auth";
import { and, eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await params;

  const outcome = await db.query.outcomes.findFirst({
    where: eq(outcomes.id, id),
  });

  if (!outcome) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Verify ownership via patient
  const patient = await db.query.patients.findFirst({
    where: and(
      eq(patients.id, outcome.patientId),
      eq(patients.doctorId, session.user.id)
    ),
  });

  if (!patient) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const [updated] = await db
    .update(outcomes)
    .set({
      status: body.status ?? outcome.status,
      followUpDays: body.followUpDays ?? outcome.followUpDays,
      notes: body.notes ?? outcome.notes,
      admissionDate: "admissionDate" in body ? body.admissionDate : outcome.admissionDate,
      dischargeDate: "dischargeDate" in body ? body.dischargeDate : outcome.dischargeDate,
      notReferredReason: "notReferredReason" in body ? body.notReferredReason : outcome.notReferredReason,
    })
    .where(eq(outcomes.id, id))
    .returning();

  return Response.json(updated);
}
