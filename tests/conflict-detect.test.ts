import { describe, it, expect } from "vitest";
import { detectConflicts, type PlacementLike } from "../lib/conflict-detect";

// Compact helper: build a PlacementLike with sensible defaults.
const p = (overrides: Partial<PlacementLike> & { date: string }): PlacementLike => ({
  id: overrides.id ?? "p1",
  date: overrides.date,
  bloggerId: overrides.bloggerId ?? "b1",
  brand: overrides.brand ?? "INFLUENCE_BEAUTY",
  category: overrides.category ?? "LIPS",
  tool: overrides.tool ?? "KRUPNY",
  platform: overrides.platform ?? "TIKTOK",
  status: overrides.status ?? "PLANNED",
});

const target = (overrides: Partial<ReturnType<typeof p>> & { date: string }) => ({
  date: overrides.date,
  bloggerId: overrides.bloggerId ?? "b1",
  brand: (overrides.brand ?? "VIVIENNE_SABO") as "VIVIENNE_SABO",
  category: (overrides.category ?? "LIPS") as "LIPS",
  tool: (overrides.tool ?? "KRUPNY") as "KRUPNY",
  platform: (overrides.platform ?? "TIKTOK") as "TIKTOK",
  excludeId: overrides.id,
});

describe("detectConflicts — base filters", () => {
  it("intra-brand → no conflict", () => {
    const r = detectConflicts(
      target({ date: "2026-05-11", brand: "INFLUENCE_BEAUTY" }),
      [p({ date: "2026-05-10" })],
    );
    expect(r.hasConflict).toBe(false);
  });

  it("different blogger → no conflict", () => {
    const r = detectConflicts(
      target({ date: "2026-05-10", bloggerId: "b2" }),
      [p({ date: "2026-05-10" })],
    );
    expect(r.hasConflict).toBe(false);
  });

  it("CANCELLED counterparts are ignored", () => {
    const r = detectConflicts(
      target({ date: "2026-05-11" }),
      [p({ date: "2026-05-10", status: "CANCELLED" })],
    );
    expect(r.hasConflict).toBe(false);
  });

  it("excludeId skips the matching placement (edit case)", () => {
    const r = detectConflicts(
      { ...target({ date: "2026-05-11" }), excludeId: "p1" },
      [p({ id: "p1", date: "2026-05-10" })],
    );
    expect(r.hasConflict).toBe(false);
  });
});

describe("rule 5 — POSEV is out of category", () => {
  it("target POSEV vs any → no conflict", () => {
    const r = detectConflicts(
      target({ date: "2026-05-10", tool: "POSEV" }),
      [p({ date: "2026-05-10" })],
    );
    expect(r.hasConflict).toBe(false);
  });
  it("existing POSEV vs any → no conflict", () => {
    const r = detectConflicts(
      target({ date: "2026-05-10" }),
      [p({ date: "2026-05-10", tool: "POSEV" })],
    );
    expect(r.hasConflict).toBe(false);
  });
});

describe("rule 1 — same category + same month + same platform → ≥7 placements between", () => {
  it("just two same-cat/same-platform on same blogger in same month → conflict (0 between)", () => {
    const r = detectConflicts(
      target({ date: "2026-05-20" }),
      [p({ date: "2026-05-05" })],
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].placementsBetween).toBe(0);
    expect(r.conflicts[0].daysRequired).toBe(7);
  });

  it("7 other non-POSEV placements between → no conflict", () => {
    const existing: PlacementLike[] = [
      p({ id: "main", date: "2026-05-05" }),
      ...Array.from({ length: 7 }, (_, i) =>
        p({ id: `f${i}`, date: `2026-05-${String(8 + i).padStart(2, "0")}`, brand: "BEAUTY_BOMB", category: "EYES", platform: "VK" }),
      ),
    ];
    const r = detectConflicts(
      target({ date: "2026-05-20" }),
      existing,
    );
    // Counterpart "main" satisfies rule 1 (7 between). Counterpart fillers are EYES on VK
    // vs target LIPS on TIKTOK → rule 4 (≥3 days), all are ≥3 days off the 20th, no issue.
    expect(r.hasConflict).toBe(false);
  });

  it("POSEV between does not count toward the 7", () => {
    const existing: PlacementLike[] = [
      p({ id: "main", date: "2026-05-05" }),
      ...Array.from({ length: 7 }, (_, i) =>
        p({ id: `f${i}`, date: `2026-05-${String(8 + i).padStart(2, "0")}`, tool: "POSEV", brand: "BEAUTY_BOMB", category: "EYES", platform: "VK" }),
      ),
    ];
    const r = detectConflicts(
      target({ date: "2026-05-20" }),
      existing,
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts.find((c) => c.placementId === "main")?.placementsBetween).toBe(0);
  });
});

