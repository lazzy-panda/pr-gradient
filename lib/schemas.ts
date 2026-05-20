// Zod schemas — shared validation between API and forms.
import { z } from "zod";
import {
  CATEGORIES,
  TOOLS,
  PLATFORMS,
  PLACEMENT_STATUSES,
  BLOGGER_LEVELS,
} from "./domain";

// Brand is DB-driven now (Brand table). Format check only; existence is verified in routes.
const brandCode = z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Код бренда: UPPER_SNAKE_CASE");

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const nullableString = z.string().trim().optional().nullable();

export const placementInputSchema = z.object({
  date: ymd,
  brand: brandCode,
  category: z.enum(CATEGORIES),
  product: z.string().min(1, "Заполните продукт").max(200),
  bloggerId: z.string().min(1),
  tool: z.enum(TOOLS),
  platform: z.enum(PLATFORMS),
  postUrl: z.string().url("Некорректный URL").optional().nullable().or(z.literal("")),
  status: z.enum(PLACEMENT_STATUSES).default("PLANNED"),
});

export const placementCreateSchema = placementInputSchema.extend({
  force: z.boolean().optional(),
});

export const placementPatchSchema = placementInputSchema.partial().extend({
  force: z.boolean().optional(),
});

export const checkConflictSchema = z.object({
  date: ymd,
  bloggerId: z.string().min(1),
  brand: brandCode,
  category: z.enum(CATEGORIES),
  tool: z.enum(TOOLS),
  excludeId: z.string().optional().nullable(),
});

export const bloggerCreateSchema = z.object({
  canonicalName: z.string().trim().min(1, "Имя обязательно").max(120),
  level: z.enum(BLOGGER_LEVELS).default("MID"),
  handleTiktok: nullableString,
  handleVk: nullableString,
  handleTelegram: nullableString,
  handleInstagram: nullableString,
  handleYoutube: nullableString,
  contact: nullableString,
  notes: nullableString,
});

export const bloggerPatchSchema = bloggerCreateSchema.partial();

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const brandCreateSchema = z.object({
  code: brandCode.max(40),
  name: z.string().trim().min(1).max(60),
  shortCode: z.string().trim().min(1).max(4),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Цвет: HEX #RRGGBB"),
  isHolding: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const brandPatchSchema = brandCreateSchema.partial().omit({ code: true }).extend({
  isArchived: z.boolean().optional(),
});

export type BrandCreate = z.infer<typeof brandCreateSchema>;
export type BrandPatch = z.infer<typeof brandPatchSchema>;

export type PlacementInput = z.infer<typeof placementInputSchema>;
export type PlacementCreate = z.infer<typeof placementCreateSchema>;
export type PlacementPatch = z.infer<typeof placementPatchSchema>;
export type CheckConflictInput = z.infer<typeof checkConflictSchema>;
export type BloggerCreate = z.infer<typeof bloggerCreateSchema>;
export type BloggerPatch = z.infer<typeof bloggerPatchSchema>;
