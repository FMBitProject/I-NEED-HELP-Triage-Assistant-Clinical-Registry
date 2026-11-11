"use client";

import { useEffect, useState } from "react";

export interface DemoStatus {
  /** Mode demo dikonfigurasi di server (tombol boleh tampil). */
  enabled: boolean;
  /** Sesi saat ini adalah akun demo bersama. */
  active: boolean;
  retentionHours: number;
  patientLimit: number;
}

const OFF: DemoStatus = { enabled: false, active: false, retentionHours: 24, patientLimit: 30 };

/**
 * Status mode demo dari server. `key` dipakai untuk memuat ulang saat user
 * berganti (mis. id dokter). Gagal memuat = dianggap mati (tombol disembunyikan).
 */
export function useDemoStatus(key?: string | null): DemoStatus {
  const [status, setStatus] = useState<DemoStatus>(OFF);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/demo", { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : OFF))
      .then((s: DemoStatus) => setStatus(s))
      .catch(() => {
        if (!ctrl.signal.aborted) setStatus(OFF);
      });
    return () => ctrl.abort();
  }, [key]);
  return status;
}
