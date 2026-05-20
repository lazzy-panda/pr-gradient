// Domain enums — single source of truth used by both client and server.
// Stored in DB as strings, validated by zod.

// Brands are now DB-driven (Brand table); see lib/types.ts → BrandRow.
// We keep `Brand` as a string alias for compat in older code paths.
export type Brand = string;

export const CATEGORIES = [
  "LIPS",
  "EYES",
  "FACE",
  "BROWS",
  "NAILS",
  "HAIR",
  "ACCESSORIES",
  "COLLECTIONS",
  "EXCLUSIVE",
  "CARE",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const TOOLS = ["KRUPNY", "SWIPE", "POSEV"] as const;
export type Tool = (typeof TOOLS)[number];

export const PLATFORMS = ["TIKTOK", "VK", "TELEGRAM", "INSTAGRAM", "YOUTUBE"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLACEMENT_STATUSES = ["PLANNED", "PUBLISHED", "CANCELLED"] as const;
export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];

export const BLOGGER_LEVELS = ["TOP", "MID", "NANO"] as const;
export type BloggerLevel = (typeof BLOGGER_LEVELS)[number];

// Fallback color for any brand code we haven't loaded yet (e.g. SSR before API hydrate).
// Real colors come from useBrands() / brand.color on the Brand row.
export const FALLBACK_BRAND_COLOR = "#6B6B73";

export const CATEGORY_LABELS: Record<Category, string> = {
  LIPS: "Губы",
  EYES: "Глаза",
  FACE: "Лицо",
  BROWS: "Брови",
  NAILS: "Ногти",
  HAIR: "Волосы",
  ACCESSORIES: "Аксессуары",
  COLLECTIONS: "Коллекции",
  EXCLUSIVE: "Эксклюзив",
  CARE: "Уход",
};

export const TOOL_LABELS: Record<Tool, string> = {
  KRUPNY: "Крупный блогер",
  SWIPE: "Свайп",
  POSEV: "Посев",
};

export const TOOL_SHORT: Record<Tool, string> = {
  KRUPNY: "К",
  SWIPE: "С",
  POSEV: "П",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  TIKTOK: "TikTok",
  VK: "VK",
  TELEGRAM: "Telegram",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
};

export const STATUS_LABELS: Record<PlacementStatus, string> = {
  PLANNED: "Запланировано",
  PUBLISHED: "Опубликовано",
  CANCELLED: "Отменено",
};

export const LEVEL_LABELS: Record<BloggerLevel, string> = {
  TOP: "Крупный",
  MID: "Средний",
  NANO: "Нано",
};
