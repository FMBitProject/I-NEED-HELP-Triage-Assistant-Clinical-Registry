"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
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
import { EdDisposition, GdmtOmissionReason, HfOnset } from "@/lib/types";
import { HF_ONSET_OPTIONS } from "@/lib/hf-onset";
import { GdmtPillarField } from "@/components/gdmt-pillar-field";
import { ED_DISPOSITION_OPTIONS } from "@/lib/disposition";
import { enqueuePendingPatient, isNetworkError, PendingPatientPayload } from "@/lib/offline-queue";
import { getVitalsWarnings } from "@/lib/vitals";
import { cn } from "@/lib/utils";

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

/**
 * Angka dari input teks. Mengembalikan null bila kosong ATAU bukan angka —
 * `Number("abc")` menghasilkan NaN, dan NaN lolos semua perbandingan (NaN <= 0
 * selalu false), jadi pengecekan harus lewat Number.isFinite. Tanpa ini, nilai
 * tak valid akan berubah jadi null saat JSON.stringify dan ditolak server
 * dengan pesan yang membingungkan (atau gagal di kolom NOT NULL).
 */
function parseNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Server menolak dengan alasan jelas (bukan kegagalan jaringan). */
class ServerRejectionError extends Error {}

const NYHA_OPTIONS = [
  { value: "I", caption: "Tanpa gejala saat aktivitas" },
  { value: "II", caption: "Gejala saat aktivitas berat" },
  { value: "III", caption: "Gejala saat aktivitas ringan" },
  { value: "IV", caption: "Gejala saat istirahat" },
] as const;

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

