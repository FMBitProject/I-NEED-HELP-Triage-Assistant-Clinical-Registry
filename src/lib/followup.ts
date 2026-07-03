// Logika jatuh tempo follow-up sesuai PRD: notifikasi muncul jika pasien
// belum di-update status outcome-nya SETELAH masa triase (30 hari), bukan
// sejak hari pertama triase.

export const FOLLOW_UP_DAYS = 30;

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

/** Jatuh tempo: belum ada outcome DAN masa triase (30 hari) sudah lewat. */
export function isFollowUpDue(p: PatientLike, now = Date.now()): boolean {
  return !p.outcome && daysSinceTriage(p, now) >= FOLLOW_UP_DAYS;
}

/** Masih dalam masa observasi: belum ada outcome tapi belum 30 hari. */
export function isInObservation(p: PatientLike, now = Date.now()): boolean {
  return !p.outcome && daysSinceTriage(p, now) < FOLLOW_UP_DAYS;
}
