Product Requirements Document (PRD)
Registry Gagal Jantung
1. Informasi Meta
●	Nama Produk: Registry Gagal Jantung
●	Fokus: Registri Klinis Penelitian & Pemantauan Kepatuhan Terapi GDMT (Clinical Research Registry)
●	Target Pengguna: Dokter di Rumah Sakit (RS) yang memiliki kapasitas lab NT-proBNP untuk konfirmasi diagnosis gagal jantung
●	Platform: Web Application (Mobile-First, Progressive Web App / PWA)
●	Status: MVP (Research-Ready)
2. Latar Belakang & Objektif
Masalah: Gagal jantung memiliki tingkat mortalitas dan rehospitalisasi yang tinggi di Indonesia. Indonesia kekurangan data real-world terkait demografi, profil komorbiditas, dan pola peresepan (GDMT) di rumah sakit untuk publikasi ilmiah.
Solusi: Aplikasi web (PWA) yang menjadi alat pengumpul data registri observasional pasien gagal jantung, sekaligus memantau kelengkapan terapi GDMT (4 pilar) per pasien dan per dokter.
Catatan cakupan: Produk ini sebelumnya juga mencakup ceklis skoring triase I-NEED-HELP (rekomendasi rujuk vs lanjut GDMT). Fitur triase tersebut dihapus karena kriteria inklusi registri mewajibkan NT-proBNP untuk konfirmasi diagnosis — pemeriksaan yang umumnya hanya tersedia di rumah sakit, bukan di klinik/faskes primer. Produk kini fokus murni sebagai registri pasien RS dan pemantau kepatuhan GDMT.
Objektif:
1. Membangun basis data siap-publikasi (Research-Ready DB) yang kaya akan variabel klinis (demografi, komorbid, GDMT, dan outcomes).
2. Memberi dokter gambaran cepat kepatuhan terapi GDMT pada pasiennya sendiri maupun lintas rumah sakit (untuk admin).
3. Tech Stack (Tumpukan Teknologi)
Aplikasi ini dirancang untuk pengembangan yang cepat, skalabel, ramah analisis data, dan dapat diakses offline:
●	Framework: Next.js (App Router) + PWA (kapabilitas offline/installable)
●	Styling: Tailwind CSS
●	UI Components: shadcn/ui
●	Authentication: Better Auth (Sederhana dan aman untuk dokter)
●	ORM: Drizzle ORM (Sangat baik untuk query relasional saat ekstraksi data riset)
●	Database: Neon (Serverless PostgreSQL - Mudah diekspor ke CSV/Excel untuk SPSS/Stata)
●	Deployment: Vercel
4. Variabel Riset (Data Dictionary)
Sistem mengumpulkan data berikut untuk keperluan klinis dan publikasi:
A. Baseline Characteristics (Karakteristik Dasar)
●	Inisial & Umur (Tahun)
●	Jenis Kelamin (L/P)
●	Tekanan Darah Sistolik & Diastolik (mmHg)
●	Detak Jantung / Heart Rate (bpm)
●	Kelas Fungsional NYHA (I–IV)
●	Onset Gagal Jantung: De Novo / Kronik / Tidak Diketahui
●	Komorbiditas Utama (Checkbox): Diabetes Melitus, Hipertensi, Penyakit Ginjal Kronis (CKD), Atrial Fibrilasi (AF).
●	Data Lab: NT-proBNP (wajib, kriteria inklusi registri), eGFR / Creatinine dan LVEF (opsional).
●	Status GDMT saat ini (Checkbox): ACE-I/ARB/ARNI, Beta-Blocker, MRA, SGLT2i — beserta alasan bila salah satu pilar tidak diberikan (kontraindikasi, tidak tersedia, tidak diresepkan, hambatan pasien, tidak diketahui, atau lainnya).
●	Disposisi Akhir IGD (opsional): Dipulangkan / Rawat Inap / Dirujuk / Meninggal di IGD.
B. Clinical Outcomes (Data Follow-up)
●	Status 30-Hari: Rawat Jalan Stabil / Rawat Inap Ulang / Dirujuk ke Faskes Lanjut / Meninggal Dunia / Lost to Follow-up.
●	Tanggal masuk & keluar rawat inap (bila status Rawat Inap Ulang).
5. Cakupan Fitur MVP (Minimum Viable Product)
1.	Sistem Autentikasi & Persetujuan Riset:
○	Login via Better Auth. Persetujuan bahwa agregasi data pasien anonim dikumpulkan untuk registri ilmiah. Akun dokter baru harus disetujui admin sebelum dapat mengisi data.
2.	Form Registrasi Pasien:
○	Input profil, tanda vital, komorbiditas, lab (NT-proBNP wajib), status GDMT saat ini beserta alasan omisi, dan disposisi akhir IGD (opsional).
3.	Personal Clinical Audit Dashboard (Fitur Retensi Dokter):
○	Dasbor statistik pribadi: Total pasien terdaftar, persentase kelengkapan GDMT, tren pendaftaran bulanan, pasien yang perlu follow-up.
4.	Follow-up / Outcome Tracker:
○	Notifikasi di dashboard dokter jika ada pasien yang belum di-update status outcome-nya setelah masa observasi 30 hari sejak pendaftaran.
5.	Edit Data & Finalisasi:
○	Dokter dapat mengedit data pasiennya sendiri, lalu mengunci (finalize) data setelah entri selesai. Data terkunci hanya dapat diubah lewat permintaan ke developer, dengan audit trail perubahan.
6.	Registry & Export Lintas Dokter (Admin):
○	Admin dapat melihat rekap seluruh dokter dan mengunduh seluruh database dalam .csv (satu baris per pasien, format rapi untuk SPSS/Stata/R).
6. Desain Skema Basis Data (Database Schema)
Dirancang menggunakan Drizzle ORM agar siap dianalisis secara statistik.
Tabel user (Data Dokter / Peneliti)
●	id: Text (PK)
●	email: String (Unique)
●	name: String
●	institution_type: String (RS Tipe A/B/C, dll)
●	role: Enum ('DOCTOR', 'ADMIN')
●	approved: Boolean
●	ethical_clearance_no / ethical_clearance_date: String (Nullable)
●	created_at: Timestamp
Tabel patients (Karakteristik, Komorbiditas & GDMT)
●	id: Text (PK)
●	doctor_id: Text (FK ke user.id)
●	patient_initial: String
●	age: Integer
●	gender: Enum ('M', 'F')
●	systolic_bp / diastolic_bp: Integer
●	heart_rate: Integer
●	lvef: Integer (Nullable)
●	egfr: Decimal (Nullable)
●	nt_probnp: Integer (wajib diisi di form; kriteria inklusi registri)
●	nyha_class: String (Nullable)
●	hf_onset: String (Nullable) -> DE_NOVO / CHRONIC / UNKNOWN
●	ed_disposition: String (Nullable) -> DISCHARGED / ADMITTED / REFERRED / DECEASED_ED
●	comorbid_dm / comorbid_htn / comorbid_ckd / comorbid_af: Boolean
●	on_ace_arni / on_bb / on_mra / on_sglt2i: Boolean
●	no_*_reason / no_*_reason_other: String (Nullable) -> alasan per pilar GDMT yang tidak diberikan
●	created_at: Timestamp
●	finalized_at: Timestamp (Nullable)
Tabel outcomes (Clinical Endpoint)
●	id: Text (PK)
●	patient_id: Text (FK ke patients.id)
●	status: Enum ('STABLE', 'HOSPITALIZED', 'REFERRED', 'DECEASED', 'LOST_TO_FOLLOWUP')
●	follow_up_days: Integer
●	admission_date / discharge_date: Date (Nullable)
●	notes: Text (Nullable)
●	recorded_at: Timestamp
Tabel audit_logs (Riwayat Perubahan)
●	id: Text (PK)
●	patient_id: Text (FK ke patients.id)
●	user_id / user_name: Text (Nullable)
●	action: String -> create / update / finalize / unlock_request / delete
●	changed_field / old_value / new_value: Text (Nullable)
●	created_at: Timestamp
7. Alur Pengguna (User Flow)
1.	Akses & Login: Dokter membuka PWA dan login. Dasbor akan langsung menampilkan statistik registrasi pribadi.
2.	Registrasi Pasien: Input TTV, NYHA, onset gagal jantung, komorbiditas, lab (NT-proBNP wajib), status GDMT saat ini beserta alasan omisi, dan disposisi akhir IGD (opsional).
3.	Detail Pasien: Dokter dapat melihat ringkasan data, mengedit, atau memfinalisasi data pasien.
4.	Follow-up: Dokter membuka log follow-up, lalu meng-klik update status (stabil/rawat inap/dirujuk/meninggal/lost to follow-up).
5.	Export (Admin): Admin mengunduh seluruh database registri dalam .csv untuk analisis statistik.
