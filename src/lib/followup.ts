// Logika jatuh tempo follow-up sesuai PRD: notifikasi muncul jika pasien
// belum di-update status outcome-nya SETELAH masa triase (30 hari), bukan
// sejak hari pertama triase.
//
// Follow-up bersifat oportunistik — dicatat saat pasien kebetulan datang
// kembali, bukan kewajiban dokter menghubungi pasien. Setelah QUIET_DAYS
// (60 hari) pengingat berhenti menekan: pasien tidak lagi dihitung di badge
// notifikasi dan cukup ditandai "Lost to Follow-up" dengan satu ketukan.

export const FOLLOW_UP_DAYS = 30;
export const QUIET_DAYS = 60;

type PatientLike = {
  createdAt: string;
  triage?: { createdAt: string } | null;
  outcome?: unknown | null;
};

/** Hari sejak triase terakhir (fallback: tanggal pasien dibuat). */
export function daysSinceTriage(p: PatientLike, now = Date.now()): number {
  const ref = p.triage?.createdAt ?? p.createdAt;
  return Math.floor((now - new Date(ref).getTime()) / 86400000);
}

/**
 * Jatuh tempo aktif: belum ada outcome, masa triase (30 hari) sudah lewat,
 * tapi belum melewati masa senyap (60 hari). Hanya pasien di jendela ini
 * yang dihitung di badge/alert.
 */
export function isFollowUpDue(p: PatientLike, now = Date.now()): boolean {
  const days = daysSinceTriage(p, now);
  return !p.outcome && days >= FOLLOW_UP_DAYS && days < QUIET_DAYS;
}

/** Masih dalam masa observasi: belum ada outcome tapi belum 30 hari. */
export function isInObservation(p: PatientLike, now = Date.now()): boolean {
  return !p.outcome && daysSinceTriage(p, now) < FOLLOW_UP_DAYS;
}

/**
 * Sudah melewati masa senyap (60 hari) tanpa outcome — pengingat berhenti;
 * tawarkan penandaan Lost to Follow-up satu-tap.
 */
export function isPastQuietPeriod(p: PatientLike, now = Date.now()): boolean {
  return !p.outcome && daysSinceTriage(p, now) >= QUIET_DAYS;
}
