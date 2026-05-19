import { describe, it, expect } from "vitest";
import { detectConflicts, getSpacingThreshold, type PlacementLike } from "../lib/conflict-detect";

const base: PlacementLike = {
  id: "p1",
  date: "2026-05-10",
  bloggerId: "b1",
  brand: "INFLUENCE_BEAUTY",
  category: "LIPS",
  tool: "KRUPNY",
  status: "PLANNED",
};

describe("getSpacingThreshold", () => {
  it("KRUPNY same category → 7 days", () => {
    expect(getSpacingThreshold("KRUPNY", "KRUPNY", true)).toBe(7);
  });
  it("KRUPNY different category → 2 days", () => {
    expect(getSpacingThreshold("KRUPNY", "KRUPNY", false)).toBe(2);
  });
  it("KRUPNY + SWIPE → 2 (max severity wins)", () => {
    expect(getSpacingThreshold("KRUPNY", "SWIPE", false)).toBe(2);
    expect(getSpacingThreshold("KRUPNY", "SWIPE", true)).toBe(7);
  });
  it("SWIPE same category → 3, different → 1", () => {
    expect(getSpacingThreshold("SWIPE", "SWIPE", true)).toBe(3);
    expect(getSpacingThreshold("SWIPE", "SWIPE", false)).toBe(1);
  });
  it("POSEV same category → 1, different → 0", () => {
    expect(getSpacingThreshold("POSEV", "POSEV", true)).toBe(1);
    expect(getSpacingThreshold("POSEV", "POSEV", false)).toBe(0);
  });
});

describe("detectConflicts — spec acceptance criteria", () => {
  it("Same blogger, same brand → no conflict (intra-brand allowed)", () => {
    const r = detectConflicts(
      { date: "2026-05-11", bloggerId: "b1", brand: "INFLUENCE_BEAUTY", category: "LIPS", tool: "KRUPNY" },
      [base],
    );
    expect(r.hasConflict).toBe(false);
  });

  it("Same blogger, different brand, +1 day, KRUPNY+KRUPNY, same category → conflict (need 7)", () => {
    const r = detectConflicts(
      { date: "2026-05-11", bloggerId: "b1", brand: "VIVIENNE_SABO", category: "LIPS", tool: "KRUPNY" },
      [base],
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].daysActual).toBe(1);
    expect(r.conflicts[0].daysRequired).toBe(7);
    expect(r.conflicts[0].sameCategory).toBe(true);
  });

  it("Same blogger, different brand, +3 days, SWIPE+SWIPE, different category → no conflict", () => {
    const r = detectConflicts(
      { date: "2026-05-13", bloggerId: "b1", brand: "VIVIENNE_SABO", category: "EYES", tool: "SWIPE" },
      [{ ...base, tool: "SWIPE" }],
    );
    expect(r.hasConflict).toBe(false);
  });

  it("Same blogger, different brand, +1 day, KRUPNY+SWIPE, different category → conflict (need 2)", () => {
    const r = detectConflicts(
      { date: "2026-05-11", bloggerId: "b1", brand: "VIVIENNE_SABO", category: "EYES", tool: "SWIPE" },
      [base], // base is KRUPNY
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].daysRequired).toBe(2);
  });
});

describe("detectConflicts — edge cases", () => {
  it("Same blogger, different brand, same day → always conflict", () => {
    const r = detectConflicts(
      { date: "2026-05-10", bloggerId: "b1", brand: "VIVIENNE_SABO", category: "HAIR", tool: "POSEV" },
      [base],
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].daysActual).toBe(0);
  });

  it("CANCELLED placements are ignored", () => {
    const r = detectConflicts(
      { date: "2026-05-11", bloggerId: "b1", brand: "VIVIENNE_SABO", category: "LIPS", tool: "KRUPNY" },
      [{ ...base, status: "CANCELLED" }],
    );
    expect(r.hasConflict).toBe(false);
  });

  it("excludeId is skipped (update case)", () => {
    const r = detectConflicts(
      { date: "2026-05-11", bloggerId: "b1", brand: "VIVIENNE_SABO", category: "LIPS", tool: "KRUPNY", excludeId: "p1" },
      [base],
    );
    expect(r.hasConflict).toBe(false);
  });

  it("Different blogger → never conflict", () => {
    const r = detectConflicts(
      { date: "2026-05-10", bloggerId: "b2", brand: "VIVIENNE_SABO", category: "LIPS", tool: "KRUPNY" },
      [base],
    );
    expect(r.hasConflict).toBe(false);
  });

  it("Date objects work alongside strings", () => {
    const r = detectConflicts(
      {
        date: new Date(Date.UTC(2026, 4, 11)),
        bloggerId: "b1",
        brand: "VIVIENNE_SABO",
        category: "LIPS",
        tool: "KRUPNY",
      },
      [{ ...base, date: new Date(Date.UTC(2026, 4, 10)) }],
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].daysActual).toBe(1);
  });
});
