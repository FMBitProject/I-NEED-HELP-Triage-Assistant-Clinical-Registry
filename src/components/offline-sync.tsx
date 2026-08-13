"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  QUEUE_CHANGED_EVENT,
  countPendingPatients,
  syncPendingPatients,
} from "@/lib/offline-queue";
import { cn } from "@/lib/utils";

// Banner global antrean offline: tampil di semua halaman selama masih ada
// pendaftaran pasien yang menunggu sinkronisasi, dan mencoba mengirim ulang
// otomatis saat koneksi kembali / aplikasi dibuka lagi.
export function OfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [justSynced, setJustSynced] = useState<number | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [rejectedError, setRejectedError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const syncingRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setPendingCount(await countPendingPatients());
    } catch {
      // IndexedDB tidak tersedia (mis. mode privat) — banner tidak tampil.
    }
  }, []);

  const attemptSync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    if ((await countPendingPatients().catch(() => 0)) === 0) return;

    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await syncPendingPatients();
      setNeedsLogin(result.needsLogin);
      // Entri yang ditolak server tidak akan pernah terkirim sendiri; tanpa
      // ditampilkan, banner "menunggu sinkronisasi" akan menempel selamanya
      // tanpa dokter tahu penyebabnya.
      setRejectedError(result.rejected > 0 ? result.lastRejectionError : null);
      if (result.synced > 0) {
        setJustSynced(result.synced);
        setTimeout(() => setJustSynced(null), 5000);
      }
    } catch {
      // Coba lagi pada pemicu berikutnya.
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    // Ditunda satu tick agar tidak setState sinkron di dalam effect
    const initial = setTimeout(() => {
      setIsOffline(!navigator.onLine);
      refresh();
      attemptSync();
    }, 0);

    const onOnline = () => {
      setIsOffline(false);
      attemptSync();
    };
    const onOffline = () => setIsOffline(true);
    const onQueueChanged = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") attemptSync();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(QUEUE_CHANGED_EVENT, onQueueChanged);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(QUEUE_CHANGED_EVENT, onQueueChanged);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, attemptSync]);

  if (justSynced !== null && pendingCount === 0) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl shadow-lg p-3 flex items-center gap-2">
          <span className="text-green-600 font-bold">✓</span>
          <p className="text-xs text-green-800 font-medium">
            {justSynced} pasien offline berhasil dikirim ke registri.
          </p>
        </div>
      </div>
    );
  }

  // Offline tanpa antrean: cukup info bahwa data yang tampil salinan terakhir
  if (pendingCount === 0 && isOffline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto">
        <div className="bg-slate-100 border border-slate-200 rounded-xl shadow-lg p-3 flex items-center gap-2">
          <span className="shrink-0">📡</span>
          <p className="text-xs text-slate-600 font-medium">
            Offline — data yang tampil adalah salinan terakhir. Pendaftaran pasien
            baru tetap bisa dibuat.
          </p>
        </div>
      </div>
    );
  }

  if (pendingCount === 0) return null;

  // Entri yang ditolak server butuh tindakan manual — warnanya dibedakan
  // supaya tidak tertukar dengan antrean normal yang tinggal menunggu sinyal.
  const isRejected = !!rejectedError;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto">
      <div
        className={cn(
          "border rounded-xl shadow-lg p-3 flex items-center gap-3",
          isRejected ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
        )}
      >
        <span className="text-lg shrink-0">{isRejected ? "⚠️" : "⏳"}</span>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-xs font-semibold",
              isRejected ? "text-red-900" : "text-amber-900"
            )}
          >
            {pendingCount} pasien tersimpan offline
          </p>
          <p className={cn("text-[11px]", isRejected ? "text-red-700" : "text-amber-700")}>
            {isRejected
              ? `Ditolak server: ${rejectedError} — data masih tersimpan, catat ulang manual atau hubungi developer.`
              : needsLogin
                ? "Sesi berakhir — login ulang agar data terkirim."
                : "Akan terkirim otomatis saat ada koneksi."}
          </p>
        </div>
        {!isOffline && (
          <button
            onClick={attemptSync}
            disabled={syncing}
            className={cn(
              "shrink-0 text-xs font-semibold disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors",
              isRejected
                ? "text-red-800 bg-red-100 hover:bg-red-200"
                : "text-amber-800 bg-amber-100 hover:bg-amber-200"
            )}
          >
            {syncing ? "Mengirim..." : "Kirim Sekarang"}
          </button>
        )}
      </div>
    </div>
  );
}
