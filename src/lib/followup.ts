// Logika jatuh tempo follow-up sesuai PRD: notifikasi muncul jika pasien
// belum di-update status outcome-nya SETELAH masa observasi (30 hari sejak
// pendaftaran), bukan sejak hari pertama pendaftaran.
//
// Follow-up bersifat oportunistik — dicatat saat pasien kebetulan datang
// kembali, bukan kewajiban dokter menghubungi pasien. Setelah QUIET_DAYS
// (60 hari) pengingat berhenti menekan: pasien tidak lagi dihitung di badge
// notifikasi dan cukup ditandai "Lost to Follow-up" dengan satu ketukan.

export const FOLLOW_UP_DAYS = 30;
export const QUIET_DAYS = 60;

type PatientLike = {
  createdAt: string;
  outcome?: unknown | null;
};

/** Hari sejak pasien didaftarkan. */
export function daysSinceRegistration(p: PatientLike, now = Date.now()): number {
  return Math.floor((now - new Date(p.createdAt).getTime()) / 86400000);
}

/**
 * Jatuh tempo aktif: belum ada outcome, masa observasi (30 hari) sudah lewat,
 * tapi belum melewati masa senyap (60 hari). Hanya pasien di jendela ini
 * yang dihitung di badge/alert.
 */
export function isFollowUpDue(p: PatientLike, now = Date.now()): boolean {
  const days = daysSinceRegistration(p, now);
  return !p.outcome && days >= FOLLOW_UP_DAYS && days < QUIET_DAYS;
}

/** Masih dalam masa observasi: belum ada outcome tapi belum 30 hari. */
export function isInObservation(p: PatientLike, now = Date.now()): boolean {
  return !p.outcome && daysSinceRegistration(p, now) < FOLLOW_UP_DAYS;
}

/**
 * Sudah melewati masa senyap (60 hari) tanpa outcome — pengingat berhenti;
 * tawarkan penandaan Lost to Follow-up satu-tap.
 */
export function isPastQuietPeriod(p: PatientLike, now = Date.now()): boolean {
  return !p.outcome && daysSinceRegistration(p, now) >= QUIET_DAYS;
}
