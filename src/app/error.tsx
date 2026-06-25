"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
    fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Terjadi Kesalahan</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Ada masalah teknis saat memuat halaman ini. Tim kami sudah otomatis menerima
            laporan error ini.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button className="w-full gap-2" onClick={() => unstable_retry()}>
            <RotateCcw className="w-4 h-4" />
            Coba Lagi
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => (window.location.href = "/dashboard")}>
            <Home className="w-4 h-4" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
