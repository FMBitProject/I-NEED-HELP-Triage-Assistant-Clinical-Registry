"use client";

import React, { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { Doctor } from "@/lib/types";
import { authClient, useSession } from "@/lib/auth-client";

interface AuthContextType {
  doctor: Doctor | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  institutionType: string;
  institutionName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const u = session?.user as (NonNullable<typeof session>["user"] & {
    institutionType?: string;
    role?: string;
  }) | undefined;

  const doctor: Doctor | null = u
    ? {
        id: u.id,
        email: u.email,
        name: u.name,
        institutionType: u.institutionType || "",
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
        role: (u.role as "DOCTOR" | "ADMIN") || "DOCTOR",
      }
    : null;

  const login = async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) return { success: false, error: error.message || "Email atau password salah." };
    router.push("/dashboard");
    return { success: true };
  };

  const register = async (data: RegisterData) => {
    const combined = data.institutionName?.trim()
      ? `${data.institutionType} – ${data.institutionName.trim()}`
      : data.institutionType;
    const { error } = await (authClient.signUp.email as Function)({
      email: data.email,
      password: data.password,
      name: data.name,
      institutionType: combined,
      researchConsent: true,
    });
    if (error) return { success: false, error: error.message || "Pendaftaran gagal." };
    router.push("/dashboard");
    return { success: true };
  };

  const logout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ doctor, login, register, logout, isLoading: isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
