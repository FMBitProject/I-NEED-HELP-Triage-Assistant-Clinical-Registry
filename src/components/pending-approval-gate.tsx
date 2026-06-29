"use client";

import { usePathname } from "next/navigation";
import { Clock3, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

// Pages a pending (not-yet-approved) doctor can still reach: auth pages,
// legal pages, and settings (so they can still delete their own account).
const ALLOWED_PATHS = ["/login", "/register", "/privacy-policy", "/terms", "/settings"];

export function PendingApprovalGate({ children }: { children: React.ReactNode }) {
  const { doctor, isLoading, logout } = useAuth();
  const pathname = usePathname();

  const isPending = !isLoading && doctor && doctor.role !== "ADMIN" && !doctor.approved;
  const isAllowedPath = ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isPending && !isAllowedPath) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <Clock3 className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Menunggu Persetujuan Admin</h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Akun <strong>{doctor!.name}</strong> sudah terdaftar, tapi belum bisa mengakses
              data pasien sampai disetujui oleh admin registri. Silakan hubungi admin Anda.
            </p>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={logout}>
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
