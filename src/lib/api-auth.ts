import { auth } from "./auth";
import { headers } from "next/headers";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { session: null, error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

// Like requireSession, but also blocks doctors whose account is still
// pending admin approval from touching patient data. ADMINs always pass.
export async function requireApprovedSession() {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };
  if (session!.user.role !== "ADMIN" && !session!.user.approved) {
    return {
      session: null,
      error: Response.json(
        { error: "Akun Anda belum disetujui admin. Hubungi admin untuk persetujuan akses." },
        { status: 403 }
      ),
    };
  }
  return { session: session!, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireSession();
  if (error) return { session: null, error };
  if (session!.user.role !== "ADMIN") {
    return { session: null, error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session: session!, error: null };
}
