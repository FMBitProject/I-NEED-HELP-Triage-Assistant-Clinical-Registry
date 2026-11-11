"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  QUEUE_CHANGED_EVENT,
  QueueSummary,
  summarizePendingPatients,
  syncPendingPatients,
} from "@/lib/offline-queue";
import { cn } from "@/lib/utils";

const EMPTY: QueueSummary = { total: 0, needsAttention: 0 };

// Banner global antrean offline: tampil di semua halaman selama masih ada
// pendaftaran pasien milik user ini yang menunggu sinkronisasi, dan mencoba
// mengirim ulang otomatis saat koneksi kembali / aplikasi dibuka lagi.
//
// Harus dirender DI DALAM <AuthProvider>: antrean ada di perangkat (bisa
// dipakai bergantian), jadi yang dikirim hanya entri milik user yang login.
export function OfflineSync() {
  const { doctor } = useAuth();
  const userId = doctor?.id ?? null;
  const pathname = usePathname();

  const [summary, setSummary] = useState<QueueSummary>(EMPTY);
  const [justSynced, setJustSynced] = useState<number | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const syncingRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSummary(EMPTY);
      return;
    }
    try {
      setSummary(await summarizePendingPatients(userId));
    } catch {
      // IndexedDB tidak tersedia (mis. mode privat) — banner tidak tampil.
    }
  }, [userId]);

  const attemptSync = useCallback(async () => {
    if (!userId || syncingRef.current || !navigator.onLine) return;

    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await syncPendingPatients(userId);
      setNeedsLogin(result.needsLogin);
      if (result.synced > 0) {
        setJustSynced(result.synced);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setJustSynced(null), 5000);
      }
    } catch (err) {
      // Coba lagi pada pemicu berikutnya.
      console.warn("[offline-sync] sinkronisasi gagal", err);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      refresh();
    }
  }, [userId, refresh]);

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

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  if (justSynced !== null && summary.total === 0) {
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
  if (summary.total === 0 && isOffline) {
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

  // Di halaman antrean sendiri banner tidak perlu (isinya sudah tampil).
  if (summary.total === 0 || pathname === "/offline-queue") return null;

  // Entri yang butuh tindakan manual dibedakan warnanya supaya tidak tertukar
  // dengan antrean normal yang tinggal menunggu sinyal.
  const attention = summary.needsAttention > 0;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto">
      <div
        className={cn(
          "border rounded-xl shadow-lg p-3 flex items-center gap-3",
          attention ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
        )}
      >
        <span className="text-lg shrink-0">{attention ? "⚠️" : "⏳"}</span>
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-semibold", attention ? "text-red-900" : "text-amber-900")}>
            {summary.total} pasien tersimpan offline
          </p>
          <p className={cn("text-[11px]", attention ? "text-red-700" : "text-amber-700")}>
            {attention
              ? `${summary.needsAttention} perlu dilengkapi/diperiksa sebelum bisa dikirim.`
              : needsLogin
                ? "Sesi berakhir — login ulang agar data terkirim."
                : "Akan terkirim otomatis saat ada koneksi."}
          </p>
        </div>
        {attention ? (
          <Link
            href="/offline-queue"
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-red-800 bg-red-100 hover:bg-red-200"
          >
            Periksa
          </Link>
        ) : (
          !isOffline && (
            <button
              onClick={attemptSync}
              disabled={syncing}
              className="shrink-0 text-xs font-semibold disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors text-amber-800 bg-amber-100 hover:bg-amber-200"
            >
              {syncing ? "Mengirim..." : "Kirim Sekarang"}
            </button>
          )
        )}
      </div>
    </div>
  );
}
