"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  QUEUE_CHANGED_EVENT,
  countPendingTriages,
  syncPendingTriages,
} from "@/lib/offline-queue";

// Banner global antrean offline: tampil di semua halaman selama masih ada
// triase yang menunggu sinkronisasi, dan mencoba mengirim ulang otomatis
// saat koneksi kembali / aplikasi dibuka lagi.
export function OfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [justSynced, setJustSynced] = useState<number | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setPendingCount(await countPendingTriages());
    } catch {
      // IndexedDB tidak tersedia (mis. mode privat) — banner tidak tampil.
    }
  }, []);

  const attemptSync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    if ((await countPendingTriages().catch(() => 0)) === 0) return;

    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await syncPendingTriages();
      setNeedsLogin(result.needsLogin);
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
      refresh();
      attemptSync();
    }, 0);

    const onOnline = () => attemptSync();
    const onQueueChanged = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") attemptSync();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener(QUEUE_CHANGED_EVENT, onQueueChanged);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("online", onOnline);
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
            {justSynced} triase offline berhasil dikirim ke registri.
          </p>
        </div>
      </div>
    );
  }

  if (pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-lg p-3 flex items-center gap-3">
        <span className="text-lg shrink-0">⏳</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-amber-900 font-semibold">
            {pendingCount} triase tersimpan offline
          </p>
          <p className="text-[11px] text-amber-700">
            {needsLogin
              ? "Sesi berakhir — login ulang agar data terkirim."
              : "Akan terkirim otomatis saat ada koneksi."}
          </p>
        </div>
        <button
          onClick={attemptSync}
          disabled={syncing}
          className="shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          {syncing ? "Mengirim..." : "Kirim Sekarang"}
        </button>
      </div>
    </div>
  );
}
