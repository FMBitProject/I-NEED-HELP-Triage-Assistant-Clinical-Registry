"use client";

import { useEffect } from "react";

// Catches errors that happen in the root layout itself (outside any
// route segment's error.tsx). Must render its own <html>/<body> since it
// replaces the root layout when active.
export default function GlobalError({
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
    <html lang="id">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center px-4 antialiased">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm p-6 text-center space-y-4">
          <h1 className="text-lg font-bold text-gray-900">Aplikasi Mengalami Masalah</h1>
          <p className="text-sm text-gray-500">
            Terjadi kesalahan fatal. Laporan sudah otomatis terkirim. Coba muat ulang halaman.
          </p>
          <button
            onClick={() => unstable_retry()}
            className="w-full bg-blue-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-800"
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
