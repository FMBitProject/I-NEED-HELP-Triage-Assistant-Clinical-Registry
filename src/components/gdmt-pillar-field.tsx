"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { GDMT_OMISSION_REASON_OPTIONS } from "@/lib/gdmt-reasons";
import type { GdmtOmissionReason } from "@/lib/types";
import { cn } from "@/lib/utils";

// Satu pilar GDMT: checkbox "diberikan" + (bila tidak dicentang) chip alasan
// tidak diberikan. Alasan opsional — satu tap memilih, tap lagi membatalkan —
// dan otomatis dikosongkan saat pilar dicentang, jadi tidak menambah langkah
// wajib bagi pengisi. Chip "Lainnya" memunculkan input teks singkat (opsional)
// agar kategori OTHER tetap bisa dianalisis isinya.
export function GdmtPillarField({
  id,
  label,
  hint,
  checked,
  reason,
  reasonOther,
  onCheckedChange,
  onReasonChange,
  onReasonOtherChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  reason: "" | GdmtOmissionReason;
  reasonOther: string;
  onCheckedChange: (v: boolean) => void;
  onReasonChange: (r: "" | GdmtOmissionReason) => void;
  onReasonOtherChange: (text: string) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border-2 transition-all",
        checked
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <label htmlFor={id} className="flex items-center gap-3 p-3 cursor-pointer">
        <Checkbox id={id} checked={checked} onCheckedChange={(v) => onCheckedChange(!!v)} />
        <span className="flex flex-col">
          <span className="text-sm font-medium text-gray-800">{label}</span>
          {hint && <span className="text-xs text-gray-500 mt-0.5">{hint}</span>}
        </span>
      </label>
      {!checked && (
        <div className="px-3 pb-3">
          <p className="text-[11px] text-gray-400 mb-1.5">
            Alasan tidak diberikan{" "}
            <span className="text-gray-300">· opsional, untuk data penelitian</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GDMT_OMISSION_REASON_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.desc}
                onClick={() => onReasonChange(reason === opt.value ? "" : opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all",
                  reason === opt.value
                    ? "border-amber-400 bg-amber-50 text-amber-800"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {reason && reason !== "OTHER" && (
            <p className="text-[11px] text-amber-700 mt-1.5 leading-snug">
              {GDMT_OMISSION_REASON_OPTIONS.find((o) => o.value === reason)?.desc}
            </p>
          )}
          {reason === "OTHER" && (
            <Input
              value={reasonOther}
              onChange={(e) => onReasonOtherChange(e.target.value)}
              placeholder="Sebutkan singkat (opsional)"
              maxLength={120}
              className="mt-1.5 h-8 text-xs"
            />
          )}
        </div>
      )}
    </div>
  );
}
