# I-NEED-HELP Triage Assistant & Clinical Registry

Aplikasi web (PWA, mobile-first) untuk dokter umum di faskes primer dan IGD:
mendigitalkan triase gagal jantung **I-NEED-HELP** (panduan PERKI) sekaligus
mengumpulkan data registri observasional anonim yang siap dianalisis untuk
publikasi ilmiah.

> Dokumen kebutuhan lengkap: [Product Requirements Document (PRD).md](<Product Requirements Document (PRD).md>)

## Fitur Utama

- **Triase 2 tahap** — profil pasien + ceklis 9 kriteria I-NEED-HELP, hasil
  Merah (Rujuk) / Hijau (Lanjut GDMT) beserta anjuran klinis PERKI dalam < 1 menit
- **Offline-first** — form triase tetap berfungsi tanpa sinyal; data ngantri
  di perangkat (IndexedDB) dan tersinkron otomatis saat koneksi kembali
- **Follow-up tracker** — pengingat outcome 30-hari (jatuh tempo vs masa observasi)
- **Dashboard audit personal** — statistik triase, tingkat rujukan, audit 4 pilar GDMT
- **Research export (admin)** — CSV long-format siap SPSS/Stata/R: 1 baris per
  triase, kriteria sebagai kolom `crit_*`, boolean `1/0`
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
| `npm test` | Unit test (vitest) — skoring, CSV, follow-up, antrean offline |
| `npm run build` | Build produksi |
| `npm run db:push` | Sinkronkan skema Drizzle ke database |
| `npm run db:studio` | GUI inspeksi database |

## Peta Kode Penting

| Lokasi | Isi |
|---|---|
| [src/lib/triage.ts](src/lib/triage.ts) | Logika skoring I-NEED-HELP (satu-satunya sumber kebenaran, jangan tambah kriteria di luar guideline) |
| [src/lib/offline-queue.ts](src/lib/offline-queue.ts) | Antrean offline + sinkronisasi |
| [src/lib/db/schema.ts](src/lib/db/schema.ts) | Skema database (Drizzle) |
| [src/app/api/export/route.ts](src/app/api/export/route.ts) | Ekspor CSV riset (admin) |
| [public/sw.js](public/sw.js) | Service worker PWA (cache halaman + salinan daftar pasien) |

## Catatan Riset & Etik

- Data pasien pseudoanonim (inisial saja, tanpa identitas langsung)
- Ekspor CSV: 1 baris per event triase; outcome yang dipakai adalah yang
  terakhir dicatat per pasien
- Isi nomor **ethical clearance** di menu Pengaturan sebelum data dipakai
  untuk publikasi
