"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, CheckSquare } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Patient, TriageCriteria } from "@/lib/types";
import { TRIAGE_CRITERIA_LABELS, calculateTriageScore } from "@/lib/triage";
import { cn } from "@/lib/utils";

const defaultCriteria: TriageCriteria = {
  I: false, N: false, E1: false, E2: false, D: false, H: false, E3: false, L: false, P: false,
};

export default function ReTriagePage() {
  const { id } = useParams<{ id: string }>();
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [criteria, setCriteria] = useState<TriageCriteria>(defaultCriteria);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !doctor) router.replace("/login");
  }, [doctor, isLoading, router]);

  useEffect(() => {
    if (!id || !doctor) return;
    fetch(`/api/patients/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { router.replace("/patients"); return; }
        setPatient(data.patient);
      });
  }, [id, doctor, router]);

  if (isLoading || !doctor || !patient) return null;

  const score = calculateTriageScore(criteria);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, criteria }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan triase");
      const triage = await res.json();
      router.push(`/triage/${triage.id}/result`);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          <div className="mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
            <h1 className="text-xl font-bold text-gray-900">Triase Ulang</h1>
            <p className="text-sm text-gray-500 mt-0.5">Centang kriteria perburukan yang ada pada pasien</p>
          </div>

          {/* Patient info card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 font-bold text-blue-700">
                  {patient.patientInitial}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{patient.patientInitial}</p>
                  <p className="text-sm text-gray-500">
                    {patient.age} tahun &bull; {patient.gender === "M" ? "Laki-laki" : "Perempuan"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score display */}
          <Card className="border-0 shadow-sm bg-blue-50 ring-1 ring-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Skor saat ini</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-black text-blue-800">{score}</span>
                    <span className="text-sm text-blue-600">/ 9 kriteria</span>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-bold",
                  score === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {score === 0 ? "LANJUT GDMT" : "RUJUK"}
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
            <strong>Petunjuk:</strong> Centang setiap kriteria perburukan yang <strong>ADA</strong> pada
            pasien saat ini. Satu atau lebih kriteria yang terpenuhi menandakan pasien perlu dirujuk ke
            faskes sekunder/tersier.
          </p>

          {/* Criteria checklist */}
          <div className="space-y-2">
            {(Object.entries(TRIAGE_CRITERIA_LABELS) as [keyof TriageCriteria, typeof TRIAGE_CRITERIA_LABELS[keyof TriageCriteria]][]).map(
              ([key, info]) => (
                <label
                  key={key}
                  htmlFor={`criteria-${key}`}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                    criteria[key]
                      ? "border-red-400 bg-red-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <Checkbox
                    id={`criteria-${key}`}
                    checked={criteria[key]}
                    onCheckedChange={(v) =>
                      setCriteria((c) => ({ ...c, [key]: !!v }))
                    }
                    className={cn(
                      "mt-0.5 shrink-0",
                      criteria[key] && "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] font-black shrink-0">
                        {info.key}
                      </span>
                      <p className="text-sm font-semibold text-gray-900">{info.label}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{info.description}</p>
                  </div>
                </label>
              )
            )}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Memproses..." : "Lihat Hasil Triase"}
            <CheckSquare className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </main>
    </div>
  );
}
