"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  ShieldAlert,
  Copy,
  Check,
  AlertTriangle,
  UserCog,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DoctorRow {
  id: string;
  name: string;
  email: string;
  institutionType: string | null;
  role: string;
  approved: boolean;
  createdAt: string;
}

type ResetState =
  | { phase: "idle" }
  | { phase: "confirm" }
  | { phase: "resetting" }
  | { phase: "done"; tempPassword: string }
  | { phase: "error"; message: string };

export default function AdminUsersPage() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [resetState, setResetState] = useState<Record<string, ResetState>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !doctor) router.replace("/login");
    if (!isLoading && doctor && doctor.role !== "ADMIN") router.replace("/dashboard");
  }, [doctor, isLoading, router]);

  useEffect(() => {
    if (doctor?.role !== "ADMIN") return;
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : []))
      .then(setDoctors)
      .finally(() => setLoadingList(false));
  }, [doctor]);

  if (isLoading || !doctor) return null;

  const stateFor = (id: string): ResetState => resetState[id] ?? { phase: "idle" };
  const setStateFor = (id: string, s: ResetState) =>
    setResetState((prev) => ({ ...prev, [id]: s }));

  const handleReset = async (id: string) => {
    setStateFor(id, { phase: "resetting" });
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setStateFor(id, { phase: "error", message: data.error || "Gagal reset password" });
        return;
      }
      setStateFor(id, { phase: "done", tempPassword: data.tempPassword });
    } catch {
      setStateFor(id, { phase: "error", message: "Gagal terhubung ke server" });
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/approve`, { method: "POST" });
      if (res.ok) {
        setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, approved: true } : d)));
      }
    } finally {
      setApprovingId(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <UserCog className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">Kelola Akun Dokter</h1>
                <Badge variant="secondary">Admin Only</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Reset password dokter yang lupa kredensial login. Belum ada sistem reset via
                email — password sementara harus disampaikan manual (WhatsApp/telepon).
              </p>
            </div>
          </div>

          {loadingList && (
            <p className="text-sm text-gray-400">Memuat daftar pengguna...</p>
          )}

          {!loadingList && doctors.length === 0 && (
            <p className="text-sm text-gray-400">Belum ada pengguna terdaftar.</p>
          )}

          <div className="space-y-3">
            {doctors.map((d) => {
              const state = stateFor(d.id);
              return (
                <Card key={d.id} className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                          {!d.approved && d.role !== "ADMIN" && (
                            <Badge variant="warning" className="gap-1">
                              <Clock3 className="w-3 h-3" />
                              Menunggu
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{d.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {d.institutionType || "—"} · {d.role}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {!d.approved && d.role !== "ADMIN" && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                            disabled={approvingId === d.id}
                            onClick={() => handleApprove(d.id)}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {approvingId === d.id ? "Menyetujui..." : "Setujui"}
                          </Button>
                        )}
                        {state.phase === "idle" && d.id !== doctor.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setStateFor(d.id, { phase: "confirm" })}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Reset Password
                          </Button>
                        )}
                      </div>
                    </div>

                    {state.phase === "confirm" && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-800">
                            Password baru akan dibuat otomatis dan sesi login {d.name} saat ini
                            akan langsung berakhir. Lanjutkan?
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setStateFor(d.id, { phase: "idle" })}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => handleReset(d.id)}
                          >
                            Ya, Reset
                          </Button>
                        </div>
                      </div>
                    )}

                    {state.phase === "resetting" && (
                      <p className="text-xs text-gray-400">Memproses reset password...</p>
                    )}

                    {state.phase === "error" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                        {state.message}
                      </div>
                    )}

                    {state.phase === "done" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-green-700 mt-0.5 shrink-0" />
                          <p className="text-xs text-green-800">
                            Password sementara untuk <strong>{d.name}</strong> — hanya tampil
                            sekali, segera kirim manual lalu tutup:
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white border border-green-300 rounded px-2 py-1.5 text-sm font-mono text-gray-900">
                            {state.tempPassword}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(d.id, state.tempPassword)}
                          >
                            {copiedId === d.id ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-gray-600"
                          onClick={() => setStateFor(d.id, { phase: "idle" })}
                        >
                          Tutup
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
