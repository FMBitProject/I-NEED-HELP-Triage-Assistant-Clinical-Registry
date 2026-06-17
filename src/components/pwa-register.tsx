"use client";

import { useEffect, useState } from "react";

export function PwaRegister() {
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("ios-pwa-hint");

    if (isIos && !isStandalone && !dismissed) {
      // Delay slightly so it doesn't flash on every page load
      const t = setTimeout(() => setShowIosHint(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!showIosHint) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white border border-blue-200 rounded-2xl shadow-xl p-4">
      <button
        aria-label="Tutup"
        className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-xl leading-none"
        onClick={() => {
          setShowIosHint(false);
          sessionStorage.setItem("ios-pwa-hint", "1");
        }}
      >
        ×
      </button>
      <p className="text-sm text-gray-800 pr-6 leading-snug">
        <span className="font-semibold">Pasang di layar utama iOS:</span> ketuk
        ikon berbagi{" "}
        <span className="inline-block font-mono bg-gray-100 px-1 rounded text-xs">
          ⎋
        </span>{" "}
        lalu pilih <em>&ldquo;Add to Home Screen&rdquo;</em> untuk akses cepat
        tanpa browser.
      </p>
    </div>
  );
}
