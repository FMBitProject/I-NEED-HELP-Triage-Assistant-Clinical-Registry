import { db } from "@/lib/db";
import { outcomes, patients, triageLogs } from "@/lib/db/schema";
import { requireSession } from "@/lib/api-auth";
import { and, eq, gte, isNull, sql } from "drizzle-orm";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const doctorId = session.user.id;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // All patients for this doctor
  const allPatients = await db
    .select({ id: patients.id, onAceArni: patients.onAceArni, onBb: patients.onBb, onMra: patients.onMra, onSglt2i: patients.onSglt2i, createdAt: patients.createdAt })
    .from(patients)
    .where(eq(patients.doctorId, doctorId));

  const totalPatients = allPatients.length;
  const totalThisMonth = allPatients.filter(
    (p) => new Date(p.createdAt) >= thirtyDaysAgo
  ).length;

  // GDMT compliance: patients on all 4 pillars
  const gdmtCompliantCount = allPatients.filter(
    (p) => p.onAceArni && p.onBb && p.onMra && p.onSglt2i
  ).length;
  const gdmtComplianceRate =
    totalPatients > 0 ? (gdmtCompliantCount / totalPatients) * 100 : 0;

  // Triage logs for referral rate
  const patientIds = allPatients.map((p) => p.id);
  let referralCount = 0;
  let totalTriage = 0;

  if (patientIds.length > 0) {
    const logs = await db
      .select({ recommendationGiven: triageLogs.recommendationGiven })
      .from(triageLogs)
      .where(
        sql`${triageLogs.patientId} = ANY(${sql.raw(`ARRAY['${patientIds.join("','")}']::text[]`)})`
      );
    totalTriage = logs.length;
    referralCount = logs.filter((l) => l.recommendationGiven === "REFER").length;
  }

  const referralRate = totalTriage > 0 ? (referralCount / totalTriage) * 100 : 0;

  // Pending follow-up: patients triaged > 30 days ago with no outcome recorded
  const pendingFollowup = await db
    .select({ count: sql<number>`count(*)` })
    .from(triageLogs)
    .leftJoin(outcomes, eq(outcomes.patientId, triageLogs.patientId))
    .innerJoin(patients, and(eq(patients.id, triageLogs.patientId), eq(patients.doctorId, doctorId)))
    .where(and(gte(triageLogs.createdAt, thirtyDaysAgo), isNull(outcomes.id)));

  return Response.json({
    totalPatients,
    totalThisMonth,
    referralRate: Math.round(referralRate),
    gdmtComplianceRate: Math.round(gdmtComplianceRate),
    pendingFollowup: Number(pendingFollowup[0]?.count ?? 0),
  });
}
