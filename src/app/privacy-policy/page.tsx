import Link from "next/link";
import { HeartPulse, Shield, ArrowLeft } from "lucide-react";

// Catatan untuk pengelola: isi halaman ini harus SELALU sesuai dengan
// perilaku aplikasi yang sebenarnya. Klaim yang tidak benar (mis. algoritma
// hash, lokasi server, tenggat notifikasi) justru melanggar asas
// keterbukaan UU PDP. Bila kode berubah, cek ulang halaman ini.

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
            <p className="text-sm text-gray-500">Registry Gagal Jantung</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800">
            Kebijakan ini berlaku sejak <strong>10 November 2026</strong> dan mengacu pada{" "}
            <strong>UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</strong>,{" "}
            <strong>Permenkes No. 24 Tahun 2022 tentang Rekam Medis</strong>, dan prinsip etika
            penelitian kesehatan.
          </p>
        </div>

        <div className="space-y-6 text-sm text-gray-700">
          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">1. Pengelola Data</h2>
            <p>
              Platform <strong>Registry Gagal Jantung</strong> dikelola oleh tim peneliti
              sebagai registri klinis observasional <strong>non-komersial</strong> untuk gagal
              jantung. Tim peneliti bertindak sebagai Pengendali Data Pribadi sebagaimana
              dimaksud dalam UU PDP.
            </p>
            <p className="mt-2">
              Kontak Pejabat Pelindungan Data Pribadi:{" "}
              <a
                href="mailto:renfael6@gmail.com"
                className="text-blue-600 hover:underline"
              >
                renfael6@gmail.com
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
                  <li>Alamat email</li>
                  <li>Jenis fasilitas kesehatan dan jenis dokter (umum/spesialis)</li>
                  <li>Catatan persetujuan penelitian dan nomor ethical clearance</li>
                  <li>Data sesi login (alamat IP, user agent) — untuk keamanan akses</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Data Klinis Pasien (Pseudonim)</p>
                <p className="text-gray-600 mt-0.5">
                  Platform ini <strong>tidak menyimpan identitas langsung pasien</strong> (nama,
                  NIK, alamat, nomor rekam medis). Sistem menolak inisial yang lebih dari 4 huruf
                  atau mengandung angka. Data yang dikumpulkan:
                </p>
                <ul className="mt-1 ml-4 list-disc space-y-0.5 text-gray-600">
                  <li>Inisial pasien (maksimal 4 huruf)</li>
                  <li>Usia dan jenis kelamin</li>
                  <li>Parameter klinis: tekanan darah, denyut jantung, LVEF, eGFR, NT-proBNP</li>
                  <li>Status komorbiditas (DM, HT, CKD, AF) dan kelas NYHA</li>
                  <li>Status terapi GDMT (4 pilar) beserta alasan bila tidak diberikan</li>
                  <li>Lokasi perawatan, disposisi, dan outcome follow-up 30 hari</li>
                  <li>Dasar persetujuan pasien (informed consent atau waiver komite etik)</li>
                </ul>
                <p className="text-gray-600 mt-2">
                  Meskipun tanpa nama, data ini tetap tergolong{" "}
                  <strong>data pribadi yang bersifat spesifik</strong> (data kesehatan, Pasal 4
                  UU PDP), sehingga kami memperlakukannya dengan perlindungan tingkat tinggi.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">3. Tujuan Pemrosesan Data</h2>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>Membangun registri klinis observasional untuk penelitian epidemiologi gagal jantung</li>
              <li>Analisis statistik untuk publikasi ilmiah (hasil hanya dilaporkan secara agregat)</li>
              <li>Evaluasi kualitas tata laksana GDMT di fasilitas kesehatan</li>
            </ul>
            <p className="mt-2 text-gray-600">
              Data <strong>tidak</strong> diperjualbelikan, tidak dipakai untuk iklan atau tujuan
              komersial, dan tidak dibagikan kepada pihak ketiga di luar tim peneliti tanpa
              persetujuan komite etik.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">4. Dasar Hukum Pemrosesan</h2>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>
                <strong>Data pasien</strong> — persetujuan pasien/wali (informed consent), atau
                waiver informed consent yang diberikan komite etik penelitian. Dasar ini{" "}
                <strong>wajib dicatat untuk setiap pasien</strong>; sistem menolak pendaftaran
                pasien tanpa catatan tersebut.
              </li>
              <li>
                <strong>Data akun tenaga kesehatan</strong> — persetujuan yang diberikan saat
                pendaftaran akun (Pasal 20 UU PDP).
              </li>
              <li>
                Pengecualian tertentu atas hak subjek data untuk{" "}
                <strong>kepentingan penelitian ilmiah</strong> sebagaimana diatur dalam UU PDP,
                sepanjang data diproses dengan pengamanan yang memadai.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">5. Siapa yang Dapat Mengakses Data</h2>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>
                <strong>Dokter</strong> hanya dapat melihat dan mengubah data pasien yang ia
                daftarkan sendiri, dan hanya setelah akunnya disetujui admin.
              </li>
              <li>
                <strong>Admin registri (tim peneliti)</strong> dapat membaca seluruh data untuk
                pengelolaan registri dan ekspor riset. Setiap unduhan data registri tercatat
                (siapa, kapan, dari alamat IP mana).
              </li>
              <li>
                <strong>File ekspor riset tidak memuat inisial pasien maupun nama dokter</strong>{" "}
                — pasien dan dokter hanya dikenali lewat ID acak.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">6. Penyimpanan &amp; Pemroses Data</h2>
            <p className="text-gray-600 mb-2">
              Kami menggunakan penyedia layanan berikut sebagai pemroses data:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>
                <strong>Neon</strong> (database PostgreSQL) — server di Singapura
                (ap-southeast-1), data terenkripsi saat disimpan
              </li>
              <li>
                <strong>Vercel</strong> (hosting aplikasi) — fungsi server dijalankan di
                Singapura (sin1)
              </li>
            </ul>
            <p className="mt-2 text-gray-600">
              Karena server berada di luar Indonesia, pemrosesan ini merupakan transfer data
              pribadi ke luar wilayah hukum Indonesia (Pasal 56 UU PDP). Singapura memiliki
              undang-undang pelindungan data pribadi (PDPA 2012) dengan tingkat pelindungan yang
              setara.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">7. Keamanan Data</h2>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>Seluruh koneksi dienkripsi dengan HTTPS/TLS</li>
              <li>Password disimpan dalam bentuk hash (scrypt), tidak pernah dalam teks asli</li>
              <li>Akses dilindungi sesi login dan pembatasan percobaan login (anti brute-force)</li>
              <li>Setiap perubahan data pasien tercatat di audit trail</li>
              <li>
                Salinan daftar pasien untuk mode offline dihapus dari perangkat saat Anda
                logout
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">8. Retensi Data</h2>
            <p className="text-gray-600">
              Data akun disimpan selama akun aktif. Data penelitian dapat dipertahankan hingga{" "}
              <strong>10 tahun</strong> sejak pengumpulan untuk keperluan validasi hasil
              penelitian dan publikasi lanjutan. Setelah periode tersebut, data akan dianonimkan
              penuh atau dihapus.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">9. Hak Subjek Data (Pasal 5–13 UU PDP)</h2>
            <p className="text-gray-600 mb-2">
              <strong>Tenaga kesehatan</strong> berhak atas data akunnya:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li><strong>Hak akses &amp; koreksi</strong> — melihat dan memperbarui data di menu Pengaturan</li>
              <li>
                <strong>Hak penghapusan</strong> — menghapus akun beserta seluruh data pasien
                yang ia daftarkan melalui menu Pengaturan
              </li>
              <li><strong>Hak menarik persetujuan</strong> — kapan saja, tanpa berlaku surut terhadap pemrosesan yang sah sebelumnya</li>
            </ul>
            <p className="text-gray-600 mt-3 mb-2">
              <strong>Pasien</strong> yang datanya tercatat di registri berhak:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>Mengetahui bahwa datanya digunakan untuk registri penelitian</li>
              <li>Menarik persetujuan dan meminta datanya dihapus dari registri</li>
            </ul>
            <p className="mt-2 text-gray-600">
              Pasien dapat menyampaikan permintaan ini kepada dokter yang merawatnya (yang dapat
              menghapus data langsung di aplikasi) atau kepada kontak Pejabat Pelindungan Data
              di bawah. Permintaan ditanggapi paling lambat <strong>3 × 24 jam</strong>.
            </p>
            <p className="mt-2 text-gray-600">
              Kontak:{" "}
              <a href="mailto:renfael6@gmail.com" className="text-blue-600 hover:underline">
                renfael6@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">10. Notifikasi Kegagalan Pelindungan Data</h2>
            <p className="text-gray-600">
              Apabila terjadi kebocoran atau kegagalan pelindungan data pribadi, kami akan
              memberitahukan secara tertulis kepada subjek data yang terdampak dan kepada lembaga
              pengawas pelindungan data pribadi paling lambat <strong>3 × 24 jam</strong> sejak
              kegagalan tersebut diketahui (Pasal 46 UU PDP). Pemberitahuan memuat data apa yang
              terungkap, kapan dan bagaimana terjadinya, serta langkah penanganan dan pemulihan.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">11. Pembaruan Kebijakan</h2>
            <p className="text-gray-600">
              Kebijakan privasi ini dapat diperbarui. Perubahan material akan diberitahukan
              melalui email terdaftar sebelum berlaku.
            </p>
          </section>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              Versi: 2.0 · Berlaku sejak 10 November 2026 · Referensi hukum: UU No. 27/2022 (UU
              PDP), Permenkes No. 24/2022, ICH E6(R3)
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
