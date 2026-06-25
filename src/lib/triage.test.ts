import { describe, expect, it } from "vitest";
import {
  calculateTriageScore,
  countGdmt,
  getRecommendation,
  getTriageResult,
  TRIAGE_CRITERIA_LABELS,
} from "./triage";
import { TriageCriteria } from "./types";

const noCriteria: TriageCriteria = {
  I: false,
  N: false,
  E1: false,
  E2: false,
  D: false,
  H: false,
  E3: false,
  L: false,
  P: false,
};

describe("calculateTriageScore", () => {
  it("returns 0 when no criteria are met", () => {
    expect(calculateTriageScore(noCriteria)).toBe(0);
  });

  it("returns 9 when every criterion is met", () => {
    const all: TriageCriteria = Object.fromEntries(
      Object.keys(noCriteria).map((k) => [k, true])
    ) as unknown as TriageCriteria;
    expect(calculateTriageScore(all)).toBe(9);
  });

  it.each(Object.keys(noCriteria) as (keyof TriageCriteria)[])(
    "counts a single met criterion (%s) as score 1",
    (key) => {
      expect(calculateTriageScore({ ...noCriteria, [key]: true })).toBe(1);
    }
  );
});

describe("getRecommendation", () => {
  it("recommends CONTINUE_GDMT when score is 0", () => {
    expect(getRecommendation(0)).toBe("CONTINUE_GDMT");
  });

  it("recommends REFER as soon as score is 1 (guideline: any single I-NEED-HELP criterion triggers referral)", () => {
    expect(getRecommendation(1)).toBe("REFER");
  });

  it("recommends REFER for higher scores too", () => {
    expect(getRecommendation(5)).toBe("REFER");
    expect(getRecommendation(9)).toBe("REFER");
  });
});

describe("getTriageResult", () => {
  it("flags isUrgent=false and empty metCriteria when nothing is met", () => {
    const result = getTriageResult(noCriteria);
    expect(result.score).toBe(0);
    expect(result.recommendation).toBe("CONTINUE_GDMT");
    expect(result.isUrgent).toBe(false);
    expect(result.metCriteria).toEqual([]);
  });

  it("flags isUrgent=true and lists the correct label when one criterion is met", () => {
    const result = getTriageResult({ ...noCriteria, D: true });
    expect(result.score).toBe(1);
    expect(result.recommendation).toBe("REFER");
    expect(result.isUrgent).toBe(true);
    expect(result.metCriteria).toEqual([TRIAGE_CRITERIA_LABELS.D.label]);
  });

  it("lists multiple labels in the order criteria are defined when several are met", () => {
    const result = getTriageResult({ ...noCriteria, I: true, H: true, P: true });
    expect(result.score).toBe(3);
    expect(result.metCriteria).toEqual([
      TRIAGE_CRITERIA_LABELS.I.label,
      TRIAGE_CRITERIA_LABELS.H.label,
      TRIAGE_CRITERIA_LABELS.P.label,
    ]);
  });
});

describe("countGdmt", () => {
  it("returns 0 when on no GDMT medication", () => {
    expect(
      countGdmt({ onAceArni: false, onBb: false, onMra: false, onSglt2i: false })
    ).toBe(0);
  });

  it("returns 4 when on all four pillars of GDMT", () => {
    expect(
      countGdmt({ onAceArni: true, onBb: true, onMra: true, onSglt2i: true })
    ).toBe(4);
  });

  it("counts partial GDMT correctly", () => {
    expect(
      countGdmt({ onAceArni: true, onBb: false, onMra: true, onSglt2i: false })
    ).toBe(2);
  });
});
