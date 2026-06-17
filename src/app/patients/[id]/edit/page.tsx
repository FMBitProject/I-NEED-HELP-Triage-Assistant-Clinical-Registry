"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  User,
  HeartPulse,
  FlaskConical,
  Pill,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface EditFormData {
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
  nyhaClass: "" | "I" | "II" | "III" | "IV";
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
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
      <span className="text-sm font-medium text-gray-800">{label}</span>
    </label>
  );
}

export default function EditPatientPage() {
  const { id } = useParams<{ id: string }>();
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<EditFormData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
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
        const p = data.patient;
        setForm({
          patientInitial: p.patientInitial ?? "",
          age: p.age != null ? String(p.age) : "",
          gender: p.gender ?? "",
          systolicBp: p.systolicBp != null ? String(p.systolicBp) : "",
          diastolicBp: p.diastolicBp != null ? String(p.diastolicBp) : "",
          heartRate: p.heartRate != null ? String(p.heartRate) : "",
          lvef: p.lvef != null ? String(p.lvef) : "",
          egfr: p.egfr != null ? String(p.egfr) : "",
          ntProbnp: p.ntProbnp != null ? String(p.ntProbnp) : "",
          comorbidDm: p.comorbidDm ?? false,
          comorbidHtn: p.comorbidHtn ?? false,
          comorbidCkd: p.comorbidCkd ?? false,
          comorbidAf: p.comorbidAf ?? false,
          onAceArni: p.onAceArni ?? false,
          onBb: p.onBb ?? false,
          onMra: p.onMra ?? false,
          onSglt2i: p.onSglt2i ?? false,
          nyhaClass: (p.nyhaClass as "" | "I" | "II" | "III" | "IV") ?? "",
        });
      });
  }, [id, doctor, router]);

  if (isLoading || !doctor || !form) return null;

  const update = (key: keyof EditFormData, value: string | boolean) => {
    setForm((f) => f ? { ...f, [key]: value } : f);
    setErrors([]);
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!form.patientInitial.trim()) errs.push("Inisial pasien wajib diisi");
    if (!form.age || Number(form.age) < 1) errs.push("Usia wajib diisi");
    if (!form.gender) errs.push("Jenis kelamin wajib dipilih");
    if (!form.systolicBp || Number(form.systolicBp) < 50)
      errs.push("Tekanan darah sistolik wajib diisi (min 50 mmHg)");
    if (!form.diastolicBp || Number(form.diastolicBp) < 20)
      errs.push("Tekanan darah diastolik wajib diisi");
    if (!form.heartRate || Number(form.heartRate) < 20)
      errs.push("Detak jantung wajib diisi");
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientInitial: form.patientInitial.toUpperCase().trim(),
          age: Number(form.age),
          gender: form.gender,
          systolicBp: Number(form.systolicBp),
          diastolicBp: Number(form.diastolicBp),
          heartRate: Number(form.heartRate),
          lvef: form.lvef ? Number(form.lvef) : null,
          egfr: form.egfr ? Number(form.egfr) : null,
          ntProbnp: form.ntProbnp ? Number(form.ntProbnp) : null,
          comorbidDm: form.comorbidDm,
          comorbidHtn: form.comorbidHtn,
          comorbidCkd: form.comorbidCkd,
          comorbidAf: form.comorbidAf,
          onAceArni: form.onAceArni,
          onBb: form.onBb,
          onMra: form.onMra,
          onSglt2i: form.onSglt2i,
          nyhaClass: form.nyhaClass || null,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      router.push(`/patients/${id}`);
    } catch {
      setSubmitting(false);
    }
  };

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
            <h1 className="text-xl font-bold text-gray-900">Edit Data Pasien</h1>
            <p className="text-sm text-gray-500 mt-0.5">Perbarui informasi profil pasien</p>
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
                      value={form.patientInitial}
                      onChange={(e) => update("patientInitial", e.target.value.toUpperCase())}
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
                      value={form.age}
                      onChange={(e) => update("age", e.target.value)}
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
                        onClick={() => update("gender", g)}
                        className={cn(
                          "py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                          form.gender === g
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
                  <div className="grid grid-cols-4 gap-2">
                    {(["I", "II", "III", "IV"] as const).map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => update("nyhaClass", form.nyhaClass === cls ? "" : cls)}
                        className={cn(
                          "py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                          form.nyhaClass === cls
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        )}
                      >
                        {cls}
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
                      value={form.systolicBp}
                      onChange={(e) => update("systolicBp", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dbp">Diastolik (mmHg) *</Label>
                    <Input
                      id="dbp"
                      type="number"
                      placeholder="80"
                      value={form.diastolicBp}
                      onChange={(e) => update("diastolicBp", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hr">Detak Jantung (bpm) *</Label>
                    <Input
                      id="hr"
                      type="number"
                      placeholder="72"
                      value={form.heartRate}
                      onChange={(e) => update("heartRate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lvef">
                      LVEF (%) <span className="text-gray-400 font-normal">opsional</span>
                    </Label>
                    <Input
                      id="lvef"
                      type="number"
                      placeholder="45"
                      min={5}
                      max={80}
                      value={form.lvef}
                      onChange={(e) => update("lvef", e.target.value)}
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
                  <CheckboxField id="dm" label="Diabetes Melitus" checked={form.comorbidDm} onChange={(v) => update("comorbidDm", v)} />
                  <CheckboxField id="htn" label="Hipertensi" checked={form.comorbidHtn} onChange={(v) => update("comorbidHtn", v)} />
                  <CheckboxField id="ckd" label="CKD / Gagal Ginjal" checked={form.comorbidCkd} onChange={(v) => update("comorbidCkd", v)} />
                  <CheckboxField id="af" label="Atrial Fibrilasi" checked={form.comorbidAf} onChange={(v) => update("comorbidAf", v)} />
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
                      value={form.egfr}
                      onChange={(e) => update("egfr", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bnp">NT-proBNP (pg/mL)</Label>
                    <Input
                      id="bnp"
                      type="number"
                      placeholder="1200"
                      value={form.ntProbnp}
                      onChange={(e) => update("ntProbnp", e.target.value)}
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
                <div className="grid grid-cols-1 gap-2">
                  <CheckboxField id="ace" label="ACE-I / ARB / ARNI (Ramipril, Valsartan, Sacubitril)" checked={form.onAceArni} onChange={(v) => update("onAceArni", v)} />
                  <CheckboxField id="bb" label="Beta-Blocker (Bisoprolol, Carvedilol, Metoprolol)" checked={form.onBb} onChange={(v) => update("onBb", v)} />
                  <CheckboxField id="mra" label="MRA / Aldosterone Antagonist (Spironolacton)" checked={form.onMra} onChange={(v) => update("onMra", v)} />
                  <CheckboxField id="sglt2" label="SGLT2 Inhibitor (Empagliflozin, Dapagliflozin)" checked={form.onSglt2i} onChange={(v) => update("onSglt2i", v)} />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSubmit} size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
