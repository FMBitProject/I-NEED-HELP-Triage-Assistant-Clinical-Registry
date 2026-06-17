"use client";

import { useState } from "react";
import { Mail, X, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const DEVELOPER_EMAIL = "renfael6@gmail.com";

export function FeedbackButton() {
  const { doctor } = useAuth();
  const [expanded, setExpanded] = useState(false);

  if (!doctor) return null;

  const subject = encodeURIComponent("Masukan untuk I-NEED-HELP Registry");
  const body = encodeURIComponent(
    `Halo Developer,\n\nSaya ingin menyampaikan masukan berikut:\n\n[Tulis masukan di sini]\n\n---\nDikirim dari: ${doctor.name}\nFaskes: ${doctor.institutionType}`
  );
  const mailto = `mailto:${DEVELOPER_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-2">
      {expanded && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-64 max-w-[calc(100vw-2rem)] text-sm">
          <p className="font-semibold text-gray-900 mb-1">Kirim Masukan</p>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Ada fitur yang kurang, bug, atau saran? Hubungi developer langsung.
          </p>
          <a
            href={mailto}
            onClick={() => setExpanded(false)}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Email ke Developer
          </a>
          <p className="text-[10px] text-gray-400 text-center mt-2">{DEVELOPER_EMAIL}</p>
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Tutup masukan" : "Kirim masukan ke developer"}
        className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg flex items-center justify-center transition-all"
      >
        {expanded ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageSquare className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
