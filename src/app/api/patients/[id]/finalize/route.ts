import { db } from "@/lib/db";
import { auditLogs, patients } from "@/lib/db/schema";
import { requireApprovedSession } from "@/lib/api-auth";
import { and, eq } from "drizzle-orm";

export async function POST(
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
    return Response.json({ error: "Sudah difinalisasi" }, { status: 400 });
  }

  const now = new Date();

  const [updated] = await db
    .update(patients)
    .set({ finalizedAt: now })
    .where(eq(patients.id, id))
    .returning();

  await db.insert(auditLogs).values({
    patientId: id,
    userId: session.user.id,
    userName: session.user.name,
    action: "finalize",
    createdAt: now,
  });

  return Response.json(updated);
}
