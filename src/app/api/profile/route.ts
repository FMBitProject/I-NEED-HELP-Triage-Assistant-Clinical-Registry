import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requireSession } from "@/lib/api-auth";
import { eq } from "drizzle-orm";
import { INVALID_DOCTOR_TYPE_MESSAGE, isValidDoctorType } from "@/lib/doctor-type";
import { DEMO_FORBIDDEN_MESSAGE, isDemoUser } from "@/lib/demo";

export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  if (isDemoUser(session.user)) {
    return Response.json({ error: DEMO_FORBIDDEN_MESSAGE }, { status: 403 });
  }

  const body = await request.json();
  const allowed = ["ethicalClearanceNo", "ethicalClearanceDate"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  for (const field of allowed) {
    if (field in body) updates[field] = body[field] ?? null;
  }

  // Jenis dokter: jalur akun lama (dibuat sebelum field ini ada) untuk
  // melengkapi provenansnya. Harus nilai valid — tidak boleh dikosongkan.
  // Rute ini menulis langsung lewat Drizzle (tidak lewat databaseHooks
  // better-auth), jadi validasinya diulang di sini.
  if ("doctorType" in body) {
    if (!isValidDoctorType(body.doctorType)) {
      return Response.json({ error: INVALID_DOCTOR_TYPE_MESSAGE }, { status: 400 });
    }
    updates.doctorType = body.doctorType;
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
