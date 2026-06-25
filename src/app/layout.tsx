import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { PendingApprovalGate } from "@/components/pending-approval-gate";
import { PwaRegister } from "@/components/pwa-register";
import { FeedbackButton } from "@/components/feedback-button";
import { ErrorReporter } from "@/components/error-reporter";

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
        <AuthProvider>
          <PendingApprovalGate>
            {children}
            <FeedbackButton />
          </PendingApprovalGate>
        </AuthProvider>
        <PwaRegister />
        <ErrorReporter />
      </body>
    </html>
  );
}
