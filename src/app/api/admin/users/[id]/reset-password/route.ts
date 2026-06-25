import { db } from "@/lib/db";
import { account, session as sessionTable, user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { generateRandomString, hashPassword } from "better-auth/crypto";
import { eq, and } from "drizzle-orm";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const targetUser = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!targetUser) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const tempPassword = generateRandomString(12, "a-z", "A-Z", "0-9");
  const hashed = await hashPassword(tempPassword);

  const updated = await db
    .update(account)
    .set({ password: hashed, updatedAt: new Date() })
    .where(and(eq(account.userId, id), eq(account.providerId, "credential")))
    .returning({ id: account.id });

  if (updated.length === 0) {
    return Response.json(
      { error: "Akun ini tidak memiliki kredensial email/password" },
      { status: 400 }
    );
  }

  // Force re-login everywhere with the old password.
  await db.delete(sessionTable).where(eq(sessionTable.userId, id));

  return Response.json({ tempPassword });
}
