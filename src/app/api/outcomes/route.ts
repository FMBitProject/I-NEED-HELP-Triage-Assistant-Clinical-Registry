import { db } from "@/lib/db";
import { outcomes, patients } from "@/lib/db/schema";
import { requireSession } from "@/lib/api-auth";
import { and, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return Response.json({ error: "patientId required" }, { status: 400 });
  }

  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.id, patientId), eq(patients.doctorId, session.user.id)),
  });

  if (!patient) {
    return Response.json({ error: "Patient not found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(outcomes)
    .where(eq(outcomes.patientId, patientId))
    .orderBy(outcomes.recordedAt);

  return Response.json(rows);
}

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const { patientId, status, followUpDays, notes, admissionDate, dischargeDate, notReferredReason } = body;

  if (admissionDate && dischargeDate && dischargeDate < admissionDate) {
    return Response.json(
      { error: "Tanggal keluar tidak boleh sebelum tanggal masuk" },
      { status: 400 }
    );
  }

  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.id, patientId), eq(patients.doctorId, session.user.id)),
  });

  if (!patient) {
    return Response.json({ error: "Patient not found" }, { status: 404 });
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

  const [outcome] = await db
    .insert(outcomes)
    .values({
      patientId,
      status,
      followUpDays: followUpDays ?? 30,
      notes: notes ?? null,
      admissionDate: admissionDate ?? null,
      dischargeDate: dischargeDate ?? null,
      notReferredReason: notReferredReason ?? null,
    })
    .returning();

  return Response.json(outcome, { status: 201 });
}
