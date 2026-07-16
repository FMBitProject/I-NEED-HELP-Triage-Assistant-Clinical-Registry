"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle, Info } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Outcome, PatientWithDetails } from "@/lib/types";
import {
  FOLLOW_UP_DAYS,
  QUIET_DAYS,
  daysSinceTriage,
  isFollowUpDue,
  isPastQuietPeriod,
} from "@/lib/followup";
import { cn } from "@/lib/utils";

const OUTCOME_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  STABLE: { label: "Stabil", icon: "✅", color: "text-green-700" },
  HOSPITALIZED: { label: "Rawat Inap", icon: "🏥", color: "text-amber-700" },
  REFERRED: { label: "Dirujuk", icon: "➡️", color: "text-blue-700" },
  DECEASED: { label: "Meninggal", icon: "🕊️", color: "text-gray-700" },
  LOST_TO_FOLLOWUP: { label: "Tanpa Kabar (Lost F/U)", icon: "❓", color: "text-orange-700" },
};

export default function FollowUpListPage() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<PatientWithDetails[]>([]);
  const [tab, setTab] = useState<"pending" | "done">("pending");
  const [markingLostId, setMarkingLostId] = useState<string | null>(null);

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

  // Satu-tap tandai Lost to Follow-up — outcome tetap bisa diubah lewat
  // tombol Edit kalau ternyata pasien muncul kembali.
  const markLostToFollowUp = async (p: PatientWithDetails) => {
    setMarkingLostId(p.id);
    try {
      const res = await fetch("/api/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: p.id,
          status: "LOST_TO_FOLLOWUP",
          followUpDays: daysSinceTriage(p),
        }),
      });
      if (res.ok) {
        const outcome: Outcome = await res.json();
        setPatients((prev) =>
          prev.map((x) => (x.id === p.id ? { ...x, outcome } : x))
        );
      }
    } finally {
      setMarkingLostId(null);
    }
  };

  // Jatuh tempo (30–60 hari) di atas, lalu tanpa kabar (>60 hari), lalu masa
  // observasi berdasarkan yang paling lama menunggu.
  const pending = patients
    .filter((p) => !p.outcome)
    .sort((a, b) => {
      const rank = (p: PatientWithDetails) =>
        isFollowUpDue(p) ? 0 : isPastQuietPeriod(p) ? 1 : 2;
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return daysSinceTriage(b) - daysSinceTriage(a);
    });
  const dueCount = pending.filter((p) => isFollowUpDue(p)).length;
  const quietCount = pending.filter((p) => isPastQuietPeriod(p)).length;

  const done = patients
    .filter((p) => !!p.outcome)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const list = tab === "pending" ? pending : done;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Follow-up Pasien</h1>
            <p className="text-sm text-gray-500">
              {dueCount} jatuh tempo · {pending.length - dueCount - quietCount} masa
              observasi{quietCount > 0 && ` · ${quietCount} tanpa kabar`}
            </p>
          </div>

          <Card className="border-blue-100 ring-1 ring-blue-100 border-0 shadow-sm bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Follow-up bersifat <strong>oportunistik</strong> — catat outcome saat pasien
                  kebetulan datang kembali ke IGD/poli. Anda tidak diwajibkan menghubungi
                  pasien. Jika sampai {QUIET_DAYS} hari tidak ada kabar, cukup tandai{" "}
                  <strong>Tanpa Kabar</strong> dengan satu ketukan.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setTab("pending")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5",
                tab === "pending"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              Belum Follow-up
              {dueCount > 0 ? (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {dueCount}
                </span>
              ) : (
                pending.length > 0 && (
                  <span className="text-xs text-gray-400">({pending.length})</span>
                )
              )}
            </button>
            <button
              onClick={() => setTab("done")}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5",
                tab === "done"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Selesai
              <span className="text-xs text-gray-400">({done.length})</span>
            </button>
          </div>

          {/* List */}
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              {tab === "pending" ? (
                <>
                  <CheckCircle className="w-10 h-10 text-green-300 mb-3" />
                  <p className="text-gray-400 font-medium">Semua pasien sudah difollow-up!</p>
                </>
              ) : (
                <>
                  <Clock className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-gray-400 font-medium">Belum ada data follow-up</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((p) => {
                const log = p.triage;
                const outcome = p.outcome;
                const daysWaiting = daysSinceTriage(p);
                const due = isFollowUpDue(p);
                const quiet = isPastQuietPeriod(p);
                const isRefer = log?.recommendationGiven === "REFER";

                return (
                  <Card key={p.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shrink-0",
                            isRefer ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          )}
                        >
                          {p.patientInitial}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{p.patientInitial}</p>
                            <span className="text-xs text-gray-400">{p.age}th</span>
                            {log && (
                              <Badge
                                variant={isRefer ? "destructive" : "success"}
                                className="text-[10px]"
                              >
                                {isRefer ? "Rujuk" : "Lanjut GDMT"}
                              </Badge>
                            )}
                          </div>

                          {outcome ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs">{OUTCOME_LABELS[outcome.status]?.icon}</span>
                              <span className={cn("text-xs font-medium", OUTCOME_LABELS[outcome.status]?.color)}>
                                {OUTCOME_LABELS[outcome.status]?.label}
                              </span>
                              <span className="text-xs text-gray-400">
                                • {outcome.followUpDays} hari follow-up
                              </span>
                            </div>
                          ) : quiet ? (
                            <p className="text-xs text-gray-500 mt-1">
                              {daysWaiting} hari tanpa kabar — tandai bila tidak ada info
                            </p>
                          ) : due ? (
                            <p className="text-xs text-amber-600 mt-1 font-medium">
                              Hari ke-{daysWaiting} — catat bila pasien sempat datang kembali
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1">
                              Hari ke-{daysWaiting} dari {FOLLOW_UP_DAYS} — masa observasi
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Link href={`/patients/${p.id}/followup`}>
                            <Button
                              variant={outcome || quiet ? "outline" : due ? "warning" : "outline"}
                              size="sm"
                            >
                              {outcome ? "Edit" : "Update"}
                            </Button>
                          </Link>
                          {!outcome && (due || quiet) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-gray-400 hover:text-orange-600 h-auto py-1"
                              disabled={markingLostId === p.id}
                              onClick={() => markLostToFollowUp(p)}
                            >
                              {markingLostId === p.id ? "Menandai..." : "❓ Tanpa Kabar"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
