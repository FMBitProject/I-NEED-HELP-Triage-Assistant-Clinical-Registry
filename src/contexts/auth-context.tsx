"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Doctor } from "@/lib/types";
import { store } from "@/lib/store";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const d = store.getDoctor();
    if (d) {
      setDoctor(d);
      store.seedDemoData(d.id);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600));

    if (email === "demo@puskesmas.id" && password === "demo123") {
      const doc: Doctor = {
        id: "dr-demo-001",
        email,
        name: "dr. Budi Santoso",
        institutionType: "Puskesmas",
        createdAt: new Date().toISOString(),
        role: "DOCTOR",
      };
      store.setDoctor(doc);
      store.seedDemoData(doc.id);
      setDoctor(doc);
      router.push("/dashboard");
      return { success: true };
    }

    if (email === "admin@registry.id" && password === "admin123") {
      const doc: Doctor = {
        id: "dr-admin-001",
        email,
        name: "Prof. Ahmad Yani, SpJP",
        institutionType: "RS Pusat Jantung",
        createdAt: new Date().toISOString(),
        role: "ADMIN",
      };
      store.setDoctor(doc);
      store.seedDemoData(doc.id);
      setDoctor(doc);
      router.push("/dashboard");
      return { success: true };
    }

    return { success: false, error: "Email atau password salah. Coba demo@puskesmas.id / demo123" };
  };

  const register = async (data: RegisterData) => {
    await new Promise((r) => setTimeout(r, 800));

    if (!data.email || !data.password || !data.name || !data.institutionType) {
      return { success: false, error: "Semua field harus diisi." };
    }

    const doc: Doctor = {
      id: `dr-${Date.now()}`,
      email: data.email,
      name: data.name,
      institutionType: data.institutionType,
      createdAt: new Date().toISOString(),
      role: "DOCTOR",
    };
    store.setDoctor(doc);
    setDoctor(doc);
    router.push("/dashboard");
    return { success: true };
  };

  const logout = () => {
    store.setDoctor(null);
    setDoctor(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ doctor, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
