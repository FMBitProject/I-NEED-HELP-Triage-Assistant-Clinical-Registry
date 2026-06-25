import { db } from "@/lib/db";
import { auditLogs, patients, triageLogs, outcomes } from "@/lib/db/schema";
import { requireApprovedSession } from "@/lib/api-auth";
import { and, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApprovedSession();
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const { id } = await params;

  const existing = await db.query.patients.findFirst({
    where: and(eq(patients.id, id), eq(patients.doctorId, session.user.id)),
  });

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.finalizedAt) {
    const isAdmin = (session.user as { role?: string }).role === "ADMIN";
    if (!isAdmin) {
      return Response.json(
        { error: "Data sudah difinalisasi. Hubungi developer untuk membuka kunci." },
        { status: 423 }
      );
    }
  }

  const body = await req.json();
  const allowedFields = [
    "patientInitial", "age", "gender", "systolicBp", "diastolicBp",
    "heartRate", "lvef", "egfr", "ntProbnp", "comorbidDm", "comorbidHtn",
    "comorbidCkd", "comorbidAf", "onAceArni", "onBb", "onMra", "onSglt2i",
    "nyhaClass",
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(patients)
    .set(updates)
    .where(eq(patients.id, id))
    .returning();

  // Log each changed field to audit trail
  const auditEntries = Object.entries(updates)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(([field, newVal]) => String((existing as any)[field] ?? "") !== String(newVal ?? ""))
    .map(([field, newVal]) => ({
      patientId: id,
      userId: session.user.id,
      userName: session.user.name,
      action: "update",
      changedField: field,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oldValue: String((existing as any)[field] ?? ""),
      newValue: String(newVal ?? ""),
    }));

  if (auditEntries.length > 0) {
    await db.insert(auditLogs).values(auditEntries);
  }

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const { id } = await params;

  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.id, id), eq(patients.doctorId, session.user.id)),
  });

  if (!patient) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (patient.finalizedAt) {
    const isAdmin = (session.user as { role?: string }).role === "ADMIN";
    if (!isAdmin) {
      return Response.json(
        { error: "Data sudah difinalisasi dan tidak dapat dihapus. Hubungi developer." },
        { status: 423 }
      );
    }
  }

  await db.delete(patients).where(eq(patients.id, id));

  return Response.json({ success: true });
}
