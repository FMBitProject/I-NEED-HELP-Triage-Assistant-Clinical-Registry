import { db } from "@/lib/db";
import { patients } from "@/lib/db/schema";
import { requireSession } from "@/lib/api-auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const rows = await db
    .select()
    .from(patients)
    .where(eq(patients.doctorId, session.user.id))
    .orderBy(patients.createdAt);

  return Response.json(rows);
}

export async function POST(request: Request) {
  const { session, error } = await requireSession();
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
    })
    .returning();

  return Response.json(patient, { status: 201 });
}