describe("rule 2 — same category + same month + different platform → ≥14 days", () => {
  it("13 days apart → conflict", () => {
    const r = detectConflicts(
      target({ date: "2026-05-15", platform: "VK" }),
      [p({ date: "2026-05-02", platform: "TIKTOK" })],
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].daysActual).toBe(13);
    expect(r.conflicts[0].daysRequired).toBe(14);
  });
  it("exactly 14 days apart → ok", () => {
    const r = detectConflicts(
      target({ date: "2026-05-16", platform: "VK" }),
      [p({ date: "2026-05-02", platform: "TIKTOK" })],
    );
    expect(r.hasConflict).toBe(false);
  });
});

describe("rule 3 — different categories + same platform → ≥14 days", () => {
  it("10 days apart on same platform → conflict", () => {
    const r = detectConflicts(
      target({ date: "2026-05-15", category: "EYES" }),
      [p({ date: "2026-05-05", category: "LIPS" })],
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].daysRequired).toBe(14);
  });
  it("decor vs care on same platform (cross-segment) → treated as diff category, ≥14 days", () => {
    const r = detectConflicts(
      target({ date: "2026-05-10", category: "CARE" }),
      [p({ date: "2026-05-05", category: "LIPS" })],
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].daysRequired).toBe(14);
  });
});

describe("rule 4 — different categories + different platforms → ≥3 days", () => {
  it("2 days apart → conflict", () => {
    const r = detectConflicts(
      target({ date: "2026-05-12", category: "EYES", platform: "VK" }),
      [p({ date: "2026-05-10", category: "LIPS", platform: "TIKTOK" })],
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].daysRequired).toBe(3);
  });
  it("3 days apart → ok", () => {
    const r = detectConflicts(
      target({ date: "2026-05-13", category: "EYES", platform: "VK" }),
      [p({ date: "2026-05-10", category: "LIPS", platform: "TIKTOK" })],
    );
    expect(r.hasConflict).toBe(false);
  });
});

describe("same category, different months → no constraint", () => {
  it("May 31 + June 1 (same cat, same platform, diff month) → ok", () => {
    const r = detectConflicts(
      target({ date: "2026-06-01" }),
      [p({ date: "2026-05-31" })],
    );
    expect(r.hasConflict).toBe(false);
  });
});

describe("exclusive brands — soft flag only at <3 days", () => {
  it("PF + holding 2 days apart → flagged", () => {
    const r = detectConflicts(
      target({ date: "2026-05-12", brand: "PHYSICIANS_FORMULA" }),
      [p({ date: "2026-05-10", brand: "INFLUENCE_BEAUTY" })],
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].reason).toMatch(/Эксклюзивный/);
  });
  it("ARTDECO + holding 3 days apart → ok", () => {
    const r = detectConflicts(
      target({ date: "2026-05-13", brand: "ARTDECO" }),
      [p({ date: "2026-05-10", brand: "INFLUENCE_BEAUTY" })],
    );
    expect(r.hasConflict).toBe(false);
  });
  it("DM + holding same day (intra-platform same cat, would normally be rule 1) → flagged via exclusive path", () => {
    const r = detectConflicts(
      target({ date: "2026-05-10", brand: "DEBORAH_MILANO" }),
      [p({ date: "2026-05-10", brand: "INFLUENCE_BEAUTY" })],
    );
    expect(r.hasConflict).toBe(true);
    expect(r.conflicts[0].reason).toMatch(/Эксклюзивный/);
  });
});
