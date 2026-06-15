"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { HeartPulse } from "lucide-react";

export default function Home() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(doctor ? "/dashboard" : "/login");
    }
  }, [doctor, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <HeartPulse className="w-10 h-10 text-red-500" />
        <p className="text-sm text-gray-500 font-medium">Memuat aplikasi...</p>
      </div>
    </div>
  );
}
