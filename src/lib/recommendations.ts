// Anjuran klinis resmi (Panduan PERKI) — dipakai halaman hasil triase online
// dan tampilan hasil offline. Jangan tambah kriteria di luar guideline.

export const REFER_RECOMMENDATIONS = [
  {
    icon: "🚑",
    title: "Rujuk Segera ke Faskes Sekunder/Tersier",
    desc: "Siapkan surat rujukan BPJS dengan diagnosis Gagal Jantung Kronis Dekompensasi (GKJD). Cantumkan skor I-NEED-HELP dan kriteria yang terpenuhi.",
  },
  {
    icon: "💊",
    title: "Optimalisasi Terapi Sementara",
    desc: "Pertimbangkan pemberian diuretik intravena (Furosemide 40-80mg IV) jika ada tanda kongesti sebelum rujukan.",
  },
  {
    icon: "📋",
    title: "Edukasi Pasien & Keluarga",
    desc: "Jelaskan kepada pasien dan keluarga tentang perlunya evaluasi lanjutan oleh spesialis jantung (SpJP).",
  },
  {
    icon: "📞",
    title: "Kontak Faskes Tujuan",
    desc: "Hubungi RS rujukan untuk konfirmasi ketersediaan tempat dan tindakan yang diperlukan (ekokardiografi, kateterisasi jantung).",
  },
];

export const CONTINUE_RECOMMENDATIONS = [
  {
    icon: "✅",
    title: "Lanjutkan & Optimalkan GDMT",
    desc: "Pastikan pasien menerima 4 pilar GDMT: ACE-I/ARB/ARNI + Beta-Blocker + MRA + SGLT2i, sesuai toleransi dan fungsi ginjal.",
  },
  {
    icon: "📅",
    title: "Jadwalkan Follow-up Rutin",
    desc: "Kontrol kembali dalam 2-4 minggu untuk evaluasi toleransi obat, tanda kongesti, dan profil ginjal.",
  },
  {
    icon: "⚖️",
    title: "Monitor Berat Badan Harian",
    desc: "Edukasi pasien untuk timbang berat badan setiap pagi. Kenaikan >2kg dalam 2 hari adalah tanda peringatan.",
  },
  {
    icon: "🧂",
    title: "Restriksi Garam & Cairan",
    desc: "Anjurkan restriksi sodium <2g/hari dan cairan <1.5L/hari untuk pasien dengan riwayat kongesti.",
  },
];
