"use client";

import React, { createContext, useContext, useState } from "react";
import { Doctor } from "@/lib/types";
import { authClient, useSession } from "@/lib/auth-client";
import { isValidDoctorType } from "@/lib/doctor-type";
import { clearLocalPatientData } from "@/lib/local-data";

interface AuthContextType {
  doctor: Doctor | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  institutionType: string;
  institutionName?: string;
  doctorType: string;
}

interface AuthError {
  message?: string;
  code?: string;
  status?: number;
}

// Pesan bawaan better-auth berbahasa Inggris ("Password too short", "User
// already exists...", "Too many requests"). Pesan dari hook kita sendiri
// (mis. jenis dokter) sudah berbahasa Indonesia dan diteruskan apa adanya.
function translateSignUpError(error: AuthError): string {
  if (error.status === 429) {
    return "Terlalu banyak percobaan dari jaringan ini. Tunggu sekitar 1 menit, lalu coba lagi.";
  }
  switch (error.code) {
    case "PASSWORD_TOO_SHORT":
      return "Password terlalu pendek — minimal 8 karakter.";
    case "PASSWORD_TOO_LONG":
      return "Password terlalu panjang — maksimal 128 karakter.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Email ini sudah terdaftar. Silakan masuk lewat halaman Login, atau gunakan email lain.";
    case "INVALID_EMAIL":
      return "Format email tidak valid. Periksa kembali alamat email Anda.";
    case "VALIDATION_ERROR":
      if (error.message?.includes("email")) {
        return "Format email tidak valid. Periksa kembali alamat email Anda.";
      }
      break;
  }
  return error.message || "Pendaftaran gagal. Periksa koneksi internet lalu coba lagi.";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const u = session?.user as (NonNullable<typeof session>["user"] & {
    institutionType?: string;
    doctorType?: string;
    role?: string;
    approved?: boolean;
    ethicalClearanceNo?: string | null;
    ethicalClearanceDate?: string | null;
  }) | undefined;

  const doctor: Doctor | null = u
    ? {
        id: u.id,
        email: u.email,
        name: u.name,
        institutionType: u.institutionType || "",
        // Divalidasi, bukan di-cast: "" atau nilai tak dikenal → null, supaya
        // banner "jenis dokter belum diisi" tetap muncul untuk kasus itu.
        doctorType: isValidDoctorType(u.doctorType) ? u.doctorType : null,
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
        role: (u.role as "DOCTOR" | "ADMIN") || "DOCTOR",
        approved: u.approved ?? false,
        ethicalClearanceNo: u.ethicalClearanceNo ?? null,
        ethicalClearanceDate: u.ethicalClearanceDate ?? null,
      }
    : null;

  // Don't navigate to /dashboard here: better-auth's client delays propagating the
  // new session to useSession() by ~10ms after sign-in/sign-up resolves (it debounces
  // the session-refetch signal). Navigating immediately races that delay — the
  // dashboard mounts, still sees the pre-login session, and bounces back to /login.
  // Callers should navigate once `doctor` actually becomes truthy instead.
  const login = async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) return { success: false, error: error.message || "Email atau password salah." };
    return { success: true };
  };

  const register = async (data: RegisterData) => {
    const combined = data.institutionName?.trim()
      ? `${data.institutionType} – ${data.institutionName.trim()}`
      : data.institutionType;
    // Cast diperlukan karena field kustom (institutionType, researchConsent)
    // tidak ada di tipe bawaan better-auth
    const signUpEmail = authClient.signUp.email as (payload: {
      email: string;
      password: string;
      name: string;
      institutionType: string;
      doctorType: string;
      researchConsent: boolean;
    }) => Promise<{ error: AuthError | null }>;
    const { error } = await signUpEmail({
      email: data.email,
      password: data.password,
      name: data.name,
      institutionType: combined,
      doctorType: data.doctorType,
      researchConsent: true,
    });
    if (error) return { success: false, error: translateSignUpError(error) };
    return { success: true };
  };

  const logout = async () => {
    // Urutan penting: data lokal dibersihkan DULU. signOut butuh jaringan dan
    // melempar error saat offline — kalau ia dipanggil duluan tanpa
    // penanganan, cache tidak terhapus dan halaman tidak pindah (tombol
    // Logout terlihat "mati"), justru di HP bersama yang sedang tanpa sinyal.
    await clearLocalPatientData();
    setLogoutError(null);
    let failed = false;
    try {
      const res = await authClient.signOut();
      // better-auth bisa melapor gagal lewat { error } alih-alih melempar.
      failed = !!(res as { error?: unknown } | undefined)?.error;
    } catch (err) {
      console.warn("[logout] signOut gagal", err);
      failed = true;
    }
    if (failed) {
      // JANGAN pura-pura berhasil: cookie sesi (httpOnly) masih berlaku, jadi
      // orang berikutnya di perangkat ini bisa langsung masuk sebagai user ini
      // begitu online. Beri tahu dengan jelas dan minta coba lagi.
      setLogoutError(
        "Logout belum selesai karena tidak ada koneksi. Data pasien di perangkat sudah dihapus, tetapi sesi Anda masih aktif — sambungkan internet lalu tekan Logout lagi sebelum meninggalkan perangkat ini."
      );
      return;
    }
    // Hard navigation, bukan router.push: buang juga state React di memori
    // (daftar pasien yang sudah dimuat halaman sebelumnya).
    window.location.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ doctor, login, register, logout, isLoading: isPending }}>
      {children}
      {logoutError && (
        <div role="alert" className="fixed top-16 left-4 right-4 z-[60] max-w-xl mx-auto">
          <div className="bg-red-50 border border-red-300 rounded-xl shadow-lg p-3 flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <p className="flex-1 text-xs text-red-800 font-medium">{logoutError}</p>
            <button
              onClick={() => setLogoutError(null)}
              className="shrink-0 text-xs text-red-700 underline"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
