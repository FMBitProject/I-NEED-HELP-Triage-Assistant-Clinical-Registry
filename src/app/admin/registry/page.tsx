"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Stethoscope,
  TrendingUp,
  CheckCircle,
  Clock,
  Database,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatientWithDetails } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface RegistryPatient extends PatientWithDetails {
  doctorName: string;
  doctorEmail: string;
  doctorInstitution: string | null;
}

function getDaysAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

export default function AdminRegistryPage() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<RegistryPatient[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (!isLoading && !doctor) router.replace("/login");
    if (!isLoading && doctor && doctor.role !== "ADMIN") router.replace("/dashboard");
  }, [doctor, isLoading, router]);

  useEffect(() => {
    if (doctor?.role !== "ADMIN") return;
    fetch("/api/admin/registry")
      .then((r) => (r.ok ? r.json() : []))
      .then(setPatients)
      .finally(() => setLoadingList(false));
  }, [doctor]);

  if (isLoading || !doctor || doctor.role !== "ADMIN") return null;

  const totalPatients = patients.length;

  const logs = patients.map((p) => p.triage).filter(Boolean);
  const referrals = logs.filter((l) => l!.recommendationGiven === "REFER").length;
  const referralRate = logs.length > 0 ? Math.round((referrals / logs.length) * 100) : 0;

  const withOutcome = patients.filter((p) => p.outcome).length;

  // Rekap per dokter
  const byDoctor = new Map<
    string,
    { name: string; institution: string | null; total: number; referred: number; withOutcome: number; lastEntry: string }
  >();
  for (const p of patients) {
    const entry = byDoctor.get(p.doctorId) ?? {
      name: p.doctorName,
      institution: p.doctorInstitution,
      total: 0,
      referred: 0,
      withOutcome: 0,
      lastEntry: p.createdAt,
    };
    entry.total += 1;
    if (p.triage?.recommendationGiven === "REFER") entry.referred += 1;
    if (p.outcome) entry.withOutcome += 1;
    if (new Date(p.createdAt) > new Date(entry.lastEntry)) entry.lastEntry = p.createdAt;
    byDoctor.set(p.doctorId, entry);
  }
  const doctorRows = [...byDoctor.values()].sort((a, b) => b.total - a.total);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString("id-ID", { month: "short" });
    const count = patients.filter((p) => {
      const pd = new Date(p.createdAt);
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
    }).length;
    return { bulan: label, pasien: count };
  });

  const stats = [
    {
      label: "Total Pasien (Semua Dokter)",
      value: totalPatients,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Dokter Aktif Mengisi",
      value: doctorRows.length,
      icon: Stethoscope,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Tingkat Rujukan",
      value: `${referralRate}%`,
      icon: TrendingUp,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Outcome Terisi",
      value: `${withOutcome}/${totalPatients}`,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <Database className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">Registry Semua Dokter</h1>
                <Badge variant="secondary">Admin Only</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Rekap seluruh data triase dari semua dokter yang mengisi registri.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => (
              <Card key={s.label} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500">{s.label}</p>
                    <div className={`p-1.5 rounded-lg ${s.bg}`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly enrollment across all doctors */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tren Pendaftaran Semua Dokter (6 Bulan Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="bulan" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(v) => [`${v} pasien`, "Pendaftaran"]} />
                  <Bar dataKey="pasien" radius={[4, 4, 0, 0]} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Per-doctor breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rekap per Dokter</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingList ? (
                <p className="text-sm text-gray-400 px-5 py-4">Memuat data...</p>
              ) : doctorRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Activity className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">Belum ada dokter yang mengisi data pasien</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                        <th className="px-5 py-2.5 font-medium">Dokter</th>
                        <th className="px-3 py-2.5 font-medium text-center">Pasien</th>
                        <th className="px-3 py-2.5 font-medium text-center">Dirujuk</th>
                        <th className="px-3 py-2.5 font-medium text-center">Outcome</th>
                        <th className="px-5 py-2.5 font-medium text-right">Input Terakhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {doctorRows.map((d) => (
                        <tr key={d.name} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-gray-900">{d.name}</p>
                            <p className="text-xs text-gray-400">{d.institution || "—"}</p>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-gray-900">{d.total}</td>
                          <td className="px-3 py-3 text-center text-gray-700">{d.referred}</td>
                          <td className="px-3 py-3 text-center text-gray-700">
                            {d.withOutcome}/{d.total}
                          </td>
                          <td className="px-5 py-3 text-right text-xs text-gray-400">
                            {getDaysAgo(d.lastEntry)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All entries */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Semua Isian Pasien ({totalPatients})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingList ? (
                <p className="text-sm text-gray-400 px-5 py-4">Memuat data...</p>
              ) : patients.length === 0 ? (
                <p className="text-sm text-gray-400 px-5 py-4">Belum ada data pasien.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {patients.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-purple-700">{p.patientInitial}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{p.patientInitial}</p>
                          <span className="text-xs text-gray-400">
                            {p.age}th • {p.gender === "M" ? "L" : "P"}
                          </span>
                          {p.triage && (
                            <Badge
                              variant={p.triage.recommendationGiven === "REFER" ? "destructive" : "success"}
                              className="text-[10px]"
                            >
                              {p.triage.recommendationGiven === "REFER" ? "Rujuk" : "Lanjut GDMT"}
                            </Badge>
                          )}
                          {p.triage && (
                            <span className="text-xs text-gray-400">Skor {p.triage.score}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {p.doctorName}
                          <span className="text-gray-300"> · </span>
                          <span className="text-gray-400">{getDaysAgo(p.createdAt)}</span>
                        </p>
                      </div>
                      {p.outcome ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
