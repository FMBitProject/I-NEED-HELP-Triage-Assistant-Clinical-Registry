"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Activity,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { store } from "@/lib/store";
import { Patient, TriageLog, Outcome } from "@/lib/types";
import { countGdmt } from "@/lib/triage";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  STABLE: { label: "Stabil", color: "success" },
  HOSPITALIZED: { label: "Rawat Inap", color: "warning" },
  REFERRED: { label: "Dirujuk", color: "default" },
  DECEASED: { label: "Meninggal", color: "destructive" },
  LOST_TO_FOLLOWUP: { label: "Lost Follow-up", color: "secondary" },
};

export default function PatientsPage() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [logs, setLogs] = useState<TriageLog[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "refer" | "continue" | "pending">("all");

  useEffect(() => {
    if (!isLoading && !doctor) router.replace("/login");
  }, [doctor, isLoading, router]);

  useEffect(() => {
    if (doctor) {
      setPatients(store.getPatients());
      setLogs(store.getTriageLogs());
      setOutcomes(store.getOutcomes());
    }
  }, [doctor]);

  if (isLoading || !doctor) return null;

  const filtered = patients
    .filter((p) => {
      const q = search.toLowerCase();
      if (q && !p.patientInitial.toLowerCase().includes(q)) return false;
      const log = logs.find((l) => l.patientId === p.id);
      const hasOutcome = !!outcomes.find((o) => o.patientId === p.id);
      if (filter === "refer") return log?.recommendationGiven === "REFER";
      if (filter === "continue") return log?.recommendationGiven === "CONTINUE_GDMT";
      if (filter === "pending") return !hasOutcome;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Daftar Pasien</h1>
              <p className="text-sm text-gray-500">{patients.length} total pasien tercatat</p>
            </div>
            <Link href="/triage/new">
              <Button size="sm" className="gap-1.5 shrink-0">
                <Plus className="w-4 h-4" />
                Triase Baru
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari inisial pasien..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { key: "all", label: "Semua" },
              { key: "refer", label: "Rujukan" },
              { key: "continue", label: "Lanjut GDMT" },
              { key: "pending", label: "Perlu Follow-up" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0",
                  filter === f.key
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-400 font-medium">Tidak ada pasien ditemukan</p>
              <Link href="/triage/new">
                <Button variant="outline" size="sm" className="mt-4">
                  Mulai Triase Pertama
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => {
                const log = logs.find((l) => l.patientId === p.id);
                const outcome = outcomes.find((o) => o.patientId === p.id);
                const gdmt = countGdmt(p);
                const outcomeInfo = outcome ? OUTCOME_LABELS[outcome.status] : null;

                return (
                  <Link key={p.id} href={`/patients/${p.id}`}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm",
                              log?.recommendationGiven === "REFER"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            )}
                          >
                            {p.patientInitial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900">{p.patientInitial}</p>
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
                              {outcomeInfo && (
                                <Badge
                                  variant={outcomeInfo.color as "success" | "destructive" | "warning" | "default" | "secondary"}
                                  className="text-[10px]"
                                >
                                  {outcomeInfo.label}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span>TD: {p.systolicBp}/{p.diastolicBp}</span>
                              <span>HR: {p.heartRate}</span>
                              {p.lvef && <span>EF: {p.lvef}%</span>}
                              <span className="text-blue-500 font-medium">GDMT: {gdmt}/4</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {outcome ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-400" />
                            )}
                            <p className="text-[10px] text-gray-400">
                              {formatDate(p.createdAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
