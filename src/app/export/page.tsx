"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Database,
  Users,
  FileSpreadsheet,
  Shield,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { countGdmt } from "@/lib/triage";

async function downloadFromAPI(filename: string) {
  const res = await fetch("/api/export");
  if (!res.ok) throw new Error("Export gagal");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, referrals: 0, withOutcome: 0, fullGdmt: 0 });

  useEffect(() => {
    if (!isLoading && !doctor) router.replace("/login");
    if (!isLoading && doctor && doctor.role !== "ADMIN") router.replace("/dashboard");
  }, [doctor, isLoading, router]);

  useEffect(() => {
    if (doctor?.role === "ADMIN") {
      // Ringkasan harus mencakup seluruh registri (semua dokter), sama seperti
      // isi CSV-nya — bukan hanya pasien milik akun admin sendiri.
      fetch("/api/admin/registry")
        .then((r) => r.ok ? r.json() : [])
        .then((patients) => {
          setStats({
            total: patients.length,
            referrals: patients.filter((p: { triage?: { recommendationGiven: string } }) => p.triage?.recommendationGiven === "REFER").length,
            withOutcome: patients.filter((p: { outcome?: unknown }) => !!p.outcome).length,
            fullGdmt: patients.filter((p: Parameters<typeof countGdmt>[0]) => countGdmt(p) === 4).length,
          });
        });
    }
  }, [doctor]);

  if (isLoading || !doctor) return null;

  const exportAll = async () => {
    setExporting("all");
    try {
      await downloadFromAPI(`registry_export_${new Date().toISOString().slice(0, 10)}.csv`);
      setDone("all");
      setTimeout(() => setDone(null), 3000);
    } catch {
      // silent
    }
    setExporting(null);
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <Database className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">Export Data Riset</h1>
                <Badge variant="secondary">Admin Only</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Unduh data registri dalam format CSV siap analisis (SPSS/Stata/R)
              </p>
            </div>
          </div>

          {/* Ethics notice */}
          <Card className="border-blue-200 ring-1 ring-blue-100 border-0 shadow-sm bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-800 space-y-1">
                  <p className="font-semibold">Pernyataan Etik Penelitian &amp; Kepatuhan Regulasi</p>
                  <p>
                    Data yang diekspor telah dianonimisasi (pseudoanonim). Tidak ada identitas
                    langsung pasien (nama lengkap, NIK, alamat) yang tersimpan. Penggunaan data
                    harus sesuai protokol etik komite etik penelitian terkait (ICH E6(R3) GCP),
                    UU PDP No. 27/2022, Permenkes No. 24/2022, dan Permenkominfo No. 5/2020.
                    Peneliti bertanggung jawab atas kepatuhan terhadap regulasi tersebut dalam
                    setiap publikasi atau diseminasi hasil penelitian.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registry Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                Ringkasan Database Registri
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Pasien", value: stats.total, icon: Users },
                  { label: "Kasus Rujukan", value: stats.referrals, icon: AlertTriangle },
                  { label: "Ada Outcome", value: stats.withOutcome, icon: CheckCircle },
                  { label: "GDMT Lengkap", value: stats.fullGdmt, icon: CheckCircle },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dataset description */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                  <FileSpreadsheet className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    Dataset Registri Lengkap (Long Format)
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Satu baris per event triase: baseline pasien (TTV, komorbiditas, lab,
                    GDMT beserta alasan pilar yang tidak diberikan), 9 kriteria
                    I-NEED-HELP sebagai kolom terpisah (crit_I … crit_P), rekomendasi,
                    dan outcome 30-hari terakhir.
                  </p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-xs text-blue-600 font-medium">
                      {stats.total} pasien
                    </span>
                    <span className="text-xs text-gray-400">50 kolom</span>
                    <span className="text-xs text-gray-400">.csv</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export All */}
          <Button
            size="xl"
            className="w-full gap-2"
            onClick={exportAll}
            disabled={!!exporting || stats.total === 0}
          >
            {exporting === "all" ? (
              "Mengekspor database..."
            ) : done === "all" ? (
              <>
                <CheckCircle className="w-5 h-5" />
                File Berhasil Diunduh!
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Unduh Seluruh Database (.csv)
              </>
            )}
          </Button>

          {stats.total === 0 && (
            <p className="text-center text-xs text-gray-400">
              Belum ada data pasien yang dapat diekspor.
            </p>
          )}

          <div className="bg-gray-100 rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
            <p className="font-semibold text-gray-700">Panduan Analisis Data:</p>
            <p>• File CSV dapat dibuka langsung di Microsoft Excel atau Google Sheets</p>
            <p>• Untuk SPSS: Import → CSV, set delimiter koma, encoding UTF-8</p>
            <p>• Untuk R: <code className="bg-gray-200 px-1 rounded">read.csv(&quot;file.csv&quot;, encoding=&quot;UTF-8&quot;)</code></p>
            <p>• Untuk Stata: <code className="bg-gray-200 px-1 rounded">import delimited using &quot;file.csv&quot;</code></p>
            <p>• Variabel boolean (0/1) siap digunakan sebagai dummy variable</p>
          </div>
        </div>
      </main>
    </div>
  );
}
