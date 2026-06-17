import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requireSession } from "@/lib/api-auth";
import { eq } from "drizzle-orm";

export async function DELETE() {
  const { session, error } = await requireSession();
  if (error) return error;

  // CASCADE in schema handles: sessions, accounts, patients → triage_logs, outcomes
  await db.delete(user).where(eq(user.id, session.user.id));

  return Response.json({ success: true });
}
