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
- Isi nomor **ethical clearance** di menu Pengaturan sebelum data dipakai
  untuk publikasi
