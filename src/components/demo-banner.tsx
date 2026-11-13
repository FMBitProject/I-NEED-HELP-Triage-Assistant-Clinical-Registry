"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useDemoStatus } from "@/hooks/use-demo-status";

// Banner tetap di atas layar selama login sebagai akun demo bersama.
// Karena posisinya fixed, banner tidak memakan ruang di halaman — jadi kita
// tambahkan padding-top di <body> setinggi banner supaya isi halaman (judul,
// tombol, form pasien baru) tidak tertutup. Tingginya diukur langsung karena
// di layar HP teksnya membungkus jadi beberapa baris.
export function DemoBanner() {
  const { doctor } = useAuth();
  const demo = useDemoStatus(doctor?.id ?? null);
  const active = !!doctor && demo.active;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const body = document.body;
    const apply = () => {
      body.style.paddingTop = `${el.offsetHeight}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      body.style.paddingTop = "";
    };
  }, [active]);

  if (!active) return null;
  return (
    <div
      ref={ref}
      role="status"
      className="fixed top-14 inset-x-0 z-40 bg-amber-100 border-b border-amber-300 px-4 py-1.5 text-center text-[11px] leading-snug text-amber-900"
    >
      <strong>Mode demo</strong> — <strong>jangan isi data pasien asli.</strong>
      <span className="hidden sm:inline">
        {" "}Akun ini dipakai bersama semua pengunjung dan isinya bisa dilihat orang lain.
      </span>{" "}
      Data dihapus otomatis setelah {demo.retentionHours} jam dan tidak masuk data riset.
    </div>
  );
}
