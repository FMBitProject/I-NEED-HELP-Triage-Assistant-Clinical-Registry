// Migrasi skema: CHECK constraint untuk patients.consent_basis.
//
// API sudah memvalidasi nilainya, tapi DB adalah lapisan terakhir: skrip
// lain, drizzle studio, atau endpoint baru di masa depan bisa menulis nilai
// sembarang. Null tetap sah (data lama sebelum field ini ada).
//
// TIDAK wajib sebelum deploy (kode tidak bergantung pada constraint ini).
// Gagal (dan tidak mengubah apa pun) bila sudah ada baris dengan nilai di
// luar daftar — baris itu ditampilkan supaya bisa diperbaiki dulu.
// Aman dijalankan ulang (idempoten).
//
// Pemakaian:
//   npm run db:migrate:consent-check

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tidak ditemukan (cek .env.local). Migrasi dibatalkan.");
  process.exit(1);
}

// Jangan biarkan error new URL() mencetak URL lengkap beserta password.
let host;
try {
  host = new URL(url).host;
} catch {
  console.error("DATABASE_URL tidak valid (isinya sengaja tidak ditampilkan). Migrasi dibatalkan.");
  process.exit(1);
}
const sql = neon(url);
console.log(`Menjalankan migrasi pada host: ${host}`);

try {
  const invalid = await sql`
    SELECT id, consent_basis FROM patients
    WHERE consent_basis IS NOT NULL
      AND consent_basis NOT IN ('INFORMED_CONSENT', 'ETHICS_WAIVER')
    LIMIT 20
  `;
  if (invalid.length > 0) {
    console.error("Ada baris dengan consent_basis tidak valid — perbaiki dulu, migrasi dibatalkan:");
    console.table(invalid);
    process.exit(1);
  }

  const [{ exists }] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'patients_consent_basis_chk'
    ) AS exists
  `;
  if (exists) {
    console.log("Constraint sudah ada — tidak ada yang diubah.");
  } else {
    await sql`
      ALTER TABLE patients ADD CONSTRAINT patients_consent_basis_chk
        CHECK (consent_basis IS NULL OR consent_basis IN ('INFORMED_CONSENT', 'ETHICS_WAIVER'))
    `;
    console.log("Constraint patients_consent_basis_chk ditambahkan.");
  }
} catch (err) {
  console.error("Migrasi GAGAL — tidak ada yang berubah.");
  console.error(err);
  process.exit(1);
}
