"use client";

import { useState } from "react";
import Link from "next/link";
import { HeartPulse, AlertCircle, CheckCircle, Shield, ChevronDown, ChevronUp } from "lucide-react";
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
    institutionName: "",
  });
  const [consent, setConsent] = useState(false);
  const [consentExpanded, setConsentExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Anda harus menyetujui pernyataan persetujuan untuk mendaftar.");
      return;
    }
    if (!form.institutionType) {
      setError("Pilih jenis fasilitas kesehatan terlebih dahulu.");
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

              {/* Institution */}
              <div className="space-y-2">
                <Label>Fasilitas Kesehatan</Label>
                <Select
                  value={form.institutionType}
                  onValueChange={(v) => setForm({ ...form, institutionType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Jenis faskes..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Puskesmas">Puskesmas</SelectItem>
                    <SelectItem value="Klinik Pratama">Klinik Pratama</SelectItem>
                    <SelectItem value="RS Tipe C">RS Tipe C</SelectItem>
                    <SelectItem value="RS Tipe B">RS Tipe B</SelectItem>
                    <SelectItem value="RS Tipe A / Pusat">RS Tipe A / Pusat</SelectItem>
                    <SelectItem value="IGD / Unit Gawat Darurat">IGD / Unit Gawat Darurat</SelectItem>
                    <SelectItem value="Klinik Spesialis">Klinik Spesialis</SelectItem>
                    <SelectItem value="Faskes Lainnya">Faskes Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="institutionName"
                  placeholder="Nama lengkap faskes (mis. Puskesmas Cikupa, Tangerang)"
                  value={form.institutionName}
                  onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
                />
                <p className="text-xs text-gray-400">
                  Nama spesifik faskes untuk keperluan identifikasi data registri
                </p>
              </div>

              {/* Informed Consent & Regulatory Compliance */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consent"
                      checked={consent}
                      onCheckedChange={(v) => setConsent(!!v)}
                      className="mt-0.5 shrink-0"
                    />
                    <label htmlFor="consent" className="text-xs text-amber-900 cursor-pointer leading-relaxed font-medium">
                      Saya menyatakan persetujuan atas penggunaan platform ini sesuai ketentuan
                      regulasi yang berlaku.
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConsentExpanded(!consentExpanded)}
                    className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold mt-2 ml-6 hover:underline"
                  >
                    {consentExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Sembunyikan detail persetujuan
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Baca pernyataan lengkap (wajib dibaca sebelum mendaftar)
                      </>
                    )}
                  </button>
                </div>

                {consentExpanded && (
                  <div className="border-t border-amber-200 bg-white px-4 py-3 text-[11px] text-gray-700 space-y-3 max-h-56 overflow-y-auto">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <p className="font-bold text-gray-900 text-xs">
                        Pernyataan Persetujuan &amp; Kepatuhan Regulasi
                      </p>
                    </div>

                    <p className="text-gray-600">
                      Dengan mendaftar pada platform{" "}
                      <strong>I-NEED-HELP Clinical Registry</strong>, Anda selaku tenaga
                      kesehatan yang berwenang menyatakan memahami dan menyetujui hal-hal
                      berikut:
                    </p>

                    <div className="space-y-2.5">
                      <div>
                        <p className="font-semibold text-gray-800">
                          1. Perlindungan Data Pribadi (UU PDP No. 27/2022)
                        </p>
                        <p className="text-gray-600 mt-0.5">
                          Data yang dimasukkan berupa <em>data pseudoanonim</em> (inisial, usia,
                          parameter klinis) tanpa identitas langsung pasien (nama lengkap, NIK,
                          alamat). Sesuai UU Perlindungan Data Pribadi No. 27 Tahun 2022, Anda
                          bertanggung jawab memperoleh persetujuan pasien (informed consent)
                          sebelum memasukkan data klinis ke dalam sistem.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-800">
                          2. Etika Penelitian — ICH E6(R3) Good Clinical Practice
                        </p>
                        <p className="text-gray-600 mt-0.5">
                          Platform ini dirancang mengikuti panduan{" "}
                          <em>Good Clinical Practice</em> ICH E6(R3). Data registri digunakan
                          semata-mata untuk keperluan ilmiah, tidak diperjualbelikan, dan
                          diproses sesuai protokol etik penelitian yang telah disetujui komite
                          etik terkait. Integritas data, kerahasiaan subjek, dan audit trail
                          dijaga sesuai standar GCP.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-800">
                          3. Rekam Medis Elektronik (Permenkes No. 24/2022)
                        </p>
                        <p className="text-gray-600 mt-0.5">
                          Sistem ini bukan pengganti rekam medis resmi. Pengelolaan rekam medis
                          pasien tetap mengacu pada Peraturan Menteri Kesehatan RI No. 24 Tahun
                          2022 tentang Rekam Medis, yang merupakan tanggung jawab fasilitas
                          kesehatan masing-masing.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-800">
                          4. Penyelenggara Sistem Elektronik (Permenkominfo No. 5/2020)
                        </p>
                        <p className="text-gray-600 mt-0.5">
                          Platform ini beroperasi sesuai ketentuan Penyelenggara Sistem
                          Elektronik (PSE) dalam Peraturan Menteri Komunikasi dan Informatika
                          No. 5 Tahun 2020. Data disimpan di infrastruktur cloud yang memenuhi
                          standar keamanan informasi yang berlaku di Indonesia.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-800">5. Hak Subjek Data</p>
                        <p className="text-gray-600 mt-0.5">
                          Sesuai UU PDP, subjek data memiliki hak untuk mengakses, mengoreksi,
                          dan meminta penghapusan data mereka. Permintaan tersebut dapat
                          diajukan melalui koordinasi dengan dokter atau peneliti yang
                          bertanggung jawab.
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-800">
                          6. Batasan Penggunaan Klinis
                        </p>
                        <p className="text-gray-600 mt-0.5">
                          Hasil triase I-NEED-HELP bersifat <em>clinical decision support</em>,
                          bukan pengganti penilaian klinis dokter. Keputusan tata laksana pasien
                          sepenuhnya merupakan tanggung jawab dokter yang memeriksa.
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-500 border-t border-gray-100 pt-2">
                      Dengan mencentang kotak persetujuan, Anda menyatakan telah membaca,
                      memahami, dan menyetujui seluruh ketentuan di atas sebagaimana diatur
                      dalam UU No. 27/2022 (UU PDP), ICH E6(R3) GCP, Permenkes No. 24/2022,
                      dan Permenkominfo No. 5/2020.
                    </p>
                  </div>
                )}

                {consent && (
                  <div className="flex items-center gap-1.5 px-3 py-2 border-t border-amber-200 text-xs text-green-700 font-semibold bg-green-50">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    Persetujuan diberikan — data akan diproses sesuai regulasi yang berlaku
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

        <p className="text-center text-[10px] text-gray-400 mt-3 leading-relaxed px-4">
          Platform ini tunduk pada UU PDP No. 27/2022, Permenkes No. 24/2022,
          Permenkominfo No. 5/2020, dan prinsip ICH E6(R3) Good Clinical Practice.
        </p>
      </div>
    </div>
  );
}
