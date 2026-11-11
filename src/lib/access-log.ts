import { db } from "@/lib/db";
import { accessLogs } from "@/lib/db/schema";
import { getClientIp } from "@/lib/request-helpers";

export type AccessAction =
  | "export_csv"
  | "view_registry"
  | "admin_view_patient"
  | "delete_patient";

/**
 * Catat akses massal / lintas dokter / penghapusan ke `access_logs` (UU PDP:
 * akuntabilitas & investigasi kebocoran). Sengaja TIDAK menelan error:
 * pemanggil yang memutuskan apakah aksi harus dibatalkan bila pencatatan gagal.
 */
export async function recordAccess(
  req: Request,
  user: { id: string; name: string },
  action: AccessAction,
  detail: Record<string, unknown>
): Promise<void> {
  await db.insert(accessLogs).values({
    userId: user.id,
    userName: user.name,
    action,
    detail: JSON.stringify(detail),
    ipAddress: getClientIp(req),
  });
}

export const ACCESS_LOG_FAILED_MESSAGE =
  "Aksi dibatalkan: pencatatan akses gagal (database tidak terjangkau?). Coba lagi beberapa saat lagi atau hubungi developer.";
