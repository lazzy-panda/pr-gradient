// Conflict detection for blogger placements.
// Algorithm: spec-version (matrix Tool × SameCategory).
//
// Rule (cross-brand only; intra-brand is the brand-team's own call):
//   max severity of (tool A, tool B) determines spacing threshold (days).
//   - KRUPNY (severity 3): 7 days if same category, 2 days otherwise
//   - SWIPE  (severity 2): 3 days if same category, 1 day otherwise
//   - POSEV  (severity 1): 1 day if same category, 0 otherwise (same-day only flag)
//   - Same-day cross-brand is ALWAYS a conflict regardless of severity.
//
// Source: docs/PR_Gradient_Spec_Backend.md

import type { Brand, Category, Tool } from "./domain";

export interface PlacementLike {
  id: string;
  date: Date | string;
  bloggerId: string;
  brand: Brand | string;
  category: Category | string;
  tool: Tool | string;
  status?: string | null;
}

export interface ConflictTarget {
  date: Date | string;
  bloggerId: string;
  brand: Brand;
  category: Category;
  tool: Tool;
  excludeId?: string | null;
}

export interface ConflictReason {
  placementId: string;
  bloggerId: string;
  brand: string;
  date: string; // YYYY-MM-DD
  tool: string;
  category: string;
  daysActual: number;
  daysRequired: number;
  sameCategory: boolean;
  reason: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ConflictReason[];
}

const TOOL_SEVERITY: Record<string, number> = {
  KRUPNY: 3,
  SWIPE: 2,
  POSEV: 1,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getSpacingThreshold(
  tool1: string,
  tool2: string,
  sameCategory: boolean,
): number {
  const s = Math.max(TOOL_SEVERITY[tool1] ?? 0, TOOL_SEVERITY[tool2] ?? 0);
  if (s === 3) return sameCategory ? 7 : 2;
  if (s === 2) return sameCategory ? 3 : 1;
  return sameCategory ? 1 : 0;
}

function toDate(d: Date | string): Date {
  if (d instanceof Date) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // YYYY-MM-DD → UTC midnight
  return new Date(d.length === 10 ? d + "T00:00:00.000Z" : d);
}

function toYmd(d: Date | string): string {
  if (typeof d === "string" && d.length === 10) return d;
  const dt = toDate(d);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function daysBetween(a: Date | string, b: Date | string): number {
  return Math.round(Math.abs(toDate(a).getTime() - toDate(b).getTime()) / DAY_MS);
}

/**
 * Detect conflicts for `target` against `existing` placements.
 * Pure function, no I/O — caller is responsible for narrowing `existing`
 * to the relevant blogger / time window.
 */
export function detectConflicts(
  target: ConflictTarget,
  existing: PlacementLike[],
): ConflictResult {
  const reasons: ConflictReason[] = [];
  for (const p of existing) {
    if (p.status === "CANCELLED") continue;
    if (target.excludeId && p.id === target.excludeId) continue;
    if (p.bloggerId !== target.bloggerId) continue;
    if (p.brand === target.brand) continue; // intra-brand is allowed (their own call)

    const days = daysBetween(target.date, p.date);
    const sameCategory = p.category === target.category;
    const required = getSpacingThreshold(p.tool as string, target.tool as string, sameCategory);

    if (days < required || days === 0) {
      // days === 0 is always a conflict (cross-brand same-day)
      const effectiveRequired = days === 0 && required === 0 ? 1 : required;
      reasons.push({
        placementId: p.id,
        bloggerId: p.bloggerId,
        brand: String(p.brand),
        date: toYmd(p.date),
        tool: String(p.tool),
        category: String(p.category),
        daysActual: days,
        daysRequired: effectiveRequired,
        sameCategory,
        reason: buildReason(days, effectiveRequired, sameCategory),
      });
    }
  }
  return { hasConflict: reasons.length > 0, conflicts: reasons };
}

function buildReason(days: number, required: number, sameCategory: boolean): string {
  if (days === 0) return "В тот же день уже есть размещение другого бренда у этого блогера";
  return `Требуется ≥${required} дн. между размещениями ${sameCategory ? "одной категории" : "разных категорий"}, фактически ${days}`;
}
