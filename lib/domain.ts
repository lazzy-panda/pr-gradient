// Domain enums — single source of truth used by both client and server.
// Stored in DB as strings, validated by zod.

export const BRANDS = [
  "VIVIENNE_SABO",
  "STELLARY",
  "INFLUENCE_BEAUTY",
  "BEAUTY_BOMB",
  "LOVE_GENERATION",
  "ARTDECO",
  "DEBORAH_MILANO",
  "PHYSICIANS_FORMULA",
] as const;
export type Brand = (typeof BRANDS)[number];

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

// Russian display names used in UI (UI is RU-only per spec).
export const BRAND_LABELS: Record<Brand, string> = {
  VIVIENNE_SABO: "Vivienne Sabó",
  STELLARY: "Stellary",
  INFLUENCE_BEAUTY: "Influence Beauty",
  BEAUTY_BOMB: "Beauty Bomb",
  LOVE_GENERATION: "Love Generation",
  ARTDECO: "ARTDECO",
  DEBORAH_MILANO: "Deborah Milano",
  PHYSICIANS_FORMULA: "Physicians Formula",
};

export const BRAND_SHORT: Record<Brand, string> = {
  VIVIENNE_SABO: "VS",
  STELLARY: "ST",
  INFLUENCE_BEAUTY: "IB",
  BEAUTY_BOMB: "BB",
  LOVE_GENERATION: "LG",
  ARTDECO: "AD",
  DEBORAH_MILANO: "DM",
  PHYSICIANS_FORMULA: "PF",
};

export const BRAND_COLORS: Record<Brand, string> = {
  VIVIENNE_SABO: "#B91C5C",
  STELLARY: "#1D4ED8",
  INFLUENCE_BEAUTY: "#059669",
  BEAUTY_BOMB: "#EC4899",
  LOVE_GENERATION: "#EA580C",
  ARTDECO: "#374151",
  DEBORAH_MILANO: "#7C3AED",
  PHYSICIANS_FORMULA: "#0891B2",
};

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
