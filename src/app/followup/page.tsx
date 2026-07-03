"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PatientWithDetails } from "@/lib/types";
import { FOLLOW_UP_DAYS, daysSinceTriage, isFollowUpDue } from "@/lib/followup";
import { cn } from "@/lib/utils";

const OUTCOME_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  STABLE: { label: "Stabil", icon: "✅", color: "text-green-700" },
  HOSPITALIZED: { label: "Rawat Inap", icon: "🏥", color: "text-amber-700" },
  REFERRED: { label: "Dirujuk", icon: "➡️", color: "text-blue-700" },
  DECEASED: { label: "Meninggal", icon: "🕊️", color: "text-gray-700" },
  LOST_TO_FOLLOWUP: { label: "Lost F/U", icon: "❓", color: "text-orange-700" },
};

export default function FollowUpListPage() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<PatientWithDetails[]>([]);
  const [tab, setTab] = useState<"pending" | "done">("pending");

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

  // Jatuh tempo (≥30 hari sejak triase) di atas, lalu sisanya berdasarkan
  // yang paling lama menunggu.
  const pending = patients
    .filter((p) => !p.outcome)
    .sort((a, b) => {
      const dueA = isFollowUpDue(a);
      const dueB = isFollowUpDue(b);
      if (dueA !== dueB) return dueA ? -1 : 1;
      return daysSinceTriage(b) - daysSinceTriage(a);
    });
  const dueCount = pending.filter((p) => isFollowUpDue(p)).length;

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
              {dueCount} jatuh tempo · {pending.length - dueCount} masa observasi
            </p>
          </div>

          {dueCount > 0 && (
            <Card className="border-amber-200 ring-1 ring-amber-200 border-0 shadow-sm bg-amber-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 font-medium">
                    {dueCount} pasien sudah melewati {FOLLOW_UP_DAYS} hari tanpa update
                    outcome. Update untuk melengkapi data registri riset.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
                          ) : due ? (
                            <p className="text-xs text-amber-600 mt-1 font-medium">
                              Sudah {daysWaiting} hari sejak triase — jatuh tempo follow-up
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 mt-1">
                              Hari ke-{daysWaiting} dari {FOLLOW_UP_DAYS} — masa observasi
                            </p>
                          )}
                        </div>

                        <Link href={`/patients/${p.id}/followup`}>
                          <Button
                            variant={outcome ? "outline" : "warning"}
                            size="sm"
                            className="shrink-0"
                          >
                            {outcome ? "Edit" : "Update"}
                          </Button>
                        </Link>
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
