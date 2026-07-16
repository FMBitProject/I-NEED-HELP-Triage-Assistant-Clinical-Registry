import { describe, expect, it } from "vitest";
import {
  FOLLOW_UP_DAYS,
  QUIET_DAYS,
  daysSinceTriage,
  isFollowUpDue,
  isInObservation,
  isPastQuietPeriod,
} from "./followup";

const NOW = new Date("2026-07-03T12:00:00Z").getTime();

function patient(daysAgo: number, opts: { outcome?: boolean; triageDaysAgo?: number } = {}) {
  const iso = (d: number) => new Date(NOW - d * 86400000).toISOString();
  return {
    createdAt: iso(daysAgo),
    triage:
      opts.triageDaysAgo !== undefined ? { createdAt: iso(opts.triageDaysAgo) } : null,
    outcome: opts.outcome ? { status: "STABLE" } : null,
  };
}

describe("daysSinceTriage", () => {
  it("menghitung dari tanggal triase jika ada", () => {
    expect(daysSinceTriage(patient(40, { triageDaysAgo: 10 }), NOW)).toBe(10);
  });

  it("fallback ke tanggal pasien dibuat jika belum ada triase", () => {
    expect(daysSinceTriage(patient(7), NOW)).toBe(7);
  });
});

describe("isFollowUpDue", () => {
  it("pasien baru ditriase hari ini TIDAK jatuh tempo", () => {
    expect(isFollowUpDue(patient(0), NOW)).toBe(false);
  });

  it("pasien 29 hari belum jatuh tempo (masih observasi)", () => {
    expect(isFollowUpDue(patient(29), NOW)).toBe(false);
    expect(isInObservation(patient(29), NOW)).toBe(true);
  });

  it(`pasien tepat ${FOLLOW_UP_DAYS} hari jatuh tempo`, () => {
    expect(isFollowUpDue(patient(30), NOW)).toBe(true);
    expect(isInObservation(patient(30), NOW)).toBe(false);
  });

  it("pasien >30 hari yang sudah punya outcome tidak dihitung", () => {
    expect(isFollowUpDue(patient(45, { outcome: true }), NOW)).toBe(false);
    expect(isInObservation(patient(45, { outcome: true }), NOW)).toBe(false);
  });

  it("acuan waktu adalah triase terakhir, bukan tanggal registrasi", () => {
    // Terdaftar 60 hari lalu tapi baru ditriase ulang 5 hari lalu → observasi
    expect(isFollowUpDue(patient(60, { triageDaysAgo: 5 }), NOW)).toBe(false);
    expect(isInObservation(patient(60, { triageDaysAgo: 5 }), NOW)).toBe(true);
  });
});

describe("masa senyap (quiet period)", () => {
  it(`pasien ${QUIET_DAYS - 1} hari masih dihitung jatuh tempo`, () => {
    expect(isFollowUpDue(patient(QUIET_DAYS - 1), NOW)).toBe(true);
    expect(isPastQuietPeriod(patient(QUIET_DAYS - 1), NOW)).toBe(false);
  });

  it(`pasien >= ${QUIET_DAYS} hari keluar dari badge dan masuk masa senyap`, () => {
    expect(isFollowUpDue(patient(QUIET_DAYS), NOW)).toBe(false);
    expect(isPastQuietPeriod(patient(QUIET_DAYS), NOW)).toBe(true);
    expect(isFollowUpDue(patient(90), NOW)).toBe(false);
    expect(isPastQuietPeriod(patient(90), NOW)).toBe(true);
  });

  it("pasien dengan outcome tidak pernah masuk masa senyap", () => {
    expect(isPastQuietPeriod(patient(90, { outcome: true }), NOW)).toBe(false);
  });
});
