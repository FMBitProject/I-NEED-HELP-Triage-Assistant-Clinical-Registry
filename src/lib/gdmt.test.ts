import { describe, it, expect } from "vitest";
import { countGdmt } from "./gdmt";

describe("countGdmt", () => {
  it("returns 0 when no pillar is active", () => {
    expect(
      countGdmt({ onAceArni: false, onBb: false, onMra: false, onSglt2i: false })
    ).toBe(0);
  });

  it("counts each active pillar", () => {
    expect(
      countGdmt({ onAceArni: true, onBb: false, onMra: false, onSglt2i: false })
    ).toBe(1);
    expect(
      countGdmt({ onAceArni: true, onBb: true, onMra: false, onSglt2i: false })
    ).toBe(2);
    expect(
      countGdmt({ onAceArni: true, onBb: true, onMra: true, onSglt2i: false })
    ).toBe(3);
  });

  it("returns 4 when all pillars are active", () => {
    expect(
      countGdmt({ onAceArni: true, onBb: true, onMra: true, onSglt2i: true })
    ).toBe(4);
  });
});
