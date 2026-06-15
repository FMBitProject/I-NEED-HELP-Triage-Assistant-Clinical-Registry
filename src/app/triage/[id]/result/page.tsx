"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Home,
  Printer,
  ClipboardList,
  Pill,
  HeartPulse,
  Activity,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/store";
import { Patient, TriageLog } from "@/lib/types";
import { TRIAGE_CRITERIA_LABELS } from "@/lib/triage";
import { countGdmt } from "@/lib/triage";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

const REFER_RECOMMENDATIONS = [
  {
    icon: "🚑",
    title: "Rujuk Segera ke Faskes Sekunder/Tersier",
    desc: "Siapkan surat rujukan BPJS dengan diagnosis Gagal Jantung Kronis Dekompensasi (GKJD). Cantumkan skor I-NEED-HELP dan kriteria yang terpenuhi.",
  },
  {
    icon: "💊",
    title: "Optimalisasi Terapi Sementara",
    desc: "Pertimbangkan pemberian diuretik intravena (Furosemide 40-80mg IV) jika ada tanda kongesti sebelum rujukan.",
  },
  {
    icon: "📋",
    title: "Edukasi Pasien & Keluarga",
    desc: "Jelaskan kepada pasien dan keluarga tentang perlunya evaluasi lanjutan oleh spesialis jantung (SpJP).",
  },
  {
    icon: "📞",
    title: "Kontak Faskes Tujuan",
    desc: "Hubungi RS rujukan untuk konfirmasi ketersediaan tempat dan tindakan yang diperlukan (ekokardiografi, kateterisasi jantung).",
  },
];

