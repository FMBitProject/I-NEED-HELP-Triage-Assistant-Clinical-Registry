"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  User,
  HeartPulse,
  FlaskConical,
  Pill,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { TriageCriteria, EdDisposition, GdmtOmissionReason, HfOnset } from "@/lib/types";
import { HF_ONSET_OPTIONS } from "@/lib/hf-onset";
import { GdmtPillarField } from "@/components/gdmt-pillar-field";
import { ED_DISPOSITION_OPTIONS } from "@/lib/disposition";
import { TRIAGE_CRITERIA_LABELS, calculateTriageScore, getTriageResult } from "@/lib/triage";
import { REFER_RECOMMENDATIONS, CONTINUE_RECOMMENDATIONS } from "@/lib/recommendations";
import { enqueuePendingTriage, isNetworkError, PendingPatientPayload } from "@/lib/offline-queue";
import { getVitalsWarnings } from "@/lib/vitals";
import { cn } from "@/lib/utils";

type Step = 1 | 2;

interface ProfileData {
  patientInitial: string;
  age: string;
  gender: "M" | "F" | "";
  systolicBp: string;
  diastolicBp: string;
  heartRate: string;
  lvef: string;
  egfr: string;
  ntProbnp: string;
  comorbidDm: boolean;
  comorbidHtn: boolean;
  comorbidCkd: boolean;
  comorbidAf: boolean;
  onAceArni: boolean;
  onBb: boolean;
  onMra: boolean;
  onSglt2i: boolean;
  noAceArniReason: "" | GdmtOmissionReason;
  noBbReason: "" | GdmtOmissionReason;
  noMraReason: "" | GdmtOmissionReason;
  noSglt2iReason: "" | GdmtOmissionReason;
  noAceArniReasonOther: string;
  noBbReasonOther: string;
  noMraReasonOther: string;
  noSglt2iReasonOther: string;
  nyhaClass: "" | "I" | "II" | "III" | "IV";
  hfOnset: "" | HfOnset;
  edDisposition: "" | EdDisposition;
}

const defaultProfile: ProfileData = {
  patientInitial: "",
  age: "",
  gender: "",
  systolicBp: "",
  diastolicBp: "",
  heartRate: "",
  lvef: "",
  egfr: "",
  ntProbnp: "",
  comorbidDm: false,
  comorbidHtn: false,
  comorbidCkd: false,
  comorbidAf: false,
  onAceArni: false,
  onBb: false,
  onMra: false,
  onSglt2i: false,
  noAceArniReason: "",
  noBbReason: "",
  noMraReason: "",
  noSglt2iReason: "",
  noAceArniReasonOther: "",
  noBbReasonOther: "",
  noMraReasonOther: "",
  noSglt2iReasonOther: "",
  nyhaClass: "",
  hfOnset: "",
  edDisposition: "",
};

const defaultCriteria: TriageCriteria = {
  I: false, N: false, E1: false, E2: false, D: false, H: false, E3: false, L: false, P: false,
};

const NYHA_OPTIONS = [
  { value: "I", caption: "Tanpa gejala saat aktivitas" },
  { value: "II", caption: "Gejala saat aktivitas berat" },
  { value: "III", caption: "Gejala saat aktivitas ringan" },
  { value: "IV", caption: "Gejala saat istirahat" },
] as const;

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={cn("flex items-center gap-2")}>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
          step === 1
            ? "bg-blue-600 border-blue-600 text-white"
            : "bg-white border-blue-600 text-blue-600"
        )}>
          {step > 1 ? "✓" : "1"}
        </div>
        <span className={cn("text-xs sm:text-sm font-medium", step === 1 ? "text-blue-700" : "text-blue-600")}>
          Profil Pasien
        </span>
      </div>
      <div className="flex-1 h-0.5 bg-gray-200">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: step === 2 ? "100%" : "0%" }}
        />
      </div>
      <div className={cn("flex items-center gap-2")}>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
          step === 2
            ? "bg-blue-600 border-blue-600 text-white"
            : "border-gray-300 text-gray-400 bg-white"
        )}>
          2
        </div>
        <span className={cn("text-xs sm:text-sm font-medium", step === 2 ? "text-blue-700" : "text-gray-400")}>
          <span className="hidden sm:inline">Skor </span>I-NEED-HELP
        </span>
      </div>
    </div>
  );
}

