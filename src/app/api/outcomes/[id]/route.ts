import { db } from "@/lib/db";
import { outcomes, patients } from "@/lib/db/schema";
import { requireApprovedSession } from "@/lib/api-auth";
import { and, eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApprovedSession();
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

  if (patient.finalizedAt) {
    const isAdmin = (session.user as { role?: string }).role === "ADMIN";
    if (!isAdmin) {
      return Response.json(
        { error: "Data sudah difinalisasi. Hubungi developer untuk membuka kunci." },
        { status: 423 }
      );
    }
  }

  const body = await request.json();

  const nextAdmissionDate = "admissionDate" in body ? body.admissionDate : outcome.admissionDate;
  const nextDischargeDate = "dischargeDate" in body ? body.dischargeDate : outcome.dischargeDate;

  if (nextAdmissionDate && nextDischargeDate && nextDischargeDate < nextAdmissionDate) {
    return Response.json(
      { error: "Tanggal keluar tidak boleh sebelum tanggal masuk" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(outcomes)
    .set({
      status: body.status ?? outcome.status,
      followUpDays: body.followUpDays ?? outcome.followUpDays,
      notes: body.notes ?? outcome.notes,
      admissionDate: nextAdmissionDate,
      dischargeDate: nextDischargeDate,
      notReferredReason: "notReferredReason" in body ? body.notReferredReason : outcome.notReferredReason,
    })
    .where(eq(outcomes.id, id))
    .returning();

  return Response.json(updated);
}
