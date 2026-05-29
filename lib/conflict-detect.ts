// Conflict detection for blogger placements.
//
// Rules (cross-brand only; intra-brand placements skipped):
//   1. Same category, same calendar month, same platform → conflict unless
//      ≥7 other (non-POSEV) placements of the blogger lie between the two dates.
//   2. Same category, same calendar month, different platforms → ≥14 days.
//   3. Different categories, same platform → ≥14 days.
//   4. Different categories, different platforms → ≥3 days.
//   5. Either side is POSEV (рассылка) → no rules apply (out of category calendar).
//
// Exclusive-distribution brands (Physicians Formula, ARTDECO, Deborah Milano):
//   ignore rules 1–4. Soft-flag only if interval <3 days.
//
// Same category, different months → no constraint (sufficient natural spacing).

import type { Brand, Category, Platform, Tool } from "./domain";

export interface PlacementLike {
  id: string;
  date: Date | string;
  bloggerId: string;
  brand: Brand | string;
  category: Category | string;
  tool: Tool | string;
  platform?: Platform | string | null;
  status?: string | null;
}

export interface ConflictTarget {
  date: Date | string;
  bloggerId: string;
  brand: Brand;
  category: Category;
  tool: Tool;
  platform: Platform;
  excludeId?: string | null;
}

export interface ConflictReason {
  placementId: string;
  bloggerId: string;
  brand: string;
  date: string; // YYYY-MM-DD
  tool: string;
  category: string;
  platform: string;
  daysActual: number;
  daysRequired: number;       // for "≥7 placements between" rule, equals MIN_PLACEMENTS_BETWEEN (informational)
  sameCategory: boolean;
  samePlatform: boolean;
  sameMonth: boolean;
  placementsBetween?: number; // populated only for rule 1
  reason: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ConflictReason[];
}

const EXCLUSIVE_BRANDS = new Set(["PHYSICIANS_FORMULA", "ARTDECO", "DEBORAH_MILANO"]);
const EXCLUSIVE_MIN_DAYS = 3;
const RULE1_MIN_BETWEEN = 7;
const RULE2_MIN_DAYS = 14;
const RULE3_MIN_DAYS = 14;
const RULE4_MIN_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(d: Date | string): Date {
  if (d instanceof Date) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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

function sameUtcMonth(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

function isExclusive(brand: string): boolean {
  return EXCLUSIVE_BRANDS.has(brand);
}

/**
 * Count non-POSEV, non-cancelled placements of this blogger that fall
 * strictly between two dates (exclusive of both endpoints).
 */
function countPlacementsBetween(
  existing: PlacementLike[],
  bloggerId: string,
  a: Date,
  b: Date,
  excludeId?: string | null,
): number {
  const lo = Math.min(a.getTime(), b.getTime());
  const hi = Math.max(a.getTime(), b.getTime());
  let count = 0;
  for (const p of existing) {
    if (p.status === "CANCELLED") continue;
    if (excludeId && p.id === excludeId) continue;
    if (p.bloggerId !== bloggerId) continue;
    if (p.tool === "POSEV") continue;
    const t = toDate(p.date).getTime();
    if (t > lo && t < hi) count++;
  }
  return count;
}

/**
 * Detect conflicts for `target` against `existing` placements.
 * Pure function, no I/O — caller is responsible for narrowing `existing`
 * to the relevant blogger / time window (recommended ≥31 days for rule 1).
 */
export function detectConflicts(
  target: ConflictTarget,
  existing: PlacementLike[],
): ConflictResult {
  const reasons: ConflictReason[] = [];
  const targetDate = toDate(target.date);

  for (const p of existing) {
    if (p.status === "CANCELLED") continue;
    if (target.excludeId && p.id === target.excludeId) continue;
    if (p.bloggerId !== target.bloggerId) continue;
    if (p.brand === target.brand) continue;                            // intra-brand → ok
    if (p.tool === "POSEV" || target.tool === "POSEV") continue;       // rule 5

    const pDate = toDate(p.date);
    const days = daysBetween(targetDate, pDate);
    const sameCategory = p.category === target.category;
    const samePlatform = !!p.platform && p.platform === target.platform;
    const sameMonth = sameUtcMonth(targetDate, pDate);

    // Exclusive-distribution brands: soft flag only at <3 days.
    if (isExclusive(p.brand) || isExclusive(target.brand)) {
      if (days < EXCLUSIVE_MIN_DAYS) {
        const excl = isExclusive(target.brand) ? target.brand : String(p.brand);
        reasons.push(makeReason(p, days, EXCLUSIVE_MIN_DAYS, sameCategory, samePlatform, sameMonth,
          `Эксклюзивный бренд (${excl}): интервал ${days} дн. < ${EXCLUSIVE_MIN_DAYS} дн.`));
      }
      continue;
    }

    // Rule 1: same category, same month, same platform → ≥7 placements between.
    if (sameCategory && sameMonth && samePlatform) {
      const between = countPlacementsBetween(existing, target.bloggerId, targetDate, pDate, target.excludeId);
      if (between < RULE1_MIN_BETWEEN) {
        reasons.push({
          ...makeReason(p, days, RULE1_MIN_BETWEEN, sameCategory, samePlatform, sameMonth,
            `Та же категория и платформа в одном месяце: между размещениями только ${between} роликов (нужно ≥${RULE1_MIN_BETWEEN})`),
          placementsBetween: between,
        });
      }
      continue;
    }

    // Rule 2: same category, same month, different platforms → ≥14 days.
    if (sameCategory && sameMonth && !samePlatform) {
      if (days < RULE2_MIN_DAYS) {
        reasons.push(makeReason(p, days, RULE2_MIN_DAYS, sameCategory, samePlatform, sameMonth,
          `Та же категория, разные платформы: ${days} дн. < ${RULE2_MIN_DAYS} дн.`));
      }
      continue;
    }

    // Rule 3: different categories, same platform → ≥14 days.
    if (!sameCategory && samePlatform) {
      if (days < RULE3_MIN_DAYS) {
        reasons.push(makeReason(p, days, RULE3_MIN_DAYS, sameCategory, samePlatform, sameMonth,
          `Разные категории, та же платформа: ${days} дн. < ${RULE3_MIN_DAYS} дн.`));
      }
      continue;
    }

    // Rule 4: different categories, different platforms → ≥3 days.
    if (!sameCategory && !samePlatform) {
      if (days < RULE4_MIN_DAYS) {
        reasons.push(makeReason(p, days, RULE4_MIN_DAYS, sameCategory, samePlatform, sameMonth,
          `Разные категории и платформы: ${days} дн. < ${RULE4_MIN_DAYS} дн.`));
      }
      continue;
    }

    // Same category, different months → no constraint.
  }
  return { hasConflict: reasons.length > 0, conflicts: reasons };
}

function makeReason(
  p: PlacementLike,
  days: number,
  required: number,
  sameCategory: boolean,
  samePlatform: boolean,
  sameMonth: boolean,
  text: string,
): ConflictReason {
  return {
    placementId: p.id,
    bloggerId: p.bloggerId,
    brand: String(p.brand),
    date: toYmd(p.date),
    tool: String(p.tool),
    category: String(p.category),
    platform: String(p.platform ?? ""),
    daysActual: days,
    daysRequired: required,
    sameCategory,
    samePlatform,
    sameMonth,
    reason: text,
  };
}
