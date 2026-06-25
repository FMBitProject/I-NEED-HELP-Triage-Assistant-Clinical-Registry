import { db } from "@/lib/db";
import { outcomes, patients, triageLogs } from "@/lib/db/schema";
import { requireApprovedSession } from "@/lib/api-auth";
import { desc, eq, inArray } from "drizzle-orm";

export async function GET() {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const patientsList = await db
    .select()
    .from(patients)
    .where(eq(patients.doctorId, session.user.id))
    .orderBy(desc(patients.createdAt));

  if (patientsList.length === 0) return Response.json([]);

  const patientIds = patientsList.map((p) => p.id);

  const [allLogs, allOutcomes] = await Promise.all([
    db.select().from(triageLogs).where(inArray(triageLogs.patientId, patientIds)),
    db.select().from(outcomes).where(inArray(outcomes.patientId, patientIds)),
  ]);

  const enriched = patientsList.map((p) => ({
    ...p,
    egfr: p.egfr != null ? parseFloat(p.egfr) : null,
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

export async function POST(request: Request) {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const body = await request.json();

  const [patient] = await db
    .insert(patients)
    .values({
      doctorId: session.user.id,
      patientInitial: body.patientInitial,
      age: body.age,
      gender: body.gender,
      systolicBp: body.systolicBp,
      diastolicBp: body.diastolicBp,
      heartRate: body.heartRate,
      lvef: body.lvef ?? null,
      egfr: body.egfr ?? null,
      ntProbnp: body.ntProbnp ?? null,
      comorbidDm: body.comorbidDm ?? false,
      comorbidHtn: body.comorbidHtn ?? false,
      comorbidCkd: body.comorbidCkd ?? false,
      comorbidAf: body.comorbidAf ?? false,
      onAceArni: body.onAceArni ?? false,
      onBb: body.onBb ?? false,
      onMra: body.onMra ?? false,
      onSglt2i: body.onSglt2i ?? false,
      nyhaClass: body.nyhaClass ?? null,
    })
    .returning();

  return Response.json({ ...patient, egfr: patient.egfr != null ? parseFloat(patient.egfr) : null }, { status: 201 });
}
