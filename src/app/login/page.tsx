"use client";

import { useState } from "react";
import Link from "next/link";
import { HeartPulse, Eye, EyeOff, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || "Login gagal");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 border border-red-100 mb-4">
            <HeartPulse className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">I-NEED-HELP</h1>
          <p className="text-sm text-gray-500 mt-1">Triage Assistant & Clinical Registry</p>
        </div>

        <Card className="shadow-lg border-0 ring-1 ring-gray-100">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Masuk ke Akun</h2>
            <p className="text-sm text-gray-500 mb-5">Selamat datang, Dokter.</p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="dokter@puskesmas.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Memverifikasi..." : "Masuk"}
              </Button>
            </form>

          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-4">
          Belum punya akun?{" "}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            Daftar sekarang
          </Link>
        </p>

        <div className="text-center mt-5 space-y-1.5">
          <p className="text-xs text-gray-400">
            Data pasien dikumpulkan secara pseudoanonim untuk keperluan riset ilmiah.
          </p>
          <p className="text-xs text-gray-400">
            <Link href="/privacy-policy" className="hover:underline text-gray-500">Kebijakan Privasi</Link>
            {" · "}
            <Link href="/terms" className="hover:underline text-gray-500">Syarat &amp; Ketentuan</Link>
          </p>
          <a
            href="mailto:renfael6@gmail.com?subject=Masukan%20untuk%20I-NEED-HELP%20Registry"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Mail className="w-3 h-3" />
            Kirim masukan ke developer
          </a>
        </div>
      </div>
    </div>
  );
}
