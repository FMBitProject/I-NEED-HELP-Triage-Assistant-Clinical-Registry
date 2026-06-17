import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "I-NEED-HELP Triage Assistant",
  description: "Sistem Triase & Registri Klinis Gagal Jantung – PERKI Guidelines",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "I-NEED-HELP",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 antialiased">
        <AuthProvider>{children}</AuthProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
