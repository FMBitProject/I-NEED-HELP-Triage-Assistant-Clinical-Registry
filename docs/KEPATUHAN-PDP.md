# Kepatuhan UU PDP & Hosting — Checklist

> Dokumen kerja, **bukan nasihat hukum**. Sebelum dipakai dengan data pasien
> asli, minta bagian hukum/komite etik rumah sakit meninjau.

UU No. 27/2022 (UU PDP) berlaku penuh sejak 17 Oktober 2024. Data kesehatan
termasuk **data pribadi spesifik**, dan data pseudonim (inisial + usia + data
klinis) **tetap dihitung data pribadi**, bukan data anonim.

## A. Sudah ditangani di kode

| Kewajiban | Implementasi |
|---|---|
| Dasar hukum per pasien | Field wajib `consentBasis` (informed consent / waiver komite etik); API menolak pasien tanpa ini |
| Minimalisasi data | Inisial maks. 4 huruf, tanpa angka, ditegakkan di server; peringatan di kolom teks bebas |
| Minimalisasi saat ekspor | CSV riset tanpa inisial pasien & nama dokter |
| Akuntabilitas | Audit trail per perubahan pasien; tabel `access_logs` untuk setiap ekspor CSV |
| Pembatasan akses | Dokter hanya melihat pasiennya sendiri; akun baru harus di-approve admin |
| Hak hapus | Dokter bisa hapus pasien; dokter bisa hapus akun beserta datanya |
| Lokasi data | DB Neon di Singapura; fungsi Vercel dipaksa ke `sin1` lewat `vercel.json` |
| Data di perangkat | Cache daftar pasien dihapus saat logout |
| Transparansi | Kebijakan privasi v2.0 menyesuaikan perilaku aplikasi yang sebenarnya |

## B. WAJIB diurus di luar kode (kode tidak bisa menyelesaikannya)

- [ ] **Ethical clearance** dari komite etik untuk registri ini. Tanyakan
      sekalian apakah boleh pakai *waiver informed consent* (registri
      observasional sering mendapatkannya)
- [ ] **Izin dari rumah sakit** tempat data diambil: banyak RS punya aturan
      soal data pasien yang disimpan di cloud luar negeri
- [ ] **Pejabat Pelindungan Data (DPO)**: tetapkan siapa orangnya. Idealnya
      pakai email institusi/tim, bukan email pribadi
- [ ] **DPIA (Penilaian Dampak PDP)**: wajib untuk pemrosesan data spesifik
      berisiko tinggi. Cukup dokumen 2–3 halaman: data apa, risiko apa,
      pengamanannya apa (tabel bagian A bisa dipakai sebagai bahan)
- [ ] **Formulir informed consent** pasien yang menyebut: data dipakai untuk
      registri, disimpan di server Singapura, dan bisa ditarik kapan saja
- [ ] **Rencana respons kebocoran**: siapa dihubungi, template email
      pemberitahuan. Tenggat UU PDP **3×24 jam**
- [ ] **Akun admin**: aktifkan password kuat, dan jangan berbagi akun

## C. Vercel Hobby (gratis): boleh atau tidak?

Paket Hobby hanya untuk penggunaan **pribadi & non-komersial**. Menurut
Vercel, "komersial" bukan hanya soal ada transaksi. Ini juga dihitung
komersial: siapa pun yang terlibat mendapat keuntungan finansial dari
aplikasinya, **termasuk dibayar untuk membuatnya**, atau ada iklan.

| Situasi | Saran |
|---|---|
| Proyek riset/akademik pribadi, tidak dibayar, tanpa iklan | Hobby kemungkinan masih sesuai |
| Dipakai sebagai sistem operasional resmi RS / institusi | Pindah ke **Vercel Pro** |
| Kamu dibayar (gaji/honor/hibah berbayar) untuk membangunnya | Pindah ke **Vercel Pro** |

Kode tidak bisa mengubah status ini. Bila ragu, cek
[Vercel Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
atau tanyakan ke Vercel.

Catatan: log fungsi di paket Hobby hanya disimpan sebentar. Karena itu jejak
ekspor disimpan di database (`access_logs`), bukan hanya di log.

## D. Kebiasaan harian (untuk semua pengguna)

1. Isi inisial saja. Jangan pernah nama, NIK, atau no. RM, termasuk di kolom catatan
2. Pilih dasar persetujuan dengan jujur. Kalau tidak ada persetujuan, jangan didaftarkan
3. Pasien minta datanya dihapus → hapus pasien di aplikasi (atau minta admin bila sudah final)
4. File CSV ekspor: simpan di laptop terenkripsi, **jangan** kirim lewat grup WA
5. Logout setelah memakai HP/komputer bersama
