"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  HeartPulse,
  Pill,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Pencil,
  RefreshCw,
  Lock,
  FileCheck,
  History,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient, TriageLog, Outcome, AuditLog } from "@/lib/types";
import { TRIAGE_CRITERIA_LABELS, countGdmt } from "@/lib/triage";
import { cn } from "@/lib/utils";

const OUTCOME_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  STABLE: { label: "Rawat Jalan Stabil", color: "text-green-700 bg-green-50", icon: "✅" },
  HOSPITALIZED: { label: "Rawat Inap Ulang", color: "text-amber-700 bg-amber-50", icon: "🏥" },
  REFERRED: { label: "Dirujuk ke Faskes Lanjut", color: "text-blue-700 bg-blue-50", icon: "➡️" },
  DECEASED: { label: "Meninggal Dunia", color: "text-gray-700 bg-gray-100", icon: "🕊️" },
  LOST_TO_FOLLOWUP: { label: "Lost to Follow-up", color: "text-orange-700 bg-orange-50", icon: "❓" },
};

const NYHA_CAPTIONS: Record<string, string> = {
  I: "Tanpa gejala saat aktivitas",
  II: "Gejala saat aktivitas berat",
  III: "Gejala saat aktivitas ringan",
  IV: "Gejala saat istirahat",
};

const AUDIT_ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  create: { label: "Data dibuat", icon: "📝", color: "text-blue-700" },
  update: { label: "Data diubah", icon: "✏️", color: "text-amber-700" },
  finalize: { label: "Data difinalisasi", icon: "🔒", color: "text-green-700" },
  unlock_request: { label: "Permintaan buka kunci dikirim", icon: "📧", color: "text-orange-700" },
  delete: { label: "Dihapus (admin)", icon: "🗑️", color: "text-red-700" },
};

