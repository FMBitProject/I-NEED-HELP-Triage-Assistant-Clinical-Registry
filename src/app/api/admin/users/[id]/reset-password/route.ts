import { db } from "@/lib/db";
import { account, session as sessionTable } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { generateRandomString, hashPassword } from "better-auth/crypto";
import { eq, and } from "drizzle-orm";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  // Resetting your own account here would delete your own session a moment
  // later, bouncing you to /login before you can read the one-time temp
  // password back. Self-service password change lives in Settings instead.
  if (id === session.user.id) {
    return Response.json(
      { error: "Tidak bisa reset password akun sendiri di sini. Gunakan 'Ubah Password' di Pengaturan." },
      { status: 400 }
    );
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
      { error: "Pengguna tidak ditemukan atau tidak memiliki kredensial email/password" },
      { status: 404 }
    );
  }

  // Force re-login everywhere with the old password.
  await db.delete(sessionTable).where(eq(sessionTable.userId, id));

  return Response.json({ tempPassword });
}
