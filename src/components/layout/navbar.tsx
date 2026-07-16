"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Users,
  ClipboardList,
  Download,
  LogOut,
  Menu,
  X,
  HeartPulse,
  Bell,
  FileText,
  UserCog,
  Database,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/triage/new", label: "Triase Baru", icon: Activity },
  { href: "/patients", label: "Pasien", icon: Users },
  { href: "/followup", label: "Follow-up", icon: ClipboardList },
];

export function Navbar() {
  const { doctor, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!doctor) return;
    fetch("/api/patients")
      .then((r) => r.json())
      .then((patients: { outcome?: unknown }[]) => {
        setPendingCount(patients.filter((p) => !p.outcome).length);
      })
      .catch(() => {});
  }, [doctor]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-red-600" />
            <span className="font-bold text-gray-900 text-sm sm:text-base">
              I-NEED-HELP
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.href === "/followup" && pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            ))}
            {doctor?.role === "ADMIN" && (
              <Link
                href="/admin/registry"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/admin/registry"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Database className="w-4 h-4" />
                Registry
              </Link>
            )}
            {doctor?.role === "ADMIN" && (
              <Link
                href="/export"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/export"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Download className="w-4 h-4" />
                Export Data
              </Link>
            )}
            {doctor?.role === "ADMIN" && (
              <Link
                href="/admin/users"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/admin/users"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <UserCog className="w-4 h-4" />
                Kelola Dokter
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-900">{doctor?.name}</p>
              <p className="text-xs text-gray-500">{doctor?.institutionType}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="w-4 h-4 text-gray-500" />
            </Button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {pendingCount > 0 && (
              <Link href="/followup">
                <div className="relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                </div>
              </Link>
            )}
            <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-gray-100">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.href === "/followup" && pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            ))}
            {doctor?.role === "ADMIN" && (
              <Link
                href="/admin/registry"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <Database className="w-4 h-4" />
                Registry Semua Dokter
              </Link>
            )}
            {doctor?.role === "ADMIN" && (
              <Link
                href="/export"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                Export Data Riset
              </Link>
            )}
            {doctor?.role === "ADMIN" && (
              <Link
                href="/admin/users"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <UserCog className="w-4 h-4" />
                Kelola Akun Dokter
              </Link>
            )}
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="px-3 py-1 mb-2">
                <p className="text-sm font-semibold text-gray-900">{doctor?.name}</p>
                <p className="text-xs text-gray-500">{doctor?.institutionType}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <FileText className="w-4 h-4" />
                Pengaturan Akun
              </Link>
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
              <div className="flex gap-3 px-3 pt-3 mt-1 border-t border-gray-100">
                <Link
                  href="/privacy-policy"
                  onClick={() => setOpen(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
                >
                  Kebijakan Privasi
                </Link>
                <Link
                  href="/terms"
                  onClick={() => setOpen(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
                >
                  Syarat &amp; Ketentuan
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
