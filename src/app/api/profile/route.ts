import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requireSession } from "@/lib/api-auth";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const allowed = ["ethicalClearanceNo", "ethicalClearanceDate"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  for (const field of allowed) {
    if (field in body) updates[field] = body[field] ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(user)
    .set(updates)
    .where(eq(user.id, session.user.id))
    .returning();

  return Response.json(updated);
}
