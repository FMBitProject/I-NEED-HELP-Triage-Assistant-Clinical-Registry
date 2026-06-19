"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Patient, OutcomeStatus, TriageLog } from "@/lib/types";
import { cn } from "@/lib/utils";

const NOT_REFERRED_REASONS = [
  "RS mampu kelola mandiri",
  "Pasien/keluarga menolak rujukan",
  "Faskes rujukan penuh/tidak tersedia",
  "Kendala BPJS/administrasi",
  "Lainnya",
];

const STATUS_OPTIONS: { value: OutcomeStatus; label: string; desc: string; icon: string; color: string }[] = [
  {
    value: "STABLE",
    label: "Rawat Jalan Stabil",
    desc: "Pasien kondisi stabil, tidak ada perburukan bermakna.",
    icon: "✅",
    color: "border-green-400 bg-green-50",
  },
  {
    value: "HOSPITALIZED",
    label: "Rawat Inap Ulang",
    desc: "Pasien kembali dirawat inap karena dekompensasi.",
    icon: "🏥",
    color: "border-amber-400 bg-amber-50",
  },
  {
    value: "REFERRED",
    label: "Dirujuk ke Faskes Lanjut",
    desc: "Pasien berhasil dirujuk dan diterima di RS tujuan.",
    icon: "➡️",
    color: "border-blue-400 bg-blue-50",
  },
  {
    value: "DECEASED",
    label: "Meninggal Dunia",
    desc: "Pasien meninggal dalam periode follow-up.",
    icon: "🕊️",
    color: "border-gray-400 bg-gray-50",
  },
  {
    value: "LOST_TO_FOLLOWUP",
    label: "Lost to Follow-up",
    desc: "Pasien tidak dapat dihubungi atau tidak kontrol kembali.",
    icon: "❓",
    color: "border-orange-400 bg-orange-50",
  },
];

export default function FollowUpPage() {
  const { id } = useParams<{ id: string }>();
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [triage, setTriage] = useState<TriageLog | null>(null);
  const [status, setStatus] = useState<OutcomeStatus | "">("");
  const [followUpDays, setFollowUpDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [notReferredReason, setNotReferredReason] = useState("");
  const [notReferredReasonOther, setNotReferredReasonOther] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
        setTriage(data.triage);
        if (data.outcome) {
          setStatus(data.outcome.status);
          setFollowUpDays(String(data.outcome.followUpDays));
          setNotes(data.outcome.notes ?? "");
          setAdmissionDate(data.outcome.admissionDate ?? "");
          setDischargeDate(data.outcome.dischargeDate ?? "");
          const reason = data.outcome.notReferredReason ?? "";
          if (reason && !NOT_REFERRED_REASONS.includes(reason)) {
            setNotReferredReason("Lainnya");
            setNotReferredReasonOther(reason);
          } else {
            setNotReferredReason(reason);
          }
        }
      });
  }, [id, doctor, router]);

  if (isLoading || !doctor || !patient) return null;

  const wasRecommendedReferral = triage?.recommendationGiven === "REFER";
  const showNotReferredReason = wasRecommendedReferral && status !== "" && status !== "REFERRED";
  const showAdmissionFields = status === "HOSPITALIZED";
  const lengthOfStay =
    admissionDate && dischargeDate
      ? Math.round(
          (new Date(dischargeDate).getTime() - new Date(admissionDate).getTime()) / 86400000
        )
      : null;
  const hasInvalidStayDates = lengthOfStay !== null && lengthOfStay < 0;

  const handleSave = async () => {
    if (!status) return;
    setSaving(true);
    await fetch("/api/outcomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: patient.id,
        status,
        followUpDays: Number(followUpDays) || 30,
        notes: notes || null,
        admissionDate: showAdmissionFields ? admissionDate || null : null,
        dischargeDate: showAdmissionFields ? dischargeDate || null : null,
        notReferredReason: showNotReferredReason
          ? (notReferredReason === "Lainnya" ? notReferredReasonOther : notReferredReason) || null
          : null,
      }),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => router.push(`/patients/${patient.id}`), 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>

          <div>
            <h1 className="text-xl font-bold text-gray-900">Update Follow-up</h1>
            <p className="text-sm text-gray-500">
              Pasien: <strong>{patient.patientInitial}</strong> • {patient.age} th •{" "}
              {patient.gender === "M" ? "L" : "P"}
            </p>
          </div>

          {saved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <p className="text-sm font-semibold">Follow-up berhasil disimpan!</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">Status Outcome 30-Hari *</p>
            {STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                htmlFor={`status-${opt.value}`}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  status === opt.value
                    ? opt.color + " border-opacity-100"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  id={`status-${opt.value}`}
                  name="status"
                  value={opt.value}
                  checked={status === opt.value}
                  onChange={() => setStatus(opt.value)}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {showAdmissionFields && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Detail Rawat Inap</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="admission-date">Tanggal Masuk</Label>
                    <Input
                      id="admission-date"
                      type="date"
                      value={admissionDate}
                      onChange={(e) => setAdmissionDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="discharge-date">Tanggal Keluar</Label>
                    <Input
                      id="discharge-date"
                      type="date"
                      min={admissionDate || undefined}
                      value={dischargeDate}
                      onChange={(e) => setDischargeDate(e.target.value)}
                    />
                  </div>
                </div>
                <p className={cn("text-xs", hasInvalidStayDates ? "text-red-600 font-medium" : "text-gray-400")}>
                  {hasInvalidStayDates
                    ? "Tanggal keluar tidak boleh sebelum tanggal masuk."
                    : lengthOfStay !== null
                    ? `Length of stay: ${lengthOfStay} hari`
                    : "Kosongkan tanggal keluar jika pasien masih dirawat."}
                </p>
              </CardContent>
            </Card>
          )}

          {showNotReferredReason && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Alasan Tidak Dirujuk</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Skor I-NEED-HELP merekomendasikan rujukan, namun status outcome bukan &quot;Dirujuk&quot;.
                  </p>
                </div>
                <select
                  value={notReferredReason}
                  onChange={(e) => setNotReferredReason(e.target.value)}
                  className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Pilih alasan...</option>
                  {NOT_REFERRED_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {notReferredReason === "Lainnya" && (
                  <Input
                    placeholder="Tuliskan alasan..."
                    value={notReferredReasonOther}
                    onChange={(e) => setNotReferredReasonOther(e.target.value)}
                  />
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="days">Hari Sejak Triase</Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={365}
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(e.target.value)}
                />
                <p className="text-xs text-gray-400">Berapa hari sejak triase awal dilakukan?</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Catatan Klinis (opsional)</Label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Tambahkan catatan klinis tambahan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            size="xl"
            className="w-full"
            disabled={!status || saving || saved || hasInvalidStayDates}
            onClick={handleSave}
          >
            {saving ? "Menyimpan..." : saved ? "Tersimpan ✓" : "Simpan Status Follow-up"}
          </Button>
        </div>
      </main>
    </div>
  );
}
