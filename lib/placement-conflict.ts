// Server-side wrapper: load relevant placements and run conflict-detect.
import { prisma } from "./db";
import { detectConflicts, type ConflictTarget, type ConflictResult } from "./conflict-detect";
import { ymdToDate } from "./date";

// 31 days covers rule 1 ("≥7 placements between" within the same calendar month —
// worst case is the 1st vs 31st of a month) as well as rules 2–4 (≤14 day thresholds).
const WINDOW_DAYS = 31;

export async function detectConflictsForTarget(target: {
  date: string;
  bloggerId: string;
  brand: ConflictTarget["brand"];
  category: ConflictTarget["category"];
  tool: ConflictTarget["tool"];
  platform: ConflictTarget["platform"];
  excludeId?: string | null;
}): Promise<ConflictResult> {
  const center = ymdToDate(target.date);
  const lo = new Date(center.getTime() - WINDOW_DAYS * 86400000);
  const hi = new Date(center.getTime() + WINDOW_DAYS * 86400000);

  const existing = await prisma.placement.findMany({
    where: {
      bloggerId: target.bloggerId,
      status: { not: "CANCELLED" },
      date: { gte: lo, lte: hi },
      ...(target.excludeId ? { NOT: { id: target.excludeId } } : {}),
    },
  });

  return detectConflicts(
    {
      date: target.date,
      bloggerId: target.bloggerId,
      brand: target.brand,
      category: target.category,
      tool: target.tool,
      platform: target.platform,
      excludeId: target.excludeId,
    },
    existing.map(p => ({
      id: p.id,
      date: p.date,
      bloggerId: p.bloggerId,
      brand: p.brand,
      category: p.category,
      tool: p.tool,
      platform: p.platform,
      status: p.status,
    })),
  );
}
