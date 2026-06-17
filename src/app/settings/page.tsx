"use client";

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  User,
  FileText,
  ExternalLink,
  ClipboardCheck,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { doctor, logout } = useAuth();
  const router = useRouter();
  const [deletePhase, setDeletePhase] = useState<"idle" | "confirm" | "typing" | "deleting">("idle");
  const [confirmText, setConfirmText] = useState("");

  // Ethical clearance state
  const [ecNo, setEcNo] = useState(doctor?.ethicalClearanceNo ?? "");
  const [ecDate, setEcDate] = useState(doctor?.ethicalClearanceDate ?? "");
  const [ecSaving, setEcSaving] = useState(false);
  const [ecSaved, setEcSaved] = useState(false);

  if (!doctor) {
    router.replace("/login");
    return null;
  }

  const handleSaveEc = async () => {
    setEcSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ethicalClearanceNo: ecNo.trim() || null,
        ethicalClearanceDate: ecDate.trim() || null,
      }),
    });
    setEcSaving(false);
    setEcSaved(true);
    setTimeout(() => setEcSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "HAPUS AKUN SAYA") return;
    setDeletePhase("deleting");
    try {
      await fetch("/api/account", { method: "DELETE" });
      await logout();
    } catch {
      setDeletePhase("typing");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-md mx-auto px-4 py-6 space-y-5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>

          <h1 className="text-xl font-bold text-gray-900">Pengaturan Akun</h1>

          {/* Profile info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div>
                <p className="text-xs text-gray-500">Nama</p>
                <p className="text-sm font-semibold text-gray-900">{doctor.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-700">{doctor.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fasilitas Kesehatan</p>
                <p className="text-sm text-gray-700">{doctor.institutionType || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Peran</p>
                <p className="text-sm text-gray-700">{doctor.role}</p>
              </div>
            </CardContent>
          </Card>

          {/* Legal */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                Regulasi &amp; Privasi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Link
                href="/privacy-policy"
                className="flex items-center justify-between py-2 text-sm text-gray-700 hover:text-blue-600"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Kebijakan Privasi
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>
              <div className="border-t border-gray-100" />
              <Link
                href="/terms"
                className="flex items-center justify-between py-2 text-sm text-gray-700 hover:text-blue-600"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Syarat &amp; Ketentuan
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </Link>
              <div className="border-t border-gray-100" />
              <div className="py-2">
                <p className="text-xs text-gray-500">
                  Hak hapus data (UU PDP No. 27/2022):{" "}
                  <a
                    href="mailto:dpo@ineedhelp-registry.id"
                    className="text-blue-600 hover:underline"
                  >
                    dpo@ineedhelp-registry.id
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ethical Clearance */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-gray-500" />
                Kode Etik Penelitian
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-semibold mb-0.5">Dapat diisi retroaktif</p>
                <p>
                  Nomor ethical clearance boleh dikosongkan dulu dan diisi nanti setelah data
                  terkumpul, saat akan submit ke jurnal atau konferensi. Puskesmas yang tidak
                  punya komite etik dapat mengajukan ke FK/FKM universitas atau RSUD terdekat.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ec-no">Nomor Ethical Clearance</Label>
                <Input
                  id="ec-no"
                  placeholder="mis. 123/KEPK-FK/2025"
                  value={ecNo}
                  onChange={(e) => { setEcNo(e.target.value); setEcSaved(false); }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ec-date">Tanggal Terbit EC</Label>
                <Input
                  id="ec-date"
                  type="date"
                  value={ecDate}
                  onChange={(e) => { setEcDate(e.target.value); setEcSaved(false); }}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleSaveEc}
                  disabled={ecSaving}
                >
                  {ecSaving ? "Menyimpan..." : "Simpan"}
                </Button>
                {ecSaved && (
                  <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Tersimpan
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delete account */}
          <Card className="border-red-200 ring-1 ring-red-100 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                <Trash2 className="w-4 h-4" />
                Hapus Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <p className="text-xs text-gray-600">
                Menghapus akun akan menghapus <strong>seluruh data klinis pasien</strong> yang
                terkait dengan akun ini secara permanen. Tindakan ini tidak dapat dibatalkan.
              </p>

              {deletePhase === "idle" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={() => setDeletePhase("confirm")}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Hapus Akun Saya
                </Button>
              )}

              {deletePhase === "confirm" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-800 font-semibold">
                      Apakah Anda yakin? Semua data pasien, triase, dan follow-up akan dihapus
                      secara permanen.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletePhase("idle")}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => setDeletePhase("typing")}
                    >
                      Ya, lanjutkan
                    </Button>
                  </div>
                </div>
              )}

              {(deletePhase === "typing" || deletePhase === "deleting") && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm" className="text-xs">
                      Ketik <strong>HAPUS AKUN SAYA</strong> untuk konfirmasi:
                    </Label>
                    <Input
                      id="confirm"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="HAPUS AKUN SAYA"
                      className="text-sm border-red-200 focus:border-red-400"
                      disabled={deletePhase === "deleting"}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setDeletePhase("idle"); setConfirmText(""); }}
                      disabled={deletePhase === "deleting"}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                      disabled={confirmText !== "HAPUS AKUN SAYA" || deletePhase === "deleting"}
                      onClick={handleDeleteAccount}
                    >
                      {deletePhase === "deleting" ? "Menghapus..." : "Hapus Permanen"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
