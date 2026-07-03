import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Syarat &amp; Ketentuan Penggunaan</h1>
            <p className="text-sm text-gray-500">I-NEED-HELP Triage Assistant &amp; Clinical Registry</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-700">
          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">1. Definisi</h2>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>
                <strong>Platform</strong> — Aplikasi web I-NEED-HELP Triage Assistant &amp;
                Clinical Registry beserta seluruh API dan layanan terkait.
              </li>
              <li>
                <strong>Pengguna</strong> — Tenaga kesehatan (dokter) yang terdaftar dan
                menggunakan platform.
              </li>
              <li>
                <strong>Data Klinis</strong> — Parameter medis pseudoanonim yang dimasukkan
                melalui platform (tanpa identitas langsung pasien).
              </li>
              <li>
                <strong>Registri</strong> — Kumpulan data klinis observasional yang digunakan
                untuk keperluan penelitian ilmiah non-interventional.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">2. Syarat Penggunaan</h2>
            <p className="text-gray-600 mb-2">Platform ini <strong>hanya boleh digunakan oleh</strong>:</p>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>Dokter atau tenaga medis yang memiliki Surat Tanda Registrasi (STR) yang sah</li>
              <li>Tenaga kesehatan yang bekerja di fasilitas kesehatan teregistrasi di Indonesia</li>
              <li>
                Peneliti yang berafiliasi dengan institusi pendidikan kesehatan atau rumah sakit
                yang telah memperoleh persetujuan komite etik (ethical clearance) untuk penggunaan
                data registri
              </li>
            </ul>
            <p className="mt-2 text-gray-600">
              Pendaftaran akun yang tidak memenuhi syarat di atas dapat dibatalkan sewaktu-waktu
              tanpa pemberitahuan sebelumnya.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">3. Kewajiban Pengguna</h2>
            <p className="text-gray-600 mb-2">Dengan menggunakan platform ini, Anda menyatakan bahwa:</p>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>
                Anda telah memperoleh <strong>informed consent</strong> dari pasien (atau wali
                yang sah) sebelum memasukkan data klinis ke dalam sistem, sesuai prinsip etika
                penelitian yang berlaku.
              </li>
              <li>
                Anda hanya memasukkan data dalam bentuk <strong>pseudoanonim</strong> — inisial,
                bukan nama lengkap atau nomor identitas pasien.
              </li>
              <li>
                Anda bertanggung jawab menjaga kerahasiaan kredensial akun (email dan password)
                dan tidak membagikannya kepada pihak lain.
              </li>
              <li>
                Anda menggunakan platform semata-mata untuk tujuan klinis dan/atau penelitian
                ilmiah yang sah — bukan untuk tujuan komersial atau hal-hal yang bertentangan
                dengan etika profesi kedokteran.
              </li>
              <li>
                Anda memahami bahwa data yang dimasukkan dapat digunakan dalam analisis
                agregat anonim untuk publikasi ilmiah.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">4. Batasan Tanggung Jawab</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <p className="text-amber-900 text-xs font-semibold mb-1">Peringatan Penting</p>
              <p className="text-amber-800 text-xs">
                Platform ini adalah alat bantu keputusan klinis (clinical decision support tool),
                bukan pengganti penilaian klinis dokter yang terlatih.
              </p>
            </div>
            <ul className="ml-4 list-disc space-y-1 text-gray-600">
              <li>
                Hasil skor triase I-NEED-HELP bersifat rekomendatif berdasarkan algoritma yang
                telah dipublikasikan. Keputusan tata laksana akhir sepenuhnya merupakan tanggung
                jawab dokter yang memeriksa pasien.
              </li>
              <li>
                Platform ini <strong>bukan sistem rekam medis (EMR)</strong> dan tidak menggantikan
                kewajiban pencatatan rekam medis sesuai Permenkes No. 24 Tahun 2022.
              </li>
              <li>
                Pengelola platform tidak bertanggung jawab atas kerugian yang timbul akibat
                keputusan klinis yang semata-mata mengandalkan output platform ini.
              </li>
              <li>
                Ketersediaan platform (<em>uptime</em>) tidak dijamin 100%. Jangan mengandalkan
                platform ini untuk situasi gawat darurat yang membutuhkan respons segera.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">5. Hak Kekayaan Intelektual</h2>
            <p className="text-gray-600">
              Algoritma skor I-NEED-HELP, antarmuka platform, dan seluruh konten di dalamnya
              adalah milik tim peneliti. Data klinis yang dimasukkan oleh pengguna tetap menjadi
              milik institusi/pengguna yang bersangkutan, namun pengguna memberikan lisensi kepada
              pengelola untuk menggunakannya dalam analisis agregat anonim untuk keperluan
              penelitian ilmiah.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">
              6. Penghentian dan Penghapusan Akun
            </h2>
            <p className="text-gray-600">
              Pengguna dapat menghapus akun beserta seluruh data klinis yang terkait kapan saja
              melalui menu <strong>Pengaturan Akun</strong>. Penghapusan akun bersifat permanen
              dan tidak dapat dibatalkan. Data yang telah diikutsertakan dalam analisis agregat
              yang sudah dipublikasikan tidak dapat ditelusuri kembali ke akun yang telah dihapus.
            </p>
            <p className="mt-2 text-gray-600">
              Pengelola berhak menangguhkan atau menghapus akun yang melanggar ketentuan ini
              tanpa pemberitahuan sebelumnya.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">7. Perubahan Ketentuan</h2>
            <p className="text-gray-600">
              Pengelola dapat memperbarui Syarat &amp; Ketentuan ini sewaktu-waktu. Perubahan
              material akan diberitahukan melalui email terdaftar minimal 14 hari sebelum berlaku.
              Penggunaan platform setelah tanggal efektif perubahan dianggap sebagai penerimaan
              atas ketentuan yang diperbarui.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">8. Hukum yang Berlaku</h2>
            <p className="text-gray-600">
              Syarat &amp; Ketentuan ini tunduk pada hukum Republik Indonesia. Segala sengketa
              yang timbul diselesaikan melalui musyawarah mufakat, atau jika tidak tercapai,
              melalui pengadilan yang berwenang di Indonesia.
            </p>
            <p className="mt-2 text-gray-600">
              Referensi regulasi: UU No. 27/2022 (UU PDP), Permenkominfo No. 5/2020 (PSE),
              Permenkes No. 24/2022, ICH E6(R3) Good Clinical Practice.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 text-base mb-2">9. Kontak</h2>
            <p className="text-gray-600">
              Pertanyaan terkait ketentuan ini dapat diajukan ke:{" "}
              <a href="mailto:dpo@ineedhelp-registry.id" className="text-blue-600 hover:underline">
                dpo@ineedhelp-registry.id
              </a>
            </p>
          </section>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              Versi: 1.0 · Berlaku sejak 17 Juni 2026
            </p>
            <div className="flex gap-4 mt-3">
              <Link href="/privacy-policy" className="text-xs text-blue-600 hover:underline">
                Kebijakan Privasi
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
