Product Requirements Document (PRD)
I-NEED-HELP Triage Assistant & Clinical Registry
1. Informasi Meta
●	Nama Produk: I-NEED-HELP Triage Assistant & Registry
●	Fokus: Sistem Pendukung Keputusan Klinis & Registri Penelitian (Clinical Decision Support & Research Registry)
●	Target Pengguna: Dokter Umum (GP) di Fasilitas Kesehatan Primer (Puskesmas/Klinik) dan Dokter Jaga IGD
●	Platform: Web Application (Mobile-First, Progressive Web App / PWA)
●	Status: Draft MVP (Research-Ready)
2. Latar Belakang & Objektif
Masalah: Gagal jantung memiliki tingkat mortalitas dan rehospitalisasi yang tinggi di Indonesia. Banyak pasien di fasilitas layanan primer yang mengalami perburukan namun terlambat dirujuk. Di sisi lain, Indonesia kekurangan data real-world terkait demografi, profil komorbiditas, dan pola peresepan (GDMT) di fasilitas primer untuk publikasi ilmiah.
Solusi: Mendigitalkan parameter triase klinis I-NEED-HELP menjadi aplikasi web interaktif (PWA) yang sekaligus berfungsi sebagai alat pengumpul data observasional anonim (Clinical Registry).
Objektif: 1. Menghasilkan rekomendasi rujukan klinis yang instan (< 1 menit).
2. Membangun basis data siap-publikasi (Research-Ready DB) yang kaya akan variabel klinis (demografi, komorbid, triase, GDMT, dan outcomes).
3. Tech Stack (Tumpukan Teknologi)
Aplikasi ini dirancang untuk pengembangan yang cepat, skalabel, ramah analisis data, dan dapat diakses offline:
●	Framework: Next.js (App Router) + next-pwa (untuk kapabilitas offline/installable)
●	Styling: Tailwind CSS
●	UI Components: shadcn/ui
●	Authentication: Better Auth (Sederhana dan aman untuk dokter)
●	ORM: Drizzle ORM (Sangat baik untuk query relasional saat ekstraksi data riset)
●	Database: Neon (Serverless PostgreSQL - Mudah diekspor ke CSV/Excel untuk SPSS/Stata)
●	Deployment: Vercel
●	IDE: Project IDX
4. Variabel Riset & Kriteria Triase (Data Dictionary)
Sistem akan mengumpulkan 3 lapisan data utama untuk keperluan klinis dan publikasi:
A. Baseline Characteristics (Karakteristik Dasar)
●	Inisial & Umur (Tahun)
●	Jenis Kelamin (L/P)
●	Tekanan Darah Sistolik & Diastolik (mmHg)
●	Detak Jantung / Heart Rate (bpm)
●	Komorbiditas Utama (Checkbox): Diabetes Melitus, Hipertensi, Penyakit Ginjal Kronis (CKD), Atrial Fibrilasi (AF).
●	Data Lab (Opsional): eGFR / Creatinine, NT-proBNP. (Krusial untuk justifikasi non-peresepan GDMT tertentu).
●	Status GDMT saat ini (Checkbox): ACE-I/ARB/ARNI, B-Blocker, MRA, SGLT2i.
B. Skoring I-NEED-HELP (Triage Data)
| Parameter | Kriteria Klinis | Input UI |
| I | Pasien membutuhkan inotropik intravena. | Checkbox |
| N | NYHA IIIB/IV atau peningkatan persisten Natriuretic Peptide. | Checkbox |
| E | Terdapat disfungsi organ akhir. | Checkbox |
| E | Fraksi ejeksi (LVEF) < 35%. | Checkbox |
| D | Riwayat kejut defibrilator. | Checkbox |
| H | Rawat inap karena gagal jantung > 1 kali dalam setahun. | Checkbox |
| E | Edema persisten meski dosis diuretik telah ditingkatkan. | Checkbox |
| L | Tekanan darah rendah dengan detak jantung tinggi. | Checkbox |
| P | Intoleransi progresif atau butuh penurunan dosis GDMT. | Checkbox |
C. Clinical Outcomes (Data Follow-up)
●	Status 30-Hari: Rawat Jalan Stabil / Rawat Inap Ulang / Rujuk Faskes Lanjut / Meninggal Dunia.
5. Cakupan Fitur MVP (Minimum Viable Product)
1.	Sistem Autentikasi & Persetujuan Riset:
○	Login via Better Auth. Persetujuan bahwa agregasi data pasien anonim dikumpulkan untuk registri ilmiah.
2.	Form Triase 2-Tahap Cepat (Wizard Form):
○	Tahap 1: Input Profil, Komorbid, Lab (opsional) & Status Obat. (Dioptimalkan untuk pengisian < 30 detik).
○	Tahap 2: Ceklis I-NEED-HELP.
3.	Scoring Engine:
○	Hasil Merah (Butuh Rujukan) vs Hasil Hijau (Lanjutkan GDMT).
4.	Follow-up / Outcome Tracker:
○	Notifikasi di dashboard dokter jika ada pasien yang belum di-update status outcome-nya setelah masa triase.
5.	Personal Clinical Audit Dashboard (Fitur Retensi Dokter):
○	Dasbor statistik pribadi untuk memotivasi dokter: Total pasien di-triase, persentase resep GDMT, komparasi performa terapi personal dengan guideline.
6.	Research Export (Super Admin Mode):
○	Tombol satu-klik untuk mengunduh seluruh database dalam .csv (format rapi untuk SPSS/Stata/R).
6. Desain Skema Basis Data (Database Schema)
Dirancang menggunakan Drizzle ORM agar siap dianalisis secara statistik.
Tabel users (Data Dokter / Peneliti)
●	id: UUID (PK)
●	email: String (Unique)
●	name: String
●	institution_type: String (Puskesmas, RS Tipe C, dll)
●	created_at: Timestamp
Tabel patients (Karakteristik & Komorbiditas)
●	id: UUID (PK)
●	doctor_id: UUID (FK ke users.id)
●	patient_initial: String
●	age: Integer
●	gender: Enum ('M', 'F')
●	systolic_bp: Integer
●	diastolic_bp: Integer
●	heart_rate: Integer
●	lvef: Integer (Nullable)
●	egfr: Decimal (Nullable) -> Lab opsional
●	nt_probnp: Integer (Nullable) -> Lab opsional
●	comorbid_dm: Boolean
●	comorbid_htn: Boolean
●	comorbid_ckd: Boolean
●	comorbid_af: Boolean
●	on_ace_arni: Boolean
●	on_bb: Boolean
●	on_mra: Boolean
●	on_sglt2i: Boolean
●	created_at: Timestamp
Tabel triage_logs (Hasil Triase)
●	id: UUID (PK)
●	patient_id: UUID (FK ke patients.id)
●	score: Integer
●	criteria_met: JSON
●	recommendation_given: String
●	created_at: Timestamp
Tabel outcomes (Clinical Endpoint)
●	id: UUID (PK)
●	patient_id: UUID (FK ke patients.id)
●	status: Enum ('STABLE', 'HOSPITALIZED', 'REFERRED', 'DECEASED', 'LOST_TO_FOLLOWUP')
●	follow_up_days: Integer
●	recorded_at: Timestamp
7. Alur Pengguna (User Flow)
1.	Akses & Login: Dokter membuka PWA dan login. Dasbor akan langsung menampilkan statistik triase pribadi.
2.	Entry (Tahap 1): Input TTV, ceklis komorbiditas, lab (jika ada), dan GDMT current status.
3.	Triage (Tahap 2): Mencentang kriteria perburukan I-NEED-HELP.
4.	Result: Mendapat panduan warna hijau atau merah beserta anjuran klinis resmi (sesuai Guidelines PERKI).
5.	Follow-up: Dokter membuka log minggu depan, lalu meng-klik update status (stabil/dirujuk/meninggal).
