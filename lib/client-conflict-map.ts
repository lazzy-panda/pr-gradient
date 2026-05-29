// Client-side conflict precompute over a fetched placements set.
// Uses the same algorithm as the server (lib/conflict-detect.ts).
// Use this to render the ❌ badge on Calendar days and the red border in Timeline cards
// without paying a round-trip per render. The server is still the source of truth on save.

import { detectConflicts, type PlacementLike, type ConflictResult } from "./conflict-detect";
import type { Placement } from "./types";
import type { Brand, Category, Platform, Tool } from "./domain";

export function buildConflictMap(placements: Placement[]): Record<string, ConflictResult> {
  const lookup: PlacementLike[] = placements.map(p => ({
    id: p.id,
    date: p.date.slice(0, 10),
    bloggerId: p.bloggerId,
    brand: p.brand,
    category: p.category,
    tool: p.tool,
    platform: p.platform,
    status: p.status,
  }));

  const byBlogger = new Map<string, PlacementLike[]>();
  for (const p of lookup) {
    const arr = byBlogger.get(p.bloggerId) ?? [];
    arr.push(p);
    byBlogger.set(p.bloggerId, arr);
  }

  const map: Record<string, ConflictResult> = {};
  for (const p of lookup) {
    const others = byBlogger.get(p.bloggerId) ?? [];
    map[p.id] = detectConflicts(
      {
        date: p.date,
        bloggerId: p.bloggerId,
        brand: p.brand as Brand,
        category: p.category as Category,
        tool: p.tool as Tool,
        platform: p.platform as Platform,
        excludeId: p.id,
      },
      others,
    );
  }
  return map;
}
