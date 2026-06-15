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
import { store } from "@/lib/store";
import { countGdmt } from "@/lib/triage";

function toCSV(rows: Record<string, string | number | boolean | undefined | null>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
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

  useEffect(() => {
    if (!isLoading && !doctor) router.replace("/login");
    if (!isLoading && doctor && doctor.role !== "ADMIN") router.replace("/dashboard");
  }, [doctor, isLoading, router]);

  if (isLoading || !doctor) return null;

  const patients = store.getPatients();
  const logs = store.getTriageLogs();
  const outcomes = store.getOutcomes();

  const stats = {
    total: patients.length,
    referrals: logs.filter((l) => l.recommendationGiven === "REFER").length,
    withOutcome: outcomes.length,
    fullGdmt: patients.filter((p) => countGdmt(p) === 4).length,
  };

  const exportPatients = async () => {
    setExporting("patients");
    await new Promise((r) => setTimeout(r, 600));

    const rows = patients.map((p) => ({
      id: p.id,
      doctor_id: p.doctorId,
      patient_initial: p.patientInitial,
      age: p.age,
      gender: p.gender,
      systolic_bp: p.systolicBp,
      diastolic_bp: p.diastolicBp,
      heart_rate: p.heartRate,
      lvef: p.lvef ?? "",
      egfr: p.egfr ?? "",
      nt_probnp: p.ntProbnp ?? "",
      comorbid_dm: p.comorbidDm ? 1 : 0,
      comorbid_htn: p.comorbidHtn ? 1 : 0,
      comorbid_ckd: p.comorbidCkd ? 1 : 0,
      comorbid_af: p.comorbidAf ? 1 : 0,
      on_ace_arni: p.onAceArni ? 1 : 0,
      on_bb: p.onBb ? 1 : 0,
      on_mra: p.onMra ? 1 : 0,
      on_sglt2i: p.onSglt2i ? 1 : 0,
      gdmt_count: countGdmt(p),
      created_at: p.createdAt,
    }));

    downloadCSV(toCSV(rows), `inh_patients_${new Date().toISOString().slice(0, 10)}.csv`);
    setExporting(null);
    setDone("patients");
    setTimeout(() => setDone(null), 3000);
  };

  const exportTriage = async () => {
    setExporting("triage");
    await new Promise((r) => setTimeout(r, 600));

    const rows = logs.map((l) => ({
      id: l.id,
      patient_id: l.patientId,
      score: l.score,
      recommendation: l.recommendationGiven,
      criteria_I: l.criteriaMet.I ? 1 : 0,
      criteria_N: l.criteriaMet.N ? 1 : 0,
      criteria_E1: l.criteriaMet.E1 ? 1 : 0,
      criteria_E2: l.criteriaMet.E2 ? 1 : 0,
      criteria_D: l.criteriaMet.D ? 1 : 0,
      criteria_H: l.criteriaMet.H ? 1 : 0,
      criteria_E3: l.criteriaMet.E3 ? 1 : 0,
      criteria_L: l.criteriaMet.L ? 1 : 0,
      criteria_P: l.criteriaMet.P ? 1 : 0,
      created_at: l.createdAt,
    }));

    downloadCSV(toCSV(rows), `inh_triage_${new Date().toISOString().slice(0, 10)}.csv`);
    setExporting(null);
    setDone("triage");
    setTimeout(() => setDone(null), 3000);
  };

  const exportOutcomes = async () => {
    setExporting("outcomes");
    await new Promise((r) => setTimeout(r, 600));

    const rows = outcomes.map((o) => ({
      id: o.id,
      patient_id: o.patientId,
      status: o.status,
      follow_up_days: o.followUpDays,
      recorded_at: o.recordedAt,
      notes: o.notes ?? "",
    }));

    downloadCSV(toCSV(rows), `inh_outcomes_${new Date().toISOString().slice(0, 10)}.csv`);
    setExporting(null);
    setDone("outcomes");
    setTimeout(() => setDone(null), 3000);
  };

  const exportAll = async () => {
    setExporting("all");
    await exportPatients();
    await exportTriage();
    await exportOutcomes();
    setExporting(null);
    setDone("all");
    setTimeout(() => setDone(null), 3000);
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
                  <p className="font-semibold">Pernyataan Etik Penelitian</p>
                  <p>
                    Data yang diekspor telah dianonimisasi. Tidak ada informasi identitas langsung
                    pasien (nama, NIK, alamat) yang tersimpan. Penggunaan data harus sesuai
                    protokol etik yang telah disetujui komite etik penelitian terkait.
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

          {/* Export Options */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Pilih Dataset untuk Diunduh:</p>

            {[
              {
                key: "patients",
                title: "Data Baseline Pasien",
                desc: "Inisial, usia, gender, TTV, komorbiditas, lab, status GDMT",
                rows: patients.length,
                columns: 20,
                handler: exportPatients,
                icon: Users,
              },
              {
                key: "triage",
                title: "Data Skor Triase",
                desc: "Skor I-NEED-HELP, kriteria terpenuhi, rekomendasi",
                rows: logs.length,
                columns: 15,
                handler: exportTriage,
                icon: BarChart3,
              },
              {
                key: "outcomes",
                title: "Data Clinical Outcomes",
                desc: "Status 30-hari, hari follow-up, catatan klinis",
                rows: outcomes.length,
                columns: 6,
                handler: exportOutcomes,
                icon: CheckCircle,
              },
            ].map((item) => (
              <Card key={item.key} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                      <item.icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      <div className="flex gap-3 mt-1.5">
                        <span className="text-xs text-blue-600 font-medium">{item.rows} baris</span>
                        <span className="text-xs text-gray-400">{item.columns} kolom</span>
                        <span className="text-xs text-gray-400">.csv</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={item.handler}
                      disabled={!!exporting}
                      className="shrink-0 gap-1.5"
                    >
                      {exporting === item.key ? (
                        "Memproses..."
                      ) : done === item.key ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          Selesai
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Unduh
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Export All */}
          <Button
            size="xl"
            className="w-full gap-2"
            onClick={exportAll}
            disabled={!!exporting || patients.length === 0}
          >
            {exporting === "all" ? (
              "Mengekspor semua dataset..."
            ) : done === "all" ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Semua File Berhasil Diunduh!
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5" />
                Unduh Semua Dataset Sekaligus
              </>
            )}
          </Button>

          {patients.length === 0 && (
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
