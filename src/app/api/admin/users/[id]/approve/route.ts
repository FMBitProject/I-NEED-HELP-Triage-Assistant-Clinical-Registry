import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { eq } from "drizzle-orm";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const [updated] = await db
    .update(user)
    .set({ approved: true, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning({ id: user.id });

  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
