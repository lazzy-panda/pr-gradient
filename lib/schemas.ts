// Zod schemas — shared validation between API and forms.
import { z } from "zod";
import {
  BRANDS,
  CATEGORIES,
  TOOLS,
  PLATFORMS,
  PLACEMENT_STATUSES,
  BLOGGER_LEVELS,
} from "./domain";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const nullableString = z.string().trim().optional().nullable();

export const placementInputSchema = z.object({
  date: ymd,
  brand: z.enum(BRANDS),
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
  brand: z.enum(BRANDS),
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

export type PlacementInput = z.infer<typeof placementInputSchema>;
export type PlacementCreate = z.infer<typeof placementCreateSchema>;
export type PlacementPatch = z.infer<typeof placementPatchSchema>;
export type CheckConflictInput = z.infer<typeof checkConflictSchema>;
export type BloggerCreate = z.infer<typeof bloggerCreateSchema>;
export type BloggerPatch = z.infer<typeof bloggerPatchSchema>;
