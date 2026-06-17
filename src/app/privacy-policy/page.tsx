import Link from "next/link";
import { HeartPulse, Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-red-50 rounded-xl">
            <HeartPulse className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kebijakan Privasi</h1>
            <p className="text-sm text-gray-500">I-NEED-HELP Triage Assistant &amp; Clinical Registry</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800">
            Kebijakan ini berlaku sejak <strong>17 Juni 2026</strong> dan mengacu pada{" "}
            <strong>UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)</strong> dan{" "}
            <strong>Peraturan Menteri Komunikasi dan Informatika No. 5 Tahun 2020 tentang PSE</strong>.
          </p>
        </div>

        <div className="space-y-6 text-sm text-gray-700">
          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">1. Pengelola Data</h2>
            <p>
              Platform <strong>I-NEED-HELP Clinical Registry</strong> dikelola oleh tim peneliti
              sebagai penyelenggara registri klinis observasional untuk gagal jantung. Selaku
              Pengendali Data (Data Controller) sebagaimana dimaksud dalam UU PDP, kami bertanggung
              jawab atas pemrosesan data yang dilakukan melalui platform ini.
            </p>
            <p className="mt-2">
              Kontak Penanggung Jawab Data (Data Protection Officer):{" "}
              <a
                href="mailto:dpo@ineedhelp-registry.id"
                className="text-blue-600 hover:underline"
              >
                dpo@ineedhelp-registry.id
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">2. Data yang Kami Kumpulkan</h2>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-800">Data Akun Tenaga Kesehatan</p>
                <ul className="mt-1 ml-4 list-disc space-y-0.5 text-gray-600">
                  <li>Nama lengkap dan gelar profesi</li>
                  <li>Alamat email institusi</li>
                  <li>Nama dan jenis fasilitas kesehatan</li>
                  <li>Catatan persetujuan penelitian (timestamp)</li>
                  <li>Data sesi login (IP address, user agent) — untuk keamanan akses</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Data Klinis Pasien (Pseudoanonim)</p>
                <p className="text-gray-600 mt-0.5">
                  Platform ini <strong>tidak menyimpan identitas langsung pasien</strong>. Data yang
                  dikumpulkan bersifat pseudoanonim:
                </p>
                <ul className="mt-1 ml-4 list-disc space-y-0.5 text-gray-600">
                  <li>Inisial pasien (bukan nama lengkap)</li>
                  <li>Usia dan jenis kelamin</li>
                  <li>Parameter klinis: tekanan darah, denyut jantung, LVEF, eGFR, NT-proBNP</li>
                  <li>Status komorbiditas (DM, HT, CKD, AF)</li>
                  <li>Status terapi GDMT</li>
                  <li>Hasil skor triase I-NEED-HELP dan rekomendasi</li>
                  <li>Status outcome follow-up 30 hari</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">3. Tujuan Pemrosesan Data</h2>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>Mendukung keputusan klinis triase gagal jantung berbasis skor I-NEED-HELP</li>
              <li>Membangun registri klinis observasional untuk penelitian epidemiologi gagal jantung</li>
              <li>Analisis statistik untuk publikasi ilmiah (data diagregasi/anonim)</li>
              <li>Evaluasi kualitas tata laksana GDMT di fasilitas kesehatan primer dan sekunder</li>
            </ul>
            <p className="mt-2 text-gray-600">
              Data <strong>tidak</strong> diperjualbelikan, tidak digunakan untuk keperluan komersial,
              dan tidak dibagikan kepada pihak ketiga tanpa persetujuan eksplisit peneliti utama.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">4. Dasar Hukum Pemrosesan</h2>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>
                <strong>Persetujuan (consent)</strong> — Pasal 20 UU PDP: persetujuan diberikan
                saat registrasi akun
              </li>
              <li>
                <strong>Kepentingan penelitian ilmiah</strong> — Pasal 26 UU PDP: pemrosesan data
                untuk tujuan ilmiah yang sah dengan anonimisasi yang memadai
              </li>
              <li>
                <strong>ICH E6(R3) Good Clinical Practice</strong> — panduan etika penelitian
                klinis internasional
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">5. Keamanan Data</h2>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>Seluruh data tersimpan di database PostgreSQL terenkripsi (Neon, region AP-Southeast-1)</li>
              <li>Koneksi menggunakan TLS 1.2+ dan channel binding</li>
              <li>Akses data dilindungi autentikasi sesi (Better Auth) dengan token unik per sesi</li>
              <li>Setiap akses data dibatasi hanya pada data milik akun yang terautentikasi</li>
              <li>Password disimpan dalam bentuk hash menggunakan algoritma bcrypt</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">6. Retensi Data</h2>
            <p className="text-gray-600">
              Data akun dan data klinis disimpan selama akun aktif. Sesuai keperluan registri
              klinis, data penelitian dapat dipertahankan hingga <strong>10 tahun</strong> sejak
              pengumpulan untuk keperluan validasi hasil penelitian dan publikasi lanjutan.
              Setelah periode tersebut, data akan dianonimkan penuh atau dihapus.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">7. Hak Subjek Data (Pasal 5 UU PDP)</h2>
            <p className="text-gray-600 mb-2">
              Anda sebagai pengguna (tenaga kesehatan) memiliki hak-hak berikut atas data akun Anda:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li><strong>Hak Akses</strong> — Melihat data yang kami simpan tentang Anda</li>
              <li><strong>Hak Koreksi</strong> — Memperbarui data yang tidak akurat</li>
              <li>
                <strong>Hak Penghapusan</strong> — Menghapus akun beserta seluruh data klinis
                melalui menu pengaturan akun, atau menghubungi DPO
              </li>
              <li><strong>Hak Pembatasan</strong> — Meminta pembatasan pemrosesan data Anda</li>
              <li>
                <strong>Hak Penarikan Persetujuan</strong> — Menarik consent kapan saja; namun
                penarikan tidak berlaku retroaktif terhadap data yang telah diproses secara sah
              </li>
            </ul>
            <p className="mt-2 text-gray-600">
              Untuk menggunakan hak-hak di atas, hubungi:{" "}
              <a href="mailto:dpo@ineedhelp-registry.id" className="text-blue-600 hover:underline">
                dpo@ineedhelp-registry.id
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">8. Notifikasi Pelanggaran Data</h2>
            <p className="text-gray-600">
              Sesuai ketentuan UU PDP, apabila terjadi pelanggaran keamanan data yang berdampak
              pada data pribadi pengguna, kami akan memberitahukan kepada pengguna yang terdampak
              dalam waktu paling lambat <strong>14 hari kerja</strong> sejak kami mengetahui
              pelanggaran tersebut, melalui email yang terdaftar pada akun.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">9. Pembaruan Kebijakan</h2>
            <p className="text-gray-600">
              Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan material akan
              diberitahukan melalui email terdaftar. Penggunaan platform setelah tanggal efektif
              perubahan dianggap sebagai persetujuan atas kebijakan yang diperbarui.
            </p>
          </section>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              Versi: 1.0 · Berlaku sejak 17 Juni 2026 · Referensi hukum: UU No. 27/2022 (UU PDP),
              Permenkominfo No. 5/2020, ICH E6(R3), Permenkes No. 24/2022
            </p>
            <div className="flex gap-4 mt-3">
              <Link href="/terms" className="text-xs text-blue-600 hover:underline">
                Syarat &amp; Ketentuan
              </Link>
              <Link href="/login" className="text-xs text-gray-400 hover:underline">
                Kembali ke Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