export default function NewPatientPage() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
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

  const validate = (): boolean => {
    const errs: string[] = [];
    const age = parseNum(profile.age);
    const systolicBp = parseNum(profile.systolicBp);
    const diastolicBp = parseNum(profile.diastolicBp);
    const heartRate = parseNum(profile.heartRate);
    const ntProbnp = parseNum(profile.ntProbnp);
    const lvef = parseNum(profile.lvef);
    const egfr = parseNum(profile.egfr);

    if (!profile.patientInitial.trim()) errs.push("Inisial pasien wajib diisi");
    if (age === null || age < 1) errs.push("Usia wajib diisi berupa angka");
    if (!profile.gender) errs.push("Jenis kelamin wajib dipilih");
    if (systolicBp === null || systolicBp < 50)
      errs.push("Tekanan darah sistolik wajib diisi berupa angka (min 50 mmHg)");
    if (diastolicBp === null || diastolicBp < 20)
      errs.push("Tekanan darah diastolik wajib diisi berupa angka");
    if (heartRate === null || heartRate < 20)
      errs.push("Detak jantung wajib diisi berupa angka");
    if (!profile.nyhaClass) errs.push("Kelas fungsional NYHA wajib dipilih");
    if (!profile.hfOnset)
      errs.push("Onset gagal jantung wajib dipilih (pilih “Tidak Diketahui” bila riwayat tak dapat dipastikan)");
    if (ntProbnp === null || ntProbnp <= 0)
      errs.push("NT-proBNP wajib diisi berupa angka — dibutuhkan untuk konfirmasi diagnosis gagal jantung");
    // Field opsional: boleh kosong, tapi kalau diisi harus angka — jangan
    // sampai ketikan tak valid diam-diam terkirim sebagai null.
    if (profile.lvef.trim() !== "" && lvef === null)
      errs.push("LVEF harus berupa angka (atau kosongkan)");
    if (profile.egfr.trim() !== "" && egfr === null)
      errs.push("eGFR harus berupa angka (atau kosongkan)");

    setErrors(errs);
    return errs.length === 0;
  };

  // clientRequestId dibuat sekali per submit dan ikut tersimpan di antrean
  // offline, sehingga kirim ulang otomatis tidak membuat pasien dobel.
  const buildPatientPayload = (): PendingPatientPayload => ({
    clientRequestId: crypto.randomUUID(),
    patientInitial: profile.patientInitial.toUpperCase().trim(),
    age: parseNum(profile.age) as number,
    gender: profile.gender as "M" | "F",
    systolicBp: parseNum(profile.systolicBp) as number,
    diastolicBp: parseNum(profile.diastolicBp) as number,
    heartRate: parseNum(profile.heartRate) as number,
    lvef: parseNum(profile.lvef),
    egfr: parseNum(profile.egfr),
    ntProbnp: parseNum(profile.ntProbnp),
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
    if (!validate()) {
      window.scrollTo(0, 0);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const payload = buildPatientPayload();
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        // Tampilkan alasan asli dari server (mis. "NT-proBNP wajib diisi")
        // alih-alih pesan generik — tanpa ini dokter mengulang terus tanpa
        // tahu field mana yang bermasalah.
        let reason = "Gagal menyimpan data pasien.";
        try {
          const body = await res.json();
          if (body && typeof body.error === "string") reason = body.error;
        } catch {
          // Body bukan JSON — pakai pesan generik.
        }
        throw new ServerRejectionError(reason);
      }
      const patient = await res.json();
      router.push(`/patients/${patient.id}`);
    } catch (err) {
      // Penolakan server dicek lebih dulu: kalau tidak, request yang ditolak
      // saat navigator.onLine kebetulan false akan salah diantrekan sebagai
      // "offline" padahal server sudah menolaknya secara eksplisit.
      if (err instanceof ServerRejectionError) {
        setSubmitError(err.message);
      } else if (isNetworkError(err)) {
        // Tidak ada sinyal: antre di perangkat, sinkron otomatis nanti.
        try {
          await enqueuePendingPatient(payload);
          setSavedOffline(true);
        } catch {
          setSubmitError(
            "Tidak ada koneksi dan penyimpanan offline gagal. Catat data secara manual, lalu coba lagi."
          );
        }
      } else {
        setSubmitError("Gagal menyimpan ke server. Silakan coba lagi.");
      }
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    // TODO(minor): `submitting` sengaja tidak ikut di-reset di sini. Aman
    // sekarang karena blok catch selalu menyetelnya false sebelum layar
    // offline muncul, tapi ini jebakan laten kalau alur offline diubah.
    setProfile(defaultProfile);
    setSavedOffline(false);
    setSubmitError(null);
    window.scrollTo(0, 0);
  };

  if (savedOffline) {
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
                      Tidak ada koneksi internet. Data pasien ini aman tersimpan di
                      perangkat dan akan terkirim otomatis ke registri begitu sinyal
                      kembali. Tidak perlu mengisi ulang.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Pasien</p>
                  <p className="text-lg font-bold text-gray-900">
                    {profile.patientInitial.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {profile.age}th • {profile.gender === "M" ? "Laki-laki" : "Perempuan"}
                  </p>
                </div>
                <CheckSquare className="w-8 h-8 text-amber-500" />
              </CardContent>
            </Card>

            <Button size="xl" className="w-full" onClick={resetForm}>
              Daftarkan Pasien Lain
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
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
            <h1 className="text-xl font-bold text-gray-900">Pasien Baru</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Masukkan data profil dan kondisi pasien
            </p>
          </div>

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
                  <Label>Kelas Fungsional NYHA *</Label>
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
                  <Label>Onset Gagal Jantung *</Label>
                  <div className="grid grid-cols-3 gap-2">
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
                  <h3 className="text-sm font-semibold text-gray-900">Data Lab</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="egfr">eGFR / Kreatinin (mL/min) <span className="text-gray-400 font-normal">opsional</span></Label>
                    <Input
                      id="egfr"
                      type="number"
                      placeholder="60"
                      value={profile.egfr}
                      onChange={(e) => updateProfile("egfr", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bnp">NT-proBNP (pg/mL) *</Label>
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
                    kunjungan IGD ini. Di RS yang sudah mampu kelola mandiri (mis. RS
                    rujukan Tipe A/B) biasanya wujudnya <strong>Rawat Inap</strong> di
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

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <p className="text-xs text-red-700 font-medium">{submitError}</p>
              </div>
            )}

            <Button onClick={handleSubmit} size="xl" className="w-full" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Pasien"}
              <CheckSquare className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
