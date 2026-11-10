"use client";

import { cn } from "@/lib/utils";

export interface OptionCard<T extends string> {
  value: T;
  label: string;
  icon: string;
  desc: string;
}

/**
 * Grid kartu pilihan tunggal (ikon + label + deskripsi) — dipakai untuk
 * Lokasi Perawatan dan Disposisi Akhir di form pasien baru & edit.
 * Klik kartu yang sudah terpilih = batal pilih (nilai jadi "").
 */
export function OptionCardGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: OptionCard<T>[];
  value: "" | T;
  onChange: (value: "" | T) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            // Status terpilih juga terbaca screen reader, bukan hanya lewat warna.
            aria-pressed={active}
            onClick={() => onChange(active ? "" : opt.value)}
            className={cn(
              "flex items-start gap-2 p-3 rounded-lg border-2 text-left transition-all",
              active
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <span className="text-base" aria-hidden="true">
              {opt.icon}
            </span>
            <span className="flex flex-col">
              <span
                className={cn("text-xs font-medium", active ? "text-blue-800" : "text-gray-700")}
              >
                {opt.label}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-snug mt-0.5",
                  active ? "text-blue-600" : "text-gray-400"
                )}
              >
                {opt.desc}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
