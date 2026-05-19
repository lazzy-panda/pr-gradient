// Excel importer for PR_Градиент_общая.xlsx.
// Iterates 5 brand-named sheets (VS, Stellary, IB, BB, LG) — skips "Общая" (legend)
// and "Уход"/"Эксклюзив" (cross-brand category sheets, mostly empty/inconsistent).
//
// Run: npx tsx scripts/import-excel.ts [path-to-xlsx]
//
// Notes:
//   - Sheet headers vary across brands; we look up columns by header name.
//   - Bloggers are deduplicated by (platform, handle) inferred from the URL column.
//   - Months → 2026 calendar; for "май-июнь" or "12-24 мая" ranges we take the start.

import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import type { Brand, Category, Tool, Platform } from "../lib/domain";

const prisma = new PrismaClient();

const SHEET_TO_BRAND: Record<string, Brand> = {
  VS: "VIVIENNE_SABO",
  Stellary: "STELLARY",
  IB: "INFLUENCE_BEAUTY",
  BB: "BEAUTY_BOMB",
  LG: "LOVE_GENERATION",
};

const MONTH_RU: Record<string, number> = {
  "январь": 1, "января": 1,
  "февраль": 2, "февраля": 2,
  "март": 3, "марта": 3,
  "апрель": 4, "апреля": 4,
  "май": 5, "мая": 5,
  "июнь": 6, "июня": 6,
  "июль": 7, "июля": 7,
  "август": 8, "августа": 8,
  "сентябрь": 9, "сентября": 9,
  "октябрь": 10, "октября": 10,
  "ноябрь": 11, "ноября": 11,
  "декабрь": 12, "декабря": 12,
};

function parseMonth(raw: unknown): number | null {
  if (typeof raw === "number") return raw >= 1 && raw <= 12 ? raw : null;
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  // "май-июнь" or "май - июнь" — take first
  const first = s.split(/[\s\-–—,/]/).find(t => t.trim().length > 0) ?? "";
  return MONTH_RU[first] ?? null;
}

const CATEGORY_MAP: Record<string, Category> = {
  "губы": "LIPS",
  "глаза": "EYES",
  "лицо": "FACE",
  "брови": "BROWS",
  "ногти": "NAILS",
  "волосы": "HAIR",
  "аксессуары": "ACCESSORIES",
  "коллекции": "COLLECTIONS",
  "коллекции/другое": "COLLECTIONS",
  "коллекции / другое": "COLLECTIONS",
  "эксклюзив": "EXCLUSIVE",
  "уход": "CARE",
};

function parseCategory(raw: unknown): Category | null {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  return CATEGORY_MAP[s] ?? null;
}

const TOOL_MAP: Record<string, Tool> = {
  "крупный блогер": "KRUPNY",
  "крупная поддержка": "KRUPNY",
  "крупный": "KRUPNY",
  "свайп": "SWIPE",
  "посев": "POSEV",
};

function parseTool(raw: unknown): Tool | null {
  if (!raw) return null;
  return TOOL_MAP[String(raw).toLowerCase().trim()] ?? null;
}

function parsePlatform(url: string): { platform: Platform; handle: string } | null {
  const u = url.toLowerCase().trim();
  let m: RegExpMatchArray | null;
  if ((m = u.match(/tiktok\.com\/@?([\w.\-]+)/))) return { platform: "TIKTOK", handle: m[1] };
  if ((m = u.match(/instagram\.com\/([\w.\-]+)/))) return { platform: "INSTAGRAM", handle: m[1] };
  if ((m = u.match(/youtube\.com\/(?:@|c\/|channel\/|user\/)?([\w.\-]+)/))) return { platform: "YOUTUBE", handle: m[1] };
  if ((m = u.match(/vk\.com\/([\w.\-]+)/))) return { platform: "VK", handle: m[1] };
  if ((m = u.match(/t\.me\/([\w.\-]+)/))) return { platform: "TELEGRAM", handle: m[1] };
  // bare handle? "@something"
  if ((m = u.match(/^@([\w.\-]+)$/))) return { platform: "TIKTOK", handle: m[1] };
  return null;
}

function excelDateToMonth(serial: number): number | null {
  // Excel serial dates: 1 = 1900-01-01 (with bug). We need just the month.
  // 46160 ≈ 2026-05-15. Convert: days since 1899-12-30 (correcting bug).
  const ms = (serial - 25569) * 86400000;
  const d = new Date(ms);
  return d.getUTCMonth() + 1;
}

interface Stats {
  rowsProcessed: number;
  rowsImported: number;
  rowsSkipped: number;
  bloggersCreated: number;
  bloggersReused: number;
  skipReasons: Record<string, number>;
}

function bumpSkip(s: Stats, reason: string) {
  s.skipReasons[reason] = (s.skipReasons[reason] ?? 0) + 1;
  s.rowsSkipped += 1;
}

