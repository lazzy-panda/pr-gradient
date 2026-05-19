import type { Brand, Category, Tool, Platform, PlacementStatus, BloggerLevel } from "./domain";

export interface Blogger {
  id: string;
  canonicalName: string;
  level: BloggerLevel | string;
  handleTiktok: string | null;
  handleVk: string | null;
  handleTelegram: string | null;
  handleInstagram: string | null;
  handleYoutube: string | null;
  contact: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Placement {
  id: string;
  date: string; // ISO; ymd is `.slice(0,10)`
  brand: Brand | string;
  category: Category | string;
  product: string;
  tool: Tool | string;
  platform: Platform | string;
  postUrl: string | null;
  status: PlacementStatus | string;
  bloggerId: string;
  blogger?: Blogger;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictReason {
  placementId: string;
  bloggerId: string;
  brand: string;
  date: string;
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
