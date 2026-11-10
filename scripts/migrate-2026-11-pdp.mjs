// Migrasi skema: kepatuhan UU PDP.
//   - patients.consent_basis : dasar hukum pemrosesan data per pasien
//   - access_logs            : jejak unduhan/akses massal data registri
//
// WAJIB dijalankan di database produksi SEBELUM kode versi ini di-deploy.
// Kode baru men-SELECT kolom consent_basis; kalau kolomnya belum ada, semua
// halaman pasien langsung error 500, dan ekspor CSV gagal tanpa access_logs.
//
// Hanya MENAMBAH kolom/tabel — tidak ada data yang diubah atau dihapus.
// Aman dijalankan ulang (idempoten), dan berjalan dalam satu transaksi.
//
// Pemakaian:
//   npm run db:migrate:pdp

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan (cek .env.local). Migrasi dibatalkan.");
  process.exit(1);
}

const sql = neon(url);
const host = new URL(url).host;
console.log(`Menjalankan migrasi pada host: ${host}`);

try {
  await sql.transaction([
    sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_basis text`,
    sql`
      CREATE TABLE IF NOT EXISTS access_logs (
        id text PRIMARY KEY,
        user_id text REFERENCES "user"(id) ON DELETE SET NULL,
        user_name text,
        action text NOT NULL,
        detail text,
        ip_address text,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `,
  ]);

  const [{ count: missingConsent }] = await sql`
    SELECT count(*)::int AS count FROM patients WHERE consent_basis IS NULL
  `;
  const [{ exists: hasAccessLogs }] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'access_logs'
    ) AS exists
  `;

  if (!hasAccessLogs) {
    console.error("PERINGATAN: tabel access_logs tidak terbentuk. Periksa manual sebelum deploy.");
    process.exit(1);
  }
  console.log("Migrasi selesai. Sekarang aman untuk deploy kode versi ini.");
  console.log(
    `Pasien lama tanpa catatan persetujuan: ${missingConsent}. ` +
      "Minta dokter pemilik melengkapinya lewat menu Edit, atau hapus bila memang tidak ada persetujuan/waiver."
  );
} catch (err) {
  console.error("Migrasi GAGAL — transaksi di-rollback, tidak ada yang berubah.");
  console.error(err);
  process.exit(1);
}
