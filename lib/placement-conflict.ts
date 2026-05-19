// Server-side wrapper: load relevant placements and run conflict-detect.
import { prisma } from "./db";
import { detectConflicts, type ConflictTarget, type ConflictResult } from "./conflict-detect";
import { ymdToDate } from "./date";

const WINDOW_DAYS = 14;

export async function detectConflictsForTarget(target: {
  date: string;
  bloggerId: string;
  brand: ConflictTarget["brand"];
  category: ConflictTarget["category"];
  tool: ConflictTarget["tool"];
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
      excludeId: target.excludeId,
    },
    existing.map(p => ({
      id: p.id,
      date: p.date,
      bloggerId: p.bloggerId,
      brand: p.brand,
      category: p.category,
      tool: p.tool,
      status: p.status,
    })),
  );
}
