# Registry Gagal Jantung

Aplikasi web (PWA, mobile-first) untuk dokter di rumah sakit yang mengelola
registri observasional gagal jantung (mengacu panduan PERKI) sekaligus
memantau kepatuhan terapi GDMT (obat pilar) — data siap dianalisis untuk
publikasi ilmiah.

> Dokumen kebutuhan lengkap: [Product Requirements Document (PRD).md](<Product Requirements Document (PRD).md>)

## Fitur Utama

- **Registrasi pasien** — profil, tanda vital, komorbiditas, lab (termasuk
  NT-proBNP wajib untuk konfirmasi diagnosis), dan status 4 pilar GDMT
  beserta alasan bila tidak diberikan
- **Offline-first** — form registrasi tetap berfungsi tanpa sinyal; data
  ngantri di perangkat (IndexedDB) dan tersinkron otomatis saat koneksi kembali
- **Follow-up tracker** — pengingat outcome 30-hari (jatuh tempo vs masa observasi)
- **Dashboard audit personal** — statistik pasien, audit kelengkapan 4 pilar GDMT
- **Research export (admin)** — CSV siap SPSS/Stata/R: 1 baris per pasien
- **Persetujuan riset & approval akun** — akun dokter baru harus disetujui admin

## Tech Stack

Next.js (App Router) · Tailwind CSS · shadcn/ui · Better Auth · Drizzle ORM ·
Neon (PostgreSQL serverless) · Vercel

## Menjalankan Secara Lokal

```bash
npm install
# buat file .env.local (lihat isi minimal di bawah)
npm run dev
```

`.env.local` minimal berisi:

```
DATABASE_URL=postgres://...   # connection string Neon
BETTER_AUTH_SECRET=...        # string acak panjang
BETTER_AUTH_URL=http://localhost:3000
```

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `npm test` | Unit test (vitest) — GDMT, CSV, follow-up, antrean offline |
| `npm run build` | Build produksi |
| `npm run db:push` | Sinkronkan skema Drizzle ke database |
| `npm run db:studio` | GUI inspeksi database |

## Deploy: Urutan Wajib Bila Skema DB Berubah

Kode men-SELECT semua kolom yang ada di `schema.ts`. Kalau kode baru
ter-deploy sebelum kolomnya ada di DB, **login dan semua halaman pasien
error 500**. Urutannya selalu:

1. Jalankan migrasi di DB produksi
2. Baru merge / deploy kode

Untuk **rename** atau **hapus** kolom, jangan pakai `db:push` — push bisa
men-DROP kolom lama beserta datanya. Tulis skrip migrasi eksplisit.

Migrasi yang tertunda:

| Skrip | Isi | Perintah |
|---|---|---|
| [scripts/migrate-2026-11-care-setting.mjs](scripts/migrate-2026-11-care-setting.mjs) | Rename `ed_disposition` → `visit_disposition` (+ `DECEASED_ED` → `DECEASED`), tambah `care_setting` & `doctor_type` | `npm run db:migrate:care-setting` |

## Peta Kode Penting

| Lokasi | Isi |
|---|---|
| [src/lib/gdmt.ts](src/lib/gdmt.ts) | Penghitungan kelengkapan 4 pilar GDMT |
| [src/lib/offline-queue.ts](src/lib/offline-queue.ts) | Antrean offline + sinkronisasi |
| [src/lib/db/schema.ts](src/lib/db/schema.ts) | Skema database (Drizzle) |
| [src/app/api/export/route.ts](src/app/api/export/route.ts) | Ekspor CSV riset (admin) |
| [public/sw.js](public/sw.js) | Service worker PWA (cache halaman + salinan daftar pasien) |

## Catatan Riset & Etik

- Data pasien pseudoanonim (inisial saja, tanpa identitas langsung)
- Ekspor CSV: 1 baris per pasien; outcome yang dipakai adalah yang
  terakhir dicatat per pasien
- Data dari era IGD (sebelum registri beralih ke poli + rawat inap) punya
  ciri yang perlu diperhitungkan saat analisis:
  - `institutionType` = `IGD / Unit Gawat Darurat` — kategori lama yang
    tidak bisa lagi dipilih saat mendaftar, tapi tetap ada di akun lama
  - `careSetting` kosong — pasien didaftarkan di IGD, bukan di poli/rawat inap
  - `doctorType` kosong — akun dibuat sebelum field ini ada (dokter diminta
    melengkapinya lewat Pengaturan)
  - `visitDisposition` = `DECEASED` pada data lama berarti meninggal di IGD
    (dulu `DECEASED_ED`, digabung saat migrasi)
- Isi nomor **ethical clearance** di menu Pengaturan sebelum data dipakai
  untuk publikasi