function CheckboxField({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
        checked
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        {hint && <span className="text-xs text-gray-500 mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

export default function NewTriagePage() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [criteria, setCriteria] = useState<TriageCriteria>(defaultCriteria);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);

  useEffect(() => {
    if (!isLoading && !doctor) router.replace("/login");
  }, [doctor, isLoading, router]);

  if (isLoading || !doctor) return null;

  const updateProfile = (key: keyof ProfileData, value: string | boolean) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setErrors([]);
  };

  // Saat pilar GDMT dicentang, alasan "tidak diberikan" (dan teks Lainnya)
  // ikut dikosongkan supaya tidak ada data kontradiktif.
  const updateGdmtPillar = (
    flagKey: "onAceArni" | "onBb" | "onMra" | "onSglt2i",
    reasonKey: "noAceArniReason" | "noBbReason" | "noMraReason" | "noSglt2iReason",
    given: boolean
  ) => {
    setProfile((p) => ({
      ...p,
      [flagKey]: given,
      [reasonKey]: given ? "" : p[reasonKey],
      [`${reasonKey}Other`]: given ? "" : p[`${reasonKey}Other`],
    }));
    setErrors([]);
  };

  // Teks "Lainnya" hanya relevan bila alasannya OTHER — pindah kategori
  // langsung mengosongkan teksnya.
  const updateGdmtReason = (
    reasonKey: "noAceArniReason" | "noBbReason" | "noMraReason" | "noSglt2iReason",
    r: "" | GdmtOmissionReason
  ) => {
    setProfile((p) => ({
      ...p,
      [reasonKey]: r,
      [`${reasonKey}Other`]: r === "OTHER" ? p[`${reasonKey}Other`] : "",
    }));
    setErrors([]);
  };

  const validateStep1 = (): boolean => {
    const errs: string[] = [];
    if (!profile.patientInitial.trim()) errs.push("Inisial pasien wajib diisi");
    if (!profile.age || Number(profile.age) < 1) errs.push("Usia wajib diisi");
    if (!profile.gender) errs.push("Jenis kelamin wajib dipilih");
    if (!profile.systolicBp || Number(profile.systolicBp) < 50)
      errs.push("Tekanan darah sistolik wajib diisi (min 50 mmHg)");
    if (!profile.diastolicBp || Number(profile.diastolicBp) < 20)
      errs.push("Tekanan darah diastolik wajib diisi");
    if (!profile.heartRate || Number(profile.heartRate) < 20)
      errs.push("Detak jantung wajib diisi");
    setErrors(errs);
    return errs.length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const buildPatientPayload = (): PendingPatientPayload => ({
    patientInitial: profile.patientInitial.toUpperCase().trim(),
    age: Number(profile.age),
    gender: profile.gender as "M" | "F",
    systolicBp: Number(profile.systolicBp),
    diastolicBp: Number(profile.diastolicBp),
    heartRate: Number(profile.heartRate),
    lvef: profile.lvef ? Number(profile.lvef) : null,
    egfr: profile.egfr ? Number(profile.egfr) : null,
    ntProbnp: profile.ntProbnp ? Number(profile.ntProbnp) : null,
    comorbidDm: profile.comorbidDm,
    comorbidHtn: profile.comorbidHtn,
    comorbidCkd: profile.comorbidCkd,
    comorbidAf: profile.comorbidAf,
    onAceArni: profile.onAceArni,
    onBb: profile.onBb,
    onMra: profile.onMra,
    onSglt2i: profile.onSglt2i,
    noAceArniReason: profile.onAceArni ? null : profile.noAceArniReason || null,
    noBbReason: profile.onBb ? null : profile.noBbReason || null,
    noMraReason: profile.onMra ? null : profile.noMraReason || null,
    noSglt2iReason: profile.onSglt2i ? null : profile.noSglt2iReason || null,
    noAceArniReasonOther:
      !profile.onAceArni && profile.noAceArniReason === "OTHER"
        ? profile.noAceArniReasonOther.trim() || null
        : null,
    noBbReasonOther:
      !profile.onBb && profile.noBbReason === "OTHER"
        ? profile.noBbReasonOther.trim() || null
        : null,
    noMraReasonOther:
      !profile.onMra && profile.noMraReason === "OTHER"
        ? profile.noMraReasonOther.trim() || null
        : null,
    noSglt2iReasonOther:
      !profile.onSglt2i && profile.noSglt2iReason === "OTHER"
        ? profile.noSglt2iReasonOther.trim() || null
        : null,
    nyhaClass: profile.nyhaClass || null,
    hfOnset: profile.hfOnset || null,
    edDisposition: profile.edDisposition || null,
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const payload = buildPatientPayload();
    // Kalau koneksi putus di antara dua request, pasien mungkin sudah
    // tersimpan — catat id-nya supaya antrean offline tidak membuat dobel.
    let createdPatientId: string | null = null;
    try {
      const patientRes = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!patientRes.ok) throw new Error("Gagal menyimpan data pasien");
      const patient = await patientRes.json();
      createdPatientId = patient.id;

      const triageRes = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, criteria }),
      });
      if (!triageRes.ok) throw new Error("Gagal menyimpan data triase");
      const triage = await triageRes.json();

      router.push(`/triage/${triage.id}/result`);
    } catch (err) {
      if (isNetworkError(err)) {
        // Tidak ada sinyal: antre di perangkat, hasil skoring tetap tampil.
        try {
          await enqueuePendingTriage({
            patient: createdPatientId ? null : payload,
            patientId: createdPatientId,
            criteria,
          });
          setSavedOffline(true);
        } catch {
          setSubmitError(
            "Tidak ada koneksi dan penyimpanan offline gagal. Catat hasil secara manual, lalu coba lagi."
          );
        }
      } else {
        setSubmitError("Gagal menyimpan ke server. Silakan coba lagi.");
      }
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setProfile(defaultProfile);
    setCriteria(defaultCriteria);
    setSavedOffline(false);
    setSubmitError(null);
    setStep(1);
    window.scrollTo(0, 0);
  };

  const score = calculateTriageScore(criteria);

  // Hasil offline: skoring dihitung di perangkat (logika sama dengan server),
  // data menunggu sinkronisasi. Keputusan klinis tetap keluar <1 menit.
  if (savedOffline) {
    const result = getTriageResult(criteria);
    const isRefer = result.isUrgent;
    const metKeys = (
      Object.entries(criteria) as [keyof TriageCriteria, boolean][]
    )
      .filter(([, v]) => v)
      .map(([k]) => k);

    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="pt-14">
          <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
            <Card className="border-amber-200 bg-amber-50 shadow-sm border-0 ring-1 ring-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📡</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Tersimpan di perangkat — menunggu sinkronisasi
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Tidak ada koneksi internet. Data triase ini aman tersimpan di
                      perangkat dan akan terkirim otomatis ke registri begitu sinyal
                      kembali. Tidak perlu mengisi ulang.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "border-0 shadow-lg overflow-hidden",
                isRefer ? "ring-2 ring-red-400" : "ring-2 ring-green-400"
              )}
            >
              <div
                className={cn(
                  "p-6 text-center",
                  isRefer
                    ? "bg-gradient-to-br from-red-500 to-red-700"
                    : "bg-gradient-to-br from-green-500 to-green-700"
                )}
              >
                <p className="text-white/80 text-sm font-medium mb-1">
                  Rekomendasi Klinis
                </p>
                <h1 className="text-2xl font-black text-white mb-2">
                  {isRefer ? "RUJUK KE FASKES LANJUT" : "LANJUTKAN GDMT"}
                </h1>
                <p className="text-white/90 text-sm max-w-xs mx-auto">
                  {isRefer
                    ? "Pasien menunjukkan tanda perburukan gagal jantung. Evaluasi spesialis diperlukan."
                    : "Kondisi pasien stabil. Optimalkan terapi medikamentosa sesuai panduan PERKI."}
                </p>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Skor I-NEED-HELP</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900">
                        {result.score}
                      </span>
                      <span className="text-sm text-gray-400">/ 9</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Pasien</p>
                    <p className="text-lg font-bold text-gray-900">
                      {profile.patientInitial.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {profile.age}th • {profile.gender === "M" ? "Laki-laki" : "Perempuan"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {metKeys.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Kriteria Perburukan yang Terpenuhi ({metKeys.length})
                  </p>
                  <div className="space-y-2">
                    {metKeys.map((k) => {
                      const info = TRIAGE_CRITERIA_LABELS[k];
                      return (
                        <div key={k} className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black shrink-0 mt-0.5">
                            {info.key}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-red-800">{info.label}</p>
                            <p className="text-xs text-red-600 mt-0.5">{info.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Anjuran Klinis (Berdasarkan Panduan PERKI)
                </p>
                <div className="space-y-2.5">
                  {(isRefer ? REFER_RECOMMENDATIONS : CONTINUE_RECOMMENDATIONS).map((r, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-lg">{r.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{r.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button size="xl" className="w-full" onClick={resetForm}>
              Triase Baru
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-xl mx-auto px-4 py-6">
          <div className="mb-4">
            <button
              onClick={() => (step === 1 ? router.back() : setStep(1))}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? "Kembali" : "Kembali ke Tahap 1"}
            </button>
            <h1 className="text-xl font-bold text-gray-900">Triase Baru</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {step === 1 ? "Masukkan data profil dan kondisi pasien" : "Centang kriteria perburukan yang ada"}
            </p>
          </div>

          <Progress value={step === 1 ? 30 : 90} className="mb-5 h-1.5" />
          <StepIndicator step={step} />

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-semibold text-red-700">Mohon lengkapi data berikut:</p>
                  </div>
                  <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {/* Identitas */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Identitas Pasien</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="initial">Inisial Pasien *</Label>
                      <Input
                        id="initial"
                        placeholder="misal: BW"
                        value={profile.patientInitial}
                        onChange={(e) => updateProfile("patientInitial", e.target.value.toUpperCase())}
                        maxLength={4}
                        className="uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="age">Usia (tahun) *</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="65"
                        min={1}
                        max={120}
                        value={profile.age}
                        onChange={(e) => updateProfile("age", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Jenis Kelamin *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["M", "F"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => updateProfile("gender", g)}
                          className={cn(
                            "py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                            profile.gender === g
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          )}
                        >
                          {g === "M" ? "Laki-laki (L)" : "Perempuan (P)"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>
                      Kelas Fungsional NYHA{" "}
                      <span className="text-gray-400 font-normal">(opsional)</span>
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {NYHA_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            updateProfile("nyhaClass", profile.nyhaClass === opt.value ? "" : opt.value)
                          }
                          className={cn(
                            "py-2 px-1.5 rounded-lg border-2 text-center transition-all",
                            profile.nyhaClass === opt.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          )}
                        >
                          <span className="text-sm font-bold block">{opt.value}</span>
                          <span className="text-[10px] leading-tight block mt-0.5 opacity-80">
                            {opt.caption}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>
                      Onset Gagal Jantung{" "}
                      <span className="text-gray-400 font-normal">(opsional)</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {HF_ONSET_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            updateProfile("hfOnset", profile.hfOnset === opt.value ? "" : opt.value)
                          }
                          className={cn(
                            "py-2 px-1.5 rounded-lg border-2 text-center transition-all",
                            profile.hfOnset === opt.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          )}
                        >
                          <span className="text-sm font-bold block">{opt.label}</span>
                          <span className="text-[10px] leading-tight block mt-0.5 opacity-80">
                            {opt.caption}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* TTV */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <HeartPulse className="w-4 h-4 text-red-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Tanda-Tanda Vital</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="sbp">Sistolik (mmHg) *</Label>
                      <Input
                        id="sbp"
                        type="number"
                        placeholder="120"
                        value={profile.systolicBp}
                        onChange={(e) => updateProfile("systolicBp", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="dbp">Diastolik (mmHg) *</Label>
                      <Input
                        id="dbp"
                        type="number"
                        placeholder="80"
                        value={profile.diastolicBp}
                        onChange={(e) => updateProfile("diastolicBp", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="hr">Detak Jantung (bpm) *</Label>
                      <Input
                        id="hr"
                        type="number"
                        placeholder="72"
                        value={profile.heartRate}
                        onChange={(e) => updateProfile("heartRate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lvef">LVEF (%) <span className="text-gray-400 font-normal">opsional</span></Label>
                      <Input
                        id="lvef"
                        type="number"
                        placeholder="45"
                        min={5}
                        max={80}
                        value={profile.lvef}
                        onChange={(e) => updateProfile("lvef", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Komorbid */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Komorbiditas</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <CheckboxField id="dm" label="Diabetes Melitus" checked={profile.comorbidDm} onChange={(v) => updateProfile("comorbidDm", v)} />
                    <CheckboxField id="htn" label="Hipertensi" checked={profile.comorbidHtn} onChange={(v) => updateProfile("comorbidHtn", v)} />
                    <CheckboxField id="ckd" label="CKD / Gagal Ginjal" checked={profile.comorbidCkd} onChange={(v) => updateProfile("comorbidCkd", v)} />
                    <CheckboxField id="af" label="Atrial Fibrilasi" checked={profile.comorbidAf} onChange={(v) => updateProfile("comorbidAf", v)} />
                  </div>
                </CardContent>
              </Card>

              {/* Lab */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FlaskConical className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Data Lab <span className="text-gray-400 font-normal">(opsional)</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="egfr">eGFR / Kreatinin (mL/min)</Label>
                      <Input
                        id="egfr"
                        type="number"
                        placeholder="60"
                        value={profile.egfr}
                        onChange={(e) => updateProfile("egfr", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="bnp">NT-proBNP (pg/mL)</Label>
                      <Input
                        id="bnp"
                        type="number"
                        placeholder="1200"
                        value={profile.ntProbnp}
                        onChange={(e) => updateProfile("ntProbnp", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* GDMT */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Status GDMT Saat Ini</h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed -mt-1">
                    Centang seluruh terapi GDMT yang sedang diterima pasien — termasuk yang
                    diinisiasi selama perawatan di IGD maupun yang diberikan atas advis konsultasi
                    dari IGD untuk rawat inap. Untuk pilar yang <strong>tidak</strong> diberikan,
                    pilih alasannya bila diketahui (opsional).
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <GdmtPillarField id="ace" label="ACE-I / ARB / ARNI" hint="ACE-I: captopril, ramipril, lisinopril · ARB: telmisartan, candesartan, valsartan · ARNI: sacubitril/valsartan" checked={profile.onAceArni} reason={profile.noAceArniReason} reasonOther={profile.noAceArniReasonOther} onCheckedChange={(v) => updateGdmtPillar("onAceArni", "noAceArniReason", v)} onReasonChange={(r) => updateGdmtReason("noAceArniReason", r)} onReasonOtherChange={(t) => updateProfile("noAceArniReasonOther", t)} />
                    <GdmtPillarField id="bb" label="Beta-Blocker" hint="Contoh: bisoprolol, carvedilol, metoprolol suksinat" checked={profile.onBb} reason={profile.noBbReason} reasonOther={profile.noBbReasonOther} onCheckedChange={(v) => updateGdmtPillar("onBb", "noBbReason", v)} onReasonChange={(r) => updateGdmtReason("noBbReason", r)} onReasonOtherChange={(t) => updateProfile("noBbReasonOther", t)} />
                    <GdmtPillarField id="mra" label="MRA / Aldosterone Antagonist" hint="Contoh: spironolakton" checked={profile.onMra} reason={profile.noMraReason} reasonOther={profile.noMraReasonOther} onCheckedChange={(v) => updateGdmtPillar("onMra", "noMraReason", v)} onReasonChange={(r) => updateGdmtReason("noMraReason", r)} onReasonOtherChange={(t) => updateProfile("noMraReasonOther", t)} />
                    <GdmtPillarField id="sglt2" label="SGLT2 Inhibitor" hint="Contoh: dapagliflozin, empagliflozin" checked={profile.onSglt2i} reason={profile.noSglt2iReason} reasonOther={profile.noSglt2iReasonOther} onCheckedChange={(v) => updateGdmtPillar("onSglt2i", "noSglt2iReason", v)} onReasonChange={(r) => updateGdmtReason("noSglt2iReason", r)} onReasonOtherChange={(t) => updateProfile("noSglt2iReasonOther", t)} />
                  </div>
                </CardContent>
              </Card>

              {(() => {
                const warnings = getVitalsWarnings({
                  age: Number(profile.age) || null,
                  systolicBp: Number(profile.systolicBp) || null,
                  diastolicBp: Number(profile.diastolicBp) || null,
                  heartRate: Number(profile.heartRate) || null,
                  lvef: Number(profile.lvef) || null,
                  egfr: Number(profile.egfr) || null,
                  ntProbnp: Number(profile.ntProbnp) || null,
                });
                if (warnings.length === 0) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-amber-800 mb-1">
                      ⚠️ Periksa kembali — nilai di luar rentang wajar:
                    </p>
                    <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
                      {warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-amber-600 mt-1.5">
                      Jika nilai memang benar, Anda tetap bisa melanjutkan.
                    </p>
                  </div>
                );
              })()}

              <Button onClick={handleNext} size="xl" className="w-full">
                Lanjut ke Skor I-NEED-HELP
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
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

              {/* Disposisi akhir IGD — opsional, nol beban follow-up */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Disposisi Akhir IGD{" "}
                      <span className="font-normal text-gray-400">(opsional)</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Apa yang <strong>benar-benar terjadi</strong> pada pasien di akhir
                      kunjungan IGD ini — bisa berbeda dari rekomendasi skor. Rekomendasi
                      &quot;Rujuk&quot; artinya pasien perlu perawatan lanjut: di RS yang sudah
                      mampu (mis. RS rujukan Tipe A/B) wujudnya <strong>Rawat Inap</strong> di
                      RS sendiri; pilihan <strong>Dirujuk</strong> hanya bila pasien
                      benar-benar dikirim ke faskes lain. Dapat diisi sekarang atau
                      dilengkapi kemudian melalui Edit Data.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ED_DISPOSITION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          updateProfile(
                            "edDisposition",
                            profile.edDisposition === opt.value ? "" : opt.value
                          )
                        }
                        className={cn(
                          "flex items-start gap-2 p-3 rounded-lg border-2 text-left transition-all",
                          profile.edDisposition === opt.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        <span className="text-base">{opt.icon}</span>
                        <span className="flex flex-col">
                          <span
                            className={cn(
                              "text-xs font-medium",
                              profile.edDisposition === opt.value ? "text-blue-800" : "text-gray-700"
                            )}
                          >
                            {opt.label}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] leading-snug mt-0.5",
                              profile.edDisposition === opt.value ? "text-blue-600" : "text-gray-400"
                            )}
                          >
                            {opt.desc}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{submitError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Kembali
                </Button>
                <Button
                  size="lg"
                  className="flex-[2]"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Memproses..." : "Lihat Hasil Triase"}
                  <CheckSquare className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
