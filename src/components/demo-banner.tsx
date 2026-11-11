"use client";

import { useAuth } from "@/contexts/auth-context";
import { useDemoStatus } from "@/hooks/use-demo-status";

// Banner tetap di atas layar selama login sebagai akun demo bersama.
export function DemoBanner() {
  const { doctor } = useAuth();
  const demo = useDemoStatus(doctor?.id ?? null);
  if (!doctor || !demo.active) return null;
  return (
    <div
      role="status"
      className="fixed top-14 inset-x-0 z-40 bg-amber-100 border-b border-amber-300 px-4 py-1.5 text-center text-[11px] text-amber-900"
    >
      <strong>Mode demo</strong> — akun ini dipakai bersama semua pengunjung dan isinya bisa
      dilihat orang lain. <strong>Jangan isi data pasien asli.</strong> Data demo dihapus
      otomatis setelah {demo.retentionHours} jam dan tidak masuk data riset.
    </div>
  );
}