async function findOrCreateBlogger(
  name: string,
  platform: Platform,
  handle: string,
  cache: Map<string, string>,
): Promise<string> {
  const key = `${platform}:${handle}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const handleField = {
    TIKTOK: "handleTiktok",
    INSTAGRAM: "handleInstagram",
    TELEGRAM: "handleTelegram",
    VK: "handleVk",
    YOUTUBE: "handleYoutube",
  }[platform] as "handleTiktok";

  let blogger = await prisma.blogger.findFirst({ where: { [handleField]: handle } });
  if (!blogger) {
    // Try by canonical name as a fallback.
    blogger = await prisma.blogger.findFirst({ where: { canonicalName: name } });
  }
  if (blogger) {
    // Backfill handle if missing.
    if (!blogger[handleField as keyof typeof blogger]) {
      blogger = await prisma.blogger.update({
        where: { id: blogger.id },
        data: { [handleField]: handle },
      });
    }
    cache.set(key, blogger.id);
    return blogger.id;
  }

  // Avoid unique conflict on canonicalName.
  let canonical = name;
  let suffix = 2;
  while (await prisma.blogger.findUnique({ where: { canonicalName: canonical } })) {
    canonical = `${name} (${suffix++})`;
  }

  const created = await prisma.blogger.create({
    data: {
      canonicalName: canonical,
      level: "MID",
      [handleField]: handle,
    },
  });
  cache.set(key, created.id);
  return created.id;
}

async function processSheet(
  sheetName: string,
  brand: Brand,
  ws: XLSX.WorkSheet,
  cache: Map<string, string>,
  stats: Stats,
) {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  // Header keys vary — find them.
  if (rows.length === 0) return;
  const sample = rows[0];
  const keys = Object.keys(sample);
  const findKey = (...candidates: string[]): string | undefined => {
    for (const c of candidates) {
      const k = keys.find(k => k.toLowerCase().includes(c));
      if (k) return k;
    }
    return undefined;
  };
  const KEY_MONTH = findKey("месяц");
  const KEY_CAT = findKey("категори");
  const KEY_PRODUCT = findKey("продукт");
  const KEY_TOOL = findKey("инструмент");
  const KEY_NICK = findKey("ник");
  const KEY_DATE = findKey("дата");
  const KEY_URL = findKey("ссылк");

  if (!KEY_PRODUCT || !KEY_URL) {
    console.warn(`  [${sheetName}] missing required columns — skipping sheet`);
    return;
  }

  for (const row of rows) {
    stats.rowsProcessed += 1;

    const url = row[KEY_URL] ? String(row[KEY_URL]).trim() : "";
    if (!url) { bumpSkip(stats, "no url"); continue; }
    const product = row[KEY_PRODUCT] ? String(row[KEY_PRODUCT]).trim() : "";
    if (!product) { bumpSkip(stats, "no product"); continue; }

    const platformInfo = parsePlatform(url);
    if (!platformInfo) { bumpSkip(stats, "unknown platform"); continue; }
    const { platform, handle } = platformInfo;

    // Month determination
    let month: number | null = null;
    if (KEY_DATE && typeof row[KEY_DATE] === "number") {
      month = excelDateToMonth(row[KEY_DATE] as number);
    }
    if (!month && KEY_MONTH) {
      month = parseMonth(row[KEY_MONTH]);
    }
    if (!month) { bumpSkip(stats, "no month"); continue; }
    const date = new Date(Date.UTC(2026, month - 1, 15)); // middle of month as default day

    const category = KEY_CAT ? parseCategory(row[KEY_CAT]) : null;
    if (!category) { bumpSkip(stats, "no category"); continue; }
    const tool = KEY_TOOL ? parseTool(row[KEY_TOOL]) : null;
    if (!tool) { bumpSkip(stats, "no tool"); continue; }

    const nick = (KEY_NICK ? String(row[KEY_NICK] ?? "").trim() : "") || handle;

    const beforeCount = await prisma.blogger.count();
    const bloggerId = await findOrCreateBlogger(nick, platform, handle, cache);
    const afterCount = await prisma.blogger.count();
    if (afterCount > beforeCount) stats.bloggersCreated += 1;
    else stats.bloggersReused += 1;

    await prisma.placement.create({
      data: {
        date,
        brand,
        category,
        product,
        tool,
        platform,
        bloggerId,
        status: "PLANNED",
        postUrl: url,
      },
    });
    stats.rowsImported += 1;
  }
}

async function main() {
  const path = process.argv[2] ?? "uploads/PR_Градиент_общая.xlsx";
  console.log(`Reading ${path}...`);
  const wb = XLSX.readFile(path);

  const stats: Stats = {
    rowsProcessed: 0,
    rowsImported: 0,
    rowsSkipped: 0,
    bloggersCreated: 0,
    bloggersReused: 0,
    skipReasons: {},
  };
  const cache = new Map<string, string>();

  for (const [sheetName, brand] of Object.entries(SHEET_TO_BRAND)) {
    if (!wb.Sheets[sheetName]) {
      console.warn(`  ⚠ sheet "${sheetName}" not found, skipping`);
      continue;
    }
    console.log(`\n--- Sheet: ${sheetName} (brand=${brand}) ---`);
    const before = stats.rowsImported;
    await processSheet(sheetName, brand, wb.Sheets[sheetName], cache, stats);
    console.log(`  imported ${stats.rowsImported - before} rows from ${sheetName}`);
  }

  console.log(`\n========= Import summary =========`);
  console.log(`  rows processed:  ${stats.rowsProcessed}`);
  console.log(`  rows imported:   ${stats.rowsImported}`);
  console.log(`  rows skipped:    ${stats.rowsSkipped}`);
  console.log(`  bloggers new:    ${stats.bloggersCreated}`);
  console.log(`  bloggers reused: ${stats.bloggersReused}`);
  console.log(`  skip reasons:`, stats.skipReasons);

  const totalB = await prisma.blogger.count();
  const totalP = await prisma.placement.count();
  console.log(`\n  DB totals: ${totalB} bloggers, ${totalP} placements`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
