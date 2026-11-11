// Mode demo: tombol "Coba sebagai Demo" di halaman login yang langsung masuk
// ke satu akun DOKTER bersama, tanpa password.
//
// Aktif HANYA bila env DEMO_USER_EMAIL dan DEMO_USER_PASSWORD diisi (di
// Vercel). Password tidak pernah dikirim ke browser — login dilakukan server.
//
// Karena berjalan di database produksi, akun demo diisolasi:
//   - pasiennya TIDAK ikut ekspor CSV maupun registry admin
//   - pasien & sesi demo yang lebih tua dari DEMO_RETENTION_HOURS dihapus
//     setiap ada yang login demo
//   - jumlah pasien demo dibatasi DEMO_PATIENT_LIMIT (anti-spam)
//   - tidak bisa ganti password/email, ubah profil, hapus akun, atau mencabut
//     sesi (semua pengunjung berbagi akun yang sama)
//   - menolak bekerja bila email yang dikonfigurasi ternyata akun ADMIN
//
// File ini hanya untuk server (membaca env rahasia & DB).
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { patients, session as sessionTable, user } from "@/lib/db/schema";

export const DEMO_RETENTION_HOURS = 24;
export const DEMO_PATIENT_LIMIT = 30;

export const DEMO_FORBIDDEN_MESSAGE =
  "Fitur ini tidak tersedia di akun demo (akun ini dipakai bersama oleh semua pengunjung).";

export const DEMO_LIMIT_MESSAGE = `Akun demo sudah berisi ${DEMO_PATIENT_LIMIT} pasien. Hapus beberapa pasien demo dulu, atau coba lagi besok (data demo dibersihkan otomatis setiap ${DEMO_RETENTION_HOURS} jam).`;

/** Email akun demo (huruf kecil), atau null bila mode demo tidak aktif. */
export function demoEmail(): string | null {
  const email = process.env.DEMO_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_USER_PASSWORD;
  return email && password ? email : null;
}

export function demoPassword(): string | null {
  return demoEmail() ? (process.env.DEMO_USER_PASSWORD as string) : null;
}

export function isDemoEnabled(): boolean {
  return demoEmail() !== null;
}

/** True bila user ini adalah akun demo yang dikonfigurasi. */
export function isDemoUser(u: { email?: string | null } | null | undefined): boolean {
  const email = demoEmail();
  return !!email && !!u?.email && u.email.trim().toLowerCase() === email;
}

/**
 * Kondisi SQL "baris user ini BUKAN akun demo" — untuk query lintas dokter
 * (ekspor, registry admin). undefined bila mode demo mati (tanpa filter).
 */
export function excludeDemoUser() {
  const email = demoEmail();
  return email ? sql`lower(${user.email}) <> ${email}` : undefined;
}

/**
 * Hapus pasien demo & sesi demo yang sudah melewati masa simpan. Pasien
 * dihapus walau sudah difinalisasi (cascade ke outcome & audit log).
 */
export async function purgeExpiredDemoData(demoUserId: string): Promise<{ patients: number; sessions: number }> {
  const cutoff = new Date(Date.now() - DEMO_RETENTION_HOURS * 60 * 60 * 1000);
  const deletedPatients = await db
    .delete(patients)
    .where(and(eq(patients.doctorId, demoUserId), lt(patients.createdAt, cutoff)))
    .returning({ id: patients.id });
  const deletedSessions = await db
    .delete(sessionTable)
    .where(and(eq(sessionTable.userId, demoUserId), lt(sessionTable.createdAt, cutoff)))
    .returning({ id: sessionTable.id });
  return { patients: deletedPatients.length, sessions: deletedSessions.length };
}

/** Jumlah pasien milik akun demo saat ini. */
export async function countDemoPatients(demoUserId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(patients)
    .where(eq(patients.doctorId, demoUserId));
  return row?.n ?? 0;
}

/** Path endpoint better-auth yang diblokir untuk akun demo. */
export const DEMO_BLOCKED_AUTH_PATHS = [
  "/change-password",
  "/change-email",
  "/update-user",
  "/delete-user",
  "/set-password",
  "/revoke-session",
  "/revoke-sessions",
  "/revoke-other-sessions",
] as const;
