// Migrasi skema: careSetting + visitDisposition (rename) + doctorType.
//
// WAJIB dijalankan di database produksi SEBELUM kode versi ini di-deploy.
// Kode baru men-SELECT kolom care_setting / visit_disposition / doctor_type;
// kalau kolomnya belum ada, login dan semua halaman pasien langsung error 500.
//
// Kenapa bukan `npm run db:push`? Karena push melihat rename sebagai
// "kolom ed_disposition hilang + kolom visit_disposition baru" dan bisa
// men-DROP ed_disposition beserta seluruh isinya. Skrip ini melakukan RENAME
// yang eksplisit dan memetakan nilai lama DECEASED_ED → DECEASED.
//
// Aman dijalankan ulang (idempoten): setiap langkah memeriksa kondisi dulu.
// Seluruh langkah berjalan dalam satu transaksi — gagal di tengah = tidak
// ada yang berubah.
//
// Pemakaian:
//   npm run db:migrate:care-setting
// Setelah sukses, `npm run db:push` seharusnya tidak melaporkan perubahan.

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan (cek .env.local). Migrasi dibatalkan.");
  process.exit(1);
}

const sql = neon(url);

// Info host saja (tanpa kredensial) supaya jelas DB mana yang disentuh.
const host = new URL(url).host;
console.log(`Menjalankan migrasi pada host: ${host}`);

try {
  await sql.transaction([
    // 1. Rename ed_disposition → visit_disposition, hanya bila kolom lama
    //    ada dan kolom baru belum ada. Data ikut pindah, tidak ada yang hilang.
    sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'ed_disposition'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'visit_disposition'
        ) THEN
          ALTER TABLE patients RENAME COLUMN ed_disposition TO visit_disposition;
        END IF;
      END $$;
    `,
    // 2. Jaga-jaga untuk DB yang tidak pernah punya ed_disposition.
    sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS visit_disposition text`,
    // 3. Petakan nilai lama ke nilai baru.
    sql`UPDATE patients SET visit_disposition = 'DECEASED' WHERE visit_disposition = 'DECEASED_ED'`,
    // 4. Kolom baru.
    sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS care_setting text`,
    sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS doctor_type text`,
  ]);

  // Verifikasi: tampilkan kolom yang ada + sisa nilai lama (harus 0).
  const cols = await sql`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND ((table_name = 'patients' AND column_name IN ('ed_disposition', 'visit_disposition', 'care_setting'))
        OR (table_name = 'user' AND column_name = 'doctor_type'))
    ORDER BY table_name, column_name
  `;
  const [{ count: legacyLeft }] = await sql`
    SELECT count(*)::int AS count FROM patients WHERE visit_disposition = 'DECEASED_ED'
  `;
  console.log("Kolom setelah migrasi:", cols.map((c) => `${c.table_name}.${c.column_name}`).join(", "));
  console.log(`Sisa nilai DECEASED_ED: ${legacyLeft}`);

  const hasLegacyCol = cols.some((c) => c.column_name === "ed_disposition");
  if (hasLegacyCol || legacyLeft !== 0) {
    console.error(
      "PERINGATAN: kolom ed_disposition masih ada atau masih ada nilai DECEASED_ED. Periksa manual sebelum deploy."
    );
    process.exit(1);
  }
  console.log("Migrasi selesai. Sekarang aman untuk deploy kode versi ini.");
} catch (err) {
  console.error("Migrasi GAGAL — transaksi di-rollback, tidak ada yang berubah.");
  console.error(err);
  process.exit(1);
}
