import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { desc } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const doctors = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      institutionType: user.institutionType,
      role: user.role,
      approved: user.approved,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  return Response.json(doctors);
}