const FIELD_LABELS: Record<string, string> = {
  patientInitial: "Inisial", age: "Usia", gender: "Jenis Kelamin",
  systolicBp: "TD Sistolik", diastolicBp: "TD Diastolik", heartRate: "Detak Jantung",
  lvef: "LVEF", egfr: "eGFR", ntProbnp: "NT-proBNP", nyhaClass: "NYHA",
  comorbidDm: "Komorbid DM", comorbidHtn: "Komorbid HTN", comorbidCkd: "Komorbid CKD",
  comorbidAf: "Komorbid AF", onAceArni: "ACE-I/ARB/ARNI", onBb: "Beta-Blocker",
  onMra: "MRA", onSglt2i: "SGLT2i",
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [triageLog, setTriageLog] = useState<TriageLog | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [finalizeConfirm, setFinalizeConfirm] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAudit, setShowAudit] = useState(false);

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
        setTriageLog(data.triage);
        setOutcome(data.outcome);
      });
  }, [id, doctor, router]);

  useEffect(() => {
    if (!id || !doctor || !showAudit) return;
    fetch(`/api/patients/${id}/audit`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setAuditLogs);
  }, [id, doctor, showAudit]);

  if (isLoading || !doctor || !patient) return null;

  const isFinalized = !!patient.finalizedAt;

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/patients/${patient.id}`, { method: "DELETE" });
    if (res.status === 423) {
      setDeleting(false);
      setDeleteConfirm(false);
      return;
    }
    router.replace("/patients");
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    const res = await fetch(`/api/patients/${patient.id}/finalize`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setPatient(updated);
      setFinalizeConfirm(false);
    }
    setFinalizing(false);
  };

  const unlockSubject = encodeURIComponent(
    `Permintaan Buka Kunci Data Pasien ${patient.patientInitial} (ID: ${patient.id})`
  );
  const unlockBody = encodeURIComponent(
    `Halo Developer,\n\nSaya meminta pembukaan kunci data pasien berikut:\n\nInisial: ${patient.patientInitial}\nID: ${patient.id}\nDifinalisasi: ${patient.finalizedAt ? new Date(patient.finalizedAt).toLocaleDateString("id-ID") : ""}\n\nAlasan perubahan:\n[Jelaskan alasan di sini]\n\n---\nDikirim oleh: ${doctor.name}\nFaskes: ${doctor.institutionType}`
  );
  const unlockMailto = `mailto:renfael6@gmail.com?subject=${unlockSubject}&body=${unlockBody}`;

  const isRefer = triageLog?.recommendationGiven === "REFER";
  const gdmtCount = countGdmt(patient);
  const metCriteriaKeys = triageLog
    ? (Object.entries(triageLog.criteriaMet) as [keyof typeof TRIAGE_CRITERIA_LABELS, boolean][])
        .filter(([, v]) => v)
        .map(([k]) => k)
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>

          {/* Finalized banner */}
          {isFinalized && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-900">Data Terfinalisasi</p>
                  <p className="text-xs text-green-700 leading-relaxed">
                    {new Date(patient.finalizedAt!).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                    {" "}— tidak dapat diubah tanpa persetujuan developer
                  </p>
                </div>
              </div>
              <a href={unlockMailto} className="block sm:inline-block sm:ml-7">
                <Button variant="outline" size="sm" className="gap-1.5 border-green-300 text-green-700 hover:bg-green-100 text-xs w-full sm:w-auto">
                  <Mail className="w-3 h-3" />
                  Buka Kunci
                </Button>
              </a>
            </div>
          )}

          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0",
                isRefer ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              )}
            >
              {patient.patientInitial}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{patient.patientInitial}</h1>
                {triageLog && (
                  <Badge variant={isRefer ? "destructive" : "success"}>
                    {isRefer ? "Perlu Rujukan" : "Lanjut GDMT"}
                  </Badge>
                )}
                {isFinalized && (
                  <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 border-green-200">
                    <Lock className="w-2.5 h-2.5" />
                    Final
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {patient.age} tahun • {patient.gender === "M" ? "Laki-laki" : "Perempuan"}
              </p>
              {patient.nyhaClass && (
                <p className="text-xs text-gray-500">
                  NYHA {patient.nyhaClass}
                  {NYHA_CAPTIONS[patient.nyhaClass] && (
                    <span className="text-gray-400"> — {NYHA_CAPTIONS[patient.nyhaClass]}</span>
                  )}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                Triase:{" "}
                {new Date(patient.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>

              {isFinalized ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  <a href={unlockMailto}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50">
                      <Mail className="w-3.5 h-3.5" />
                      Minta Ubah Data
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Link href={`/patients/${patient.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Data
                    </Button>
                  </Link>
                  <Link href={`/patients/${patient.id}/retriage`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Triase Ulang
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Outcome Status */}
          {outcome ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{OUTCOME_LABELS[outcome.status]?.icon}</span>
                  <div>
                    <p className="text-xs text-gray-500">Status Outcome 30-Hari</p>
                    <p className={cn("text-sm font-bold px-2 py-0.5 rounded-full w-fit mt-0.5", OUTCOME_LABELS[outcome.status]?.color)}>
                      {OUTCOME_LABELS[outcome.status]?.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Dicatat: {new Date(outcome.recordedAt).toLocaleDateString("id-ID")} •{" "}
                      {outcome.followUpDays} hari setelah triase
                    </p>
                  </div>
                  {!isFinalized && (
                    <Link href={`/patients/${patient.id}/followup`} className="ml-auto">
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-200 ring-1 ring-amber-200 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">Belum Ada Follow-up</p>
                    <p className="text-xs text-amber-700">Update status outcome untuk melengkapi data registri.</p>
                  </div>
                  {!isFinalized && (
                    <Link href={`/patients/${patient.id}/followup`}>
                      <Button variant="warning" size="sm">Update</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vital Signs */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-red-500" />
                Tanda Vital & Lab
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "Sistolik", value: `${patient.systolicBp}`, unit: "mmHg" },
                  { label: "Diastolik", value: `${patient.diastolicBp}`, unit: "mmHg" },
                  { label: "Detak Jantung", value: `${patient.heartRate}`, unit: "bpm" },
                  ...(patient.lvef ? [{ label: "LVEF", value: `${patient.lvef}`, unit: "%" }] : []),
                  ...(patient.egfr ? [{ label: "eGFR", value: `${patient.egfr}`, unit: "mL/min" }] : []),
                  ...(patient.ntProbnp ? [{ label: "NT-proBNP", value: `${patient.ntProbnp}`, unit: "pg/mL" }] : []),
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-[10px] text-gray-500 mb-0.5">{item.label}</p>
                    <p className="text-base font-bold text-gray-900">{item.value}</p>
                    <p className="text-[10px] text-gray-400">{item.unit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comorbidities */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                Komorbiditas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Diabetes Melitus", active: patient.comorbidDm },
                  { label: "Hipertensi", active: patient.comorbidHtn },
                  { label: "CKD / Gagal Ginjal", active: patient.comorbidCkd },
                  { label: "Atrial Fibrilasi", active: patient.comorbidAf },
                ].map((c) => (
                  <div
                    key={c.label}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-xs font-medium",
                      c.active ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-400"
                    )}
                  >
                    <span className={c.active ? "text-red-500" : "text-gray-300"}>
                      {c.active ? "●" : "○"}
                    </span>
                    {c.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* GDMT */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Pill className="w-4 h-4 text-green-500" />
                Status GDMT ({gdmtCount}/4)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-1.5">
                {[
                  { label: "ACE-I / ARB / ARNI", active: patient.onAceArni },
                  { label: "Beta-Blocker", active: patient.onBb },
                  { label: "MRA (Spironolakton)", active: patient.onMra },
                  { label: "SGLT2 Inhibitor", active: patient.onSglt2i },
                ].map((d) => (
                  <div
                    key={d.label}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium",
                      d.active ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                    )}
                  >
                    {d.active ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    {d.label}
                    {!d.active && (
                      <span className="ml-auto text-gray-400">Tidak diresepkan</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Triage Score */}
          {triageLog && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-500" />
                    Skor I-NEED-HELP
                  </CardTitle>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap",
                      isRefer ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    )}
                  >
                    {triageLog.score}/9 — {isRefer ? "RUJUK" : "LANJUT GDMT"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {metCriteriaKeys.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">
                    Tidak ada kriteria perburukan yang terpenuhi
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {metCriteriaKeys.map((k) => {
                      const info = TRIAGE_CRITERIA_LABELS[k];
                      return (
                        <div key={k} className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black shrink-0 mt-0.5">
                            {info.key}
                          </span>
                          <p className="text-xs text-red-800 font-medium">{info.label}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Finalize section */}
          {!isFinalized && (
            <Card className="border-0 shadow-sm ring-1 ring-gray-200">
              <CardContent className="p-4">
                {!finalizeConfirm ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <FileCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">Finalisasi Data</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Kunci data setelah semua entri selesai. Data terkunci tidak dapat diubah tanpa persetujuan developer.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFinalizeConfirm(true)}
                      className="w-full sm:w-auto gap-1.5 text-green-700 border-green-300 hover:bg-green-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Finalisasi
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-sm font-semibold text-gray-900">
                        Yakin ingin mengunci data pasien <span className="text-green-700">{patient.patientInitial}</span>?
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                      Setelah difinalisasi, data tidak dapat diubah atau dihapus kecuali menghubungi developer. Tindakan ini akan dicatat di audit trail.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setFinalizeConfirm(false)}
                        disabled={finalizing}
                      >
                        Batal
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                        onClick={handleFinalize}
                        disabled={finalizing}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        {finalizing ? "Mengunci..." : "Ya, Finalisasi"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Audit Trail */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowAudit((v) => !v)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 w-full"
            >
              <History className="w-3.5 h-3.5" />
              <span className="font-medium">Riwayat Perubahan (Audit Trail)</span>
              {showAudit ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </button>

            {showAudit && (
              <div className="mt-3 space-y-1.5">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">Belum ada riwayat perubahan</p>
                ) : (
                  auditLogs.map((log) => {
                    const meta = AUDIT_ACTION_LABELS[log.action] ?? { label: log.action, icon: "•", color: "text-gray-600" };
                    const fieldLabel = log.changedField ? (FIELD_LABELS[log.changedField] ?? log.changedField) : null;
                    return (
                      <div key={log.id} className="flex items-start gap-2 p-2.5 bg-white rounded-lg border border-gray-100">
                        <span className="text-base leading-none mt-0.5">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-semibold", meta.color)}>
                            {meta.label}
                            {fieldLabel && (
                              <span className="font-normal text-gray-500">: {fieldLabel}</span>
                            )}
                          </p>
                          {log.oldValue !== null && log.newValue !== null && log.oldValue !== log.newValue && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              <span className="line-through">{log.oldValue || "—"}</span>
                              {" → "}
                              <span className="text-gray-600">{log.newValue || "—"}</span>
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400">
                            {new Date(log.createdAt).toLocaleString("id-ID", {
                              day: "numeric", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                            {log.userName && ` • ${log.userName}`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Delete — only when not finalized */}
          {!isFinalized && (
            <div className="pb-4">
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus data pasien ini
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-red-800 font-semibold">
                    Hapus semua data pasien ini secara permanen? Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(false)}
                      disabled={deleting}
                      className="flex-1 text-xs"
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
                      disabled={deleting}
                      onClick={handleDelete}
                    >
                      {deleting ? "Menghapus..." : "Ya, Hapus"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
