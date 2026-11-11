// Helper kecil untuk Route Handler — dipakai bersama supaya parsing body dan
// IP tidak ditulis ulang (dan berbeda-beda) di setiap route.

/**
 * Baca body sebagai objek JSON. Mengembalikan null bila body bukan JSON yang
 * valid, atau JSON-nya bukan objek (mis. `null`, array, angka) — tanpa ini
 * `body.field` / `field in body` melempar TypeError dan route membalas 500
 * tanpa pesan, yang di antrean offline tercatat sebagai "HTTP 500" misterius.
 */
export async function readJsonObject(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    return body !== null && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export const INVALID_BODY_RESPONSE = () =>
  Response.json({ error: "Body request harus berupa objek JSON yang valid." }, { status: 400 });

/**
 * IP klien untuk jejak akses. Di Vercel, `x-real-ip` diisi oleh platform;
 * `x-forwarded-for` hanya cadangan (entri pertamanya bisa dipalsukan klien
 * di luar Vercel). Dipotong 64 karakter supaya header raksasa tidak masuk DB.
 */
export function getClientIp(req: Request): string | null {
  const raw = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "";
  return raw.trim().slice(0, 64) || null;
}
