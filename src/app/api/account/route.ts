import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requireSession } from "@/lib/api-auth";
import { eq } from "drizzle-orm";
import { DEMO_FORBIDDEN_MESSAGE, isDemoUser } from "@/lib/demo";

export async function DELETE() {
  const { session, error } = await requireSession();
  if (error) return error;

  // Akun demo dipakai bersama — satu pengunjung tidak boleh menghapusnya.
  if (isDemoUser(session.user)) {
    return Response.json({ error: DEMO_FORBIDDEN_MESSAGE }, { status: 403 });
  }

  // CASCADE in schema handles: sessions, accounts, patients → outcomes, audit_logs
  await db.delete(user).where(eq(user.id, session.user.id));

  return Response.json({ success: true });
}
