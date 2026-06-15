"use client";

import { useState } from "react";
import Link from "next/link";
import { HeartPulse, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    institutionType: "",
  });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Anda harus menyetujui persetujuan penelitian untuk mendaftar.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await register(form);
    if (!result.success) {
      setError(result.error || "Pendaftaran gagal");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 border border-red-100 mb-3">
            <HeartPulse className="w-7 h-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Daftar Akun Dokter</h1>
          <p className="text-sm text-gray-500 mt-1">I-NEED-HELP Clinical Registry</p>
        </div>

        <Card className="shadow-lg border-0 ring-1 ring-gray-100">
          <CardContent className="p-6">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Lengkap (dengan gelar)</Label>
                <Input
                  id="name"
                  placeholder="dr. Nama Lengkap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Institusi</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="dokter@puskesmas.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Jenis Fasilitas Kesehatan</Label>
                <Select
                  value={form.institutionType}
                  onValueChange={(v) => setForm({ ...form, institutionType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih faskes..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Puskesmas">Puskesmas</SelectItem>
                    <SelectItem value="Klinik Pratama">Klinik Pratama</SelectItem>
                    <SelectItem value="RS Tipe C">RS Tipe C</SelectItem>
                    <SelectItem value="RS Tipe B">RS Tipe B</SelectItem>
                    <SelectItem value="RS Tipe A / Pusat">RS Tipe A / Pusat</SelectItem>
                    <SelectItem value="IGD / Unit Gawat Darurat">IGD / Unit Gawat Darurat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Informed Consent */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(v) => setConsent(!!v)}
                    className="mt-0.5"
                  />
                  <label htmlFor="consent" className="text-xs text-amber-800 cursor-pointer leading-relaxed">
                    Saya menyetujui bahwa data klinis pasien yang dimasukkan akan{" "}
                    <strong>dikumpulkan secara anonim</strong> dan digunakan sebagai data registri
                    ilmiah sesuai protokol etik penelitian yang berlaku. Tidak ada data
                    identitas pribadi pasien yang tersimpan.
                  </label>
                </div>
                {consent && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-green-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Persetujuan penelitian diberikan
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !consent}
              >
                {loading ? "Mendaftarkan..." : "Daftar & Mulai Triase"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-4">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
