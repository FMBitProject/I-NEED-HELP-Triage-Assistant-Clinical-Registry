import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import {
  DEMO_PATIENT_LIMIT,
  DEMO_RETENTION_HOURS,
  demoEmail,
  demoPassword,
  isDemoUser,
  purgeExpiredDemoData,
} from "@/lib/demo";

// GET: apakah mode demo aktif (untuk menampilkan tombol di halaman login) dan
// apakah sesi saat ini adalah akun demo (untuk banner peringatan).
export async function GET() {
  const enabled = demoEmail() !== null;
  let active = false;
  if (enabled) {
    const current = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    active = isDemoUser(current?.user);
  }
  return Response.json({
    enabled,
    active,
    retentionHours: DEMO_RETENTION_HOURS,
    patientLimit: DEMO_PATIENT_LIMIT,
  });
}

const MISCONFIGURED = () =>
  Response.json(
    { error: "Mode demo belum dikonfigurasi dengan benar. Hubungi admin." },
    { status: 503 }
  );

// POST: masuk sebagai akun demo. Password diambil dari env di server — tidak
// pernah dikirim ke/dari browser.
export async function POST() {
  const email = demoEmail();
  const password = demoPassword();
  if (!email || !password) {
    return Response.json({ error: "Mode demo tidak aktif." }, { status: 404 });
  }

  const [demo] = await db
    .select({ id: user.id, role: user.role, approved: user.approved })
    .from(user)
    .where(eq(sql`lower(${user.email})`, email))
    .limit(1);

  if (!demo) {
    console.error("[demo] DEMO_USER_EMAIL tidak cocok dengan akun mana pun");
    return MISCONFIGURED();
  }
  // Pengaman salah konfigurasi: tombol publik TIDAK BOLEH memberi akses admin.
  if (demo.role !== "DOCTOR") {
    console.error("[demo] DEMO_USER_EMAIL menunjuk akun dengan role", demo.role, "— ditolak");
    return MISCONFIGURED();
  }
  if (!demo.approved) {
    console.error("[demo] akun demo belum di-approve admin");
    return MISCONFIGURED();
  }

  // Bersihkan data demo lama. Best-effort: gagal bersih-bersih tidak boleh
  // membuat demo tidak bisa dipakai (data demo tetap dikecualikan dari ekspor).
  try {
    await purgeExpiredDemoData(demo.id);
  } catch (err) {
    console.error("[demo] gagal membersihkan data demo lama", err);
  }

  try {
    const { headers: authHeaders } = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
      returnHeaders: true,
    });
    const res = Response.json({ ok: true });
    for (const cookie of authHeaders.getSetCookie()) res.headers.append("Set-Cookie", cookie);
    return res;
  } catch (err) {
    console.error("[demo] login demo gagal (DEMO_USER_PASSWORD salah?)", err);
    return MISCONFIGURED();
  }
}
