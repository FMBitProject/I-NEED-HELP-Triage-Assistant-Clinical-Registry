"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Users,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  Plus,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatientWithDetails } from "@/lib/types";
import { countGdmt } from "@/lib/triage";
import { FOLLOW_UP_DAYS, daysSinceTriage, isFollowUpDue, isInObservation } from "@/lib/followup";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

export default function DashboardPage() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<PatientWithDetails[]>([]);

  useEffect(() => {
    if (!isLoading && !doctor) router.replace("/login");
  }, [doctor, isLoading, router]);

  useEffect(() => {
    if (doctor) {
      fetch("/api/patients")
        .then((r) => r.ok ? r.json() : [])
        .then(setPatients);
    }
  }, [doctor]);

  if (isLoading || !doctor) return null;

  const totalPatients = patients.length;
  const thisMonth = patients.filter((p) => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const logs = patients.map((p) => p.triage).filter(Boolean);
  const referrals = logs.filter((l) => l!.recommendationGiven === "REFER").length;
  const referralRate = logs.length > 0 ? Math.round((referrals / logs.length) * 100) : 0;

  const gdmtFull = patients.filter((p) => countGdmt(p) === 4).length;
  const gdmtRate = totalPatients > 0 ? Math.round((gdmtFull / totalPatients) * 100) : 0;

  // PRD: notifikasi hanya untuk pasien yang sudah melewati masa triase
  // (30 hari) tanpa outcome — bukan pasien yang baru ditriase.
  const dueFollowup = patients.filter((p) => isFollowUpDue(p));
  const inObservation = patients.filter((p) => isInObservation(p));

  const recentPatients = patients.slice(0, 5);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString("id-ID", { month: "short" });
    const count = patients.filter(p => {
      const pd = new Date(p.createdAt);
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
    }).length;
    return { bulan: label, pasien: count };
  });

  const stats = [
    {
      label: "Total Pasien",
      value: totalPatients,
      sub: `+${thisMonth} bulan ini`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Tingkat Rujukan",
      value: `${referralRate}%`,
      sub: `${referrals} dari ${logs.length} triase`,
      icon: TrendingUp,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "GDMT Lengkap",
      value: `${gdmtRate}%`,
      sub: `${gdmtFull} dari ${totalPatients} pasien`,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Perlu Follow-up",
      value: dueFollowup.length,
      sub: `${inObservation.length} masih observasi`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Selamat datang, {doctor.name.split(",")[0]}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[200px] sm:max-w-none">{doctor.institutionType}</p>
            </div>
            <Link href="/triage/new">
              <Button size="lg" className="shrink-0 gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Triase Baru</span>
                <span className="sm:hidden">Triase</span>
              </Button>
            </Link>
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
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly enrollment chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tren Pendaftaran (6 Bulan Terakhir)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="bulan" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip formatter={(v) => [`${v} pasien`, "Pendaftaran"]} />
                  <Bar dataKey="pasien" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Soft reminder: ethical clearance belum diisi (muncul setelah 5 pasien) */}
          {!doctor.ethicalClearanceNo && totalPatients >= 5 && (
            <Card className="border-blue-200 bg-blue-50 shadow-sm border-0 ring-1 ring-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ClipboardList className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">
                      Nomor ethical clearance belum diisi
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Opsional — dapat diisi nanti sebelum publikasi. Puskesmas bisa mengajukan ke FK/FKM universitas terdekat.
                    </p>
                  </div>
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100">
                      Isi Nanti
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending followup alert — hanya untuk yang sudah jatuh tempo */}
          {dueFollowup.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 shadow-sm border-0 ring-1 ring-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">
                      {dueFollowup.length} pasien sudah melewati {FOLLOW_UP_DAYS} hari
                      tanpa update outcome
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Update outcome pasien untuk melengkapi data registri riset.
                    </p>
                  </div>
                  <Link href="/followup">
                    <Button variant="warning" size="sm" className="shrink-0">
                      Update Sekarang
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Recent Patients */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Pasien Terbaru</CardTitle>
                  <Link href="/patients">
                    <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                      Lihat Semua <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentPatients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Activity className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Belum ada data pasien</p>
                    <Link href="/triage/new">
                      <Button variant="outline" size="sm" className="mt-3">
                        Mulai Triase Pertama
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recentPatients.map((p) => {
                      const log = p.triage;
                      const outcome = p.outcome;
                      return (
                        <li key={p.id}>
                          <Link
                            href={`/patients/${p.id}`}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-blue-700">
                                {p.patientInitial}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">
                                  {p.patientInitial}
                                </p>
                                <span className="text-xs text-gray-400">
                                  {p.age}th • {p.gender === "M" ? "L" : "P"}
                                </span>
                                {log && (
                                  <Badge
                                    variant={log.recommendationGiven === "REFER" ? "destructive" : "success"}
                                    className="text-[10px]"
                                  >
                                    {log.recommendationGiven === "REFER" ? "Rujuk" : "Lanjut GDMT"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">{getDaysAgo(p.createdAt)}</p>
                            </div>
                            {outcome ? (
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* GDMT Audit */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Audit GDMT Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "ACE-I / ARB / ARNI", count: patients.filter((p) => p.onAceArni).length },
                  { label: "Beta-Blocker", count: patients.filter((p) => p.onBb).length },
                  { label: "MRA", count: patients.filter((p) => p.onMra).length },
                  { label: "SGLT2i", count: patients.filter((p) => p.onSglt2i).length },
                ].map((drug) => {
                  const pct = totalPatients > 0 ? Math.round((drug.count / totalPatients) * 100) : 0;
                  return (
                    <div key={drug.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{drug.label}</span>
                        <span className="text-gray-500">
                          {drug.count}/{totalPatients} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-500">≥70%: Sesuai guideline</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-gray-500">40–69%: Perlu peningkatan</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Follow-up list — jatuh tempo dulu, lalu observasi */}
          {(dueFollowup.length > 0 || inObservation.length > 0) && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Menunggu Follow-up
                  </CardTitle>
                  <Link href="/followup">
                    <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                      Kelola <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-100">
                  {[...dueFollowup, ...inObservation].slice(0, 3).map((p) => {
                    const log = p.triage;
                    const daysWaiting = daysSinceTriage(p);
                    const due = isFollowUpDue(p);
                    return (
                      <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-amber-700">{p.patientInitial}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{p.patientInitial}</p>
                            <p className="text-xs text-gray-400">{p.age}th</p>
                            {log && (
                              <Badge
                                variant={log.recommendationGiven === "REFER" ? "destructive" : "success"}
                                className="text-[10px]"
                              >
                                {log.recommendationGiven === "REFER" ? "Rujuk" : "Lanjut GDMT"}
                              </Badge>
                            )}
                          </div>
                          {due ? (
                            <p className="text-xs text-amber-600 font-medium">
                              {daysWaiting} hari sejak triase — jatuh tempo
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">
                              Hari ke-{daysWaiting} dari {FOLLOW_UP_DAYS} — masa observasi
                            </p>
                          )}
                        </div>
                        <Link href={`/patients/${p.id}/followup`}>
                          <Button variant="outline" size="sm" className="shrink-0 text-xs">
                            Update
                          </Button>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