const CONTINUE_RECOMMENDATIONS = [
  {
    icon: "✅",
    title: "Lanjutkan & Optimalkan GDMT",
    desc: "Pastikan pasien menerima 4 pilar GDMT: ACE-I/ARB/ARNI + Beta-Blocker + MRA + SGLT2i, sesuai toleransi dan fungsi ginjal.",
  },
  {
    icon: "📅",
    title: "Jadwalkan Follow-up Rutin",
    desc: "Kontrol kembali dalam 2-4 minggu untuk evaluasi toleransi obat, tanda kongesti, dan profil ginjal.",
  },
  {
    icon: "⚖️",
    title: "Monitor Berat Badan Harian",
    desc: "Edukasi pasien untuk timbang berat badan setiap pagi. Kenaikan >2kg dalam 2 hari adalah tanda peringatan.",
  },
  {
    icon: "🧂",
    title: "Restriksi Garam & Cairan",
    desc: "Anjurkan restriksi sodium <2g/hari dan cairan <1.5L/hari untuk pasien dengan riwayat kongesti.",
  },
];

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [triageLog, setTriageLog] = useState<TriageLog | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (!isLoading && !doctor) router.replace("/login");
  }, [doctor, isLoading, router]);

  useEffect(() => {
    if (!id) return;
    const log = store.getTriageLog(id);
    if (!log) {
      router.replace("/dashboard");
      return;
    }
    setTriageLog(log);
    const p = store.getPatient(log.patientId);
    setPatient(p || null);
  }, [id, router]);

  if (isLoading || !doctor || !triageLog || !patient) return null;

  const isRefer = triageLog.recommendationGiven === "REFER";
  const metKeys = (Object.entries(triageLog.criteriaMet) as [keyof typeof TRIAGE_CRITERIA_LABELS, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k);
  const gdmtCount = countGdmt(patient);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          {/* Result Banner */}
          <Card
            className={cn(
              "border-0 shadow-lg overflow-hidden",
              isRefer ? "ring-2 ring-red-400" : "ring-2 ring-green-400"
            )}
          >
            <div
              className={cn(
                "p-6 text-center",
                isRefer
                  ? "bg-gradient-to-br from-red-500 to-red-700"
                  : "bg-gradient-to-br from-green-500 to-green-700"
              )}
            >
              <div className="flex justify-center mb-3">
                {isRefer ? (
                  <AlertTriangle className="w-12 h-12 text-white" />
                ) : (
                  <CheckCircle className="w-12 h-12 text-white" />
                )}
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Rekomendasi Klinis</p>
              <h1 className="text-2xl font-black text-white mb-2">
                {isRefer ? "RUJUK KE FASKES LANJUT" : "LANJUTKAN GDMT"}
              </h1>
              <p className="text-white/90 text-sm max-w-xs mx-auto">
                {isRefer
                  ? "Pasien menunjukkan tanda perburukan gagal jantung. Evaluasi spesialis diperlukan."
                  : "Kondisi pasien stabil. Optimalkan terapi medikamentosa sesuai panduan PERKI."}
              </p>
            </div>

            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Skor I-NEED-HELP</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900">{triageLog.score}</span>
                    <span className="text-sm text-gray-400">/ 9</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Pasien</p>
                  <p className="text-lg font-bold text-gray-900">{patient.patientInitial}</p>
                  <p className="text-xs text-gray-400">
                    {patient.age}th • {patient.gender === "M" ? "Laki-laki" : "Perempuan"}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                    <span>TD: {patient.systolicBp}/{patient.diastolicBp} mmHg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    <span>HR: {patient.heartRate} bpm</span>
                  </div>
                  {patient.lvef && (
                    <div className="flex items-center gap-1">
                      <span>EF: {patient.lvef}%</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Criteria Met */}
          {metKeys.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Kriteria Perburukan yang Terpenuhi ({metKeys.length})
                </p>
                <div className="space-y-2">
                  {metKeys.map((k) => {
                    const info = TRIAGE_CRITERIA_LABELS[k];
                    return (
                      <div key={k} className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black shrink-0 mt-0.5">
                          {info.key}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-red-800">{info.label}</p>
                          <p className="text-xs text-red-600 mt-0.5">{info.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* GDMT Status */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4 text-green-600" />
                Status GDMT Pasien ({gdmtCount}/4)
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "ACE-I/ARB/ARNI", active: patient.onAceArni },
                  { label: "Beta-Blocker", active: patient.onBb },
                  { label: "MRA", active: patient.onMra },
                  { label: "SGLT2i", active: patient.onSglt2i },
                ].map((d) => (
                  <div
                    key={d.label}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-xs font-medium",
                      d.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    <span>{d.active ? "✓" : "✗"}</span>
                    {d.label}
                  </div>
                ))}
              </div>
              {gdmtCount < 4 && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mt-2">
                  Pasien belum mendapat GDMT lengkap. Pertimbangkan penambahan{" "}
                  {!patient.onAceArni && "ACE-I/ARB, "}
                  {!patient.onBb && "Beta-Blocker, "}
                  {!patient.onMra && "MRA, "}
                  {!patient.onSglt2i && "SGLT2i"} jika tidak ada kontraindikasi.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                Anjuran Klinis (Berdasarkan Panduan PERKI)
              </p>
              <div className="space-y-2.5">
                {(isRefer ? REFER_RECOMMENDATIONS : CONTINUE_RECOMMENDATIONS).map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-lg">{r.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{r.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/patients/${patient.id}/followup`}>
              <Button variant="outline" size="lg" className="w-full">
                Set Follow-up
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/triage/new">
              <Button size="lg" className="w-full">
                Triase Baru
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <Link href="/dashboard">
            <Button variant="ghost" className="w-full gap-2 text-gray-500">
              <Home className="w-4 h-4" />
              Kembali ke Dashboard
            </Button>
          </Link>

          <div className="text-center">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Rekomendasi ini dibuat berdasarkan kriteria I-NEED-HELP sesuai Panduan Tata Laksana
              Gagal Jantung PERKI 2020/2023. Keputusan klinis final tetap berada pada dokter yang
              memeriksa pasien.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
