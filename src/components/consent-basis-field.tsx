"use client";

import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OptionCardGroup } from "@/components/option-card-group";
import { CONSENT_BASIS_OPTIONS } from "@/lib/consent";
import type { ConsentBasis } from "@/lib/types";

/**
 * Pilihan dasar hukum pemrosesan data pasien (UU PDP) — dipakai di form
 * pasien baru, form edit, dan halaman antrean offline.
 */
export function ConsentBasisField({
  value,
  onChange,
  legacyMissing = false,
  bare = false,
}: {
  value: "" | ConsentBasis;
  onChange: (value: "" | ConsentBasis) => void;
  /** Data lama yang didaftarkan sebelum field ini diwajibkan. */
  legacyMissing?: boolean;
  /** Tanpa Card pembungkus (untuk disisipkan di dalam kartu lain). */
  bare?: boolean;
}) {
  const body = (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900">Persetujuan Pasien *</h3>
      </div>
      {legacyMissing ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
          Data ini didaftarkan sebelum pencatatan persetujuan diwajibkan. Pilih dasar
          persetujuan yang sebenarnya. Bila pasien tidak pernah memberi persetujuan dan
          tidak ada waiver komite etik, hapus data pasien ini.
        </p>
      ) : (
        <p className="text-xs text-gray-500 leading-relaxed -mt-1">
          Data kesehatan termasuk data pribadi spesifik (UU PDP). Pasien hanya boleh
          didaftarkan bila sudah memberi persetujuan, atau bila komite etik studi ini
          memberikan waiver informed consent.
        </p>
      )}
      <OptionCardGroup options={CONSENT_BASIS_OPTIONS} value={value} onChange={onChange} />
    </div>
  );

  if (bare) return body;
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">{body}</CardContent>
    </Card>
  );
}
