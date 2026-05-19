// Seed — порт BLOGGERS (25) + PLACEMENTS_SEED (38) из legacy-prototype/data.jsx.
// Канонические значения переведены на spec-enum'ы (русские категории/инструменты → enum).
//
// Запуск: npx tsx prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import type { Brand, Category, Tool, Platform } from "../lib/domain";

const prisma = new PrismaClient();

type Level = "TOP" | "MID" | "NANO";
type Status = "PLANNED" | "PUBLISHED" | "CANCELLED";

interface BloggerSeed {
  id: string;
  canonicalName: string;
  level: Level;
  handleTiktok?: string;
  handleVk?: string;
  handleTelegram?: string;
  handleInstagram?: string;
  handleYoutube?: string;
  contact?: string;
  notes?: string;
}

const BLOGGERS: BloggerSeed[] = [
  { id: "b01", canonicalName: "Полина Петухова", level: "TOP", handleTiktok: "pollinasha_", handleInstagram: "polinapt", handleTelegram: "polina_p", contact: "t.me/polina_p", notes: "Снимает быстро, не любит дедлайны." },
  { id: "b02", canonicalName: "Леля Зимина", level: "TOP", handleTiktok: "lelya.z", handleInstagram: "lelya.z", handleTelegram: "lelya_z", contact: "t.me/lelya_z" },
  { id: "b03", canonicalName: "Маша Городилова", level: "MID", handleTiktok: "mashagrd", handleInstagram: "masha.grd", handleTelegram: "mashagrd", contact: "@mashagrd", notes: "Запросы дороже среднего, но качество стабильное." },
  { id: "b04", canonicalName: "Дарина Эрвье", level: "TOP", handleInstagram: "darina.e", handleTelegram: "d_ervje", handleYoutube: "darinaervje", contact: "t.me/d_ervje" },
  { id: "b05", canonicalName: "Ясмин Юсупова", level: "MID", handleTiktok: "yasminyu", handleInstagram: "yasminyu", contact: "@yasminyu" },
  { id: "b06", canonicalName: "Аня Покров", level: "NANO", handleTiktok: "an.pokrov", handleInstagram: "an.pokrov", handleVk: "anpokrov", contact: "vk/anpokrov" },
  { id: "b07", canonicalName: "Соня Морошкина", level: "MID", handleTiktok: "sonya.m", handleInstagram: "sonya.m", handleTelegram: "sonyam", contact: "t.me/sonyam", notes: "Хорошо работает с beauty-инструментами." },
  { id: "b08", canonicalName: "Алина Карташова", level: "TOP", handleTiktok: "alinakart", handleInstagram: "alinakart", handleTelegram: "alinakart", handleYoutube: "alinakart", contact: "t.me/alinakart" },
  { id: "b09", canonicalName: "Вика Степанюк", level: "MID", handleTiktok: "vstepanyuk", handleInstagram: "vstep", contact: "@vstep" },
  { id: "b10", canonicalName: "Лиза Багрова", level: "NANO", handleTiktok: "lizabag", handleInstagram: "lizabag", contact: "@lizabag" },
  { id: "b11", canonicalName: "Катя Самбурская", level: "TOP", handleTiktok: "katyasmb", handleInstagram: "katyasmb", handleTelegram: "katyasmb", contact: "t.me/katyasmb" },
  { id: "b12", canonicalName: "Настя Ивлеева", level: "TOP", handleInstagram: "ivleeva", handleTelegram: "ivleeva", handleYoutube: "ivleeva", contact: "t.me/ivleeva" },
  { id: "b13", canonicalName: "Юля Топольницкая", level: "MID", handleTiktok: "yulia.top", handleInstagram: "yulia.top", contact: "@yulia.top" },
  { id: "b14", canonicalName: "Рита Дакота", level: "TOP", handleTiktok: "ritadakota", handleInstagram: "ritadakota", handleYoutube: "ritadakota", contact: "t.me/ritadakota" },
  { id: "b15", canonicalName: "Зоя Бербер", level: "MID", handleTiktok: "zoya.b", handleInstagram: "zoya.b", handleTelegram: "zoya_b", contact: "t.me/zoya_b" },
  { id: "b16", canonicalName: "Аглая Шиловская", level: "MID", handleTiktok: "aglaya.sh", handleInstagram: "aglayash", contact: "@aglayash" },
  { id: "b17", canonicalName: "Ника Бачева", level: "NANO", handleTiktok: "nika.bachi", handleInstagram: "nika.bachi", contact: "@nika.bachi" },
  { id: "b18", canonicalName: "Олеся Малинская", level: "MID", handleTiktok: "olesya.m", handleInstagram: "olesya.m", handleVk: "olesyam", contact: "vk/olesyam" },
  { id: "b19", canonicalName: "Тася Соломатина", level: "NANO", handleTiktok: "tasya.s", handleInstagram: "tasya.s", contact: "@tasya.s" },
  { id: "b20", canonicalName: "Маргарита Мокшина", level: "NANO", handleTiktok: "rita.mk", handleInstagram: "rita.mk", contact: "@rita.mk" },
  { id: "b21", canonicalName: "Влада Жукова", level: "MID", handleTiktok: "vladaz", handleInstagram: "vladaz", contact: "@vladaz" },
  { id: "b22", canonicalName: "Ника Сухоруких", level: "TOP", handleTiktok: "nika.suh", handleInstagram: "nika.suh", handleTelegram: "nikasuh", contact: "t.me/nikasuh" },
  { id: "b23", canonicalName: "Эвелина Янко", level: "NANO", handleTiktok: "evelinay", handleInstagram: "evelinay", contact: "@evelinay" },
  { id: "b24", canonicalName: "Анфиса Дю", level: "MID", handleTiktok: "anfisa.du", handleInstagram: "anfisa.du", contact: "@anfisa.du" },
  { id: "b25", canonicalName: "Стася Милославская", level: "TOP", handleInstagram: "stasiamilo", handleTelegram: "stasiamilo", contact: "t.me/stasiamilo" },
];

interface PlacementSeed {
  id: string;
  day: number; // May 2026
  bloggerId: string;
  brand: Brand;
  category: Category;
  product: string;
  tool: Tool;
  platform: Platform;
  status: Status;
}

const PLACEMENTS: PlacementSeed[] = [
  { id: "p001", day: 18, bloggerId: "b01", brand: "INFLUENCE_BEAUTY", category: "LIPS", product: "Glossy Lip Volume", tool: "KRUPNY", platform: "TIKTOK", status: "PLANNED" },
  { id: "p002", day: 18, bloggerId: "b01", brand: "VIVIENNE_SABO", category: "LIPS", product: "Муссовые помады MUSE", tool: "KRUPNY", platform: "TIKTOK", status: "PLANNED" },
  { id: "p003", day: 10, bloggerId: "b01", brand: "STELLARY", category: "FACE", product: "Skin Glow база", tool: "SWIPE", platform: "INSTAGRAM", status: "PUBLISHED" },
  { id: "p004", day: 3, bloggerId: "b01", brand: "BEAUTY_BOMB", category: "EYES", product: "Eye Bomb палетка", tool: "POSEV", platform: "INSTAGRAM", status: "PUBLISHED" },
  { id: "p005", day: 7, bloggerId: "b02", brand: "STELLARY", category: "FACE", product: "Stellary тон-флюид", tool: "SWIPE", platform: "TIKTOK", status: "PLANNED" },
  { id: "p006", day: 15, bloggerId: "b02", brand: "VIVIENNE_SABO", category: "EYES", product: "Тушь Cabaret", tool: "KRUPNY", platform: "TIKTOK", status: "PLANNED" },
  { id: "p007", day: 6, bloggerId: "b03", brand: "BEAUTY_BOMB", category: "EYES", product: "Eye Bomb палетка", tool: "SWIPE", platform: "INSTAGRAM", status: "PLANNED" },
  { id: "p008", day: 10, bloggerId: "b03", brand: "BEAUTY_BOMB", category: "EYES", product: "Bomb Mascara", tool: "SWIPE", platform: "INSTAGRAM", status: "PLANNED" },
  { id: "p009", day: 8, bloggerId: "b04", brand: "INFLUENCE_BEAUTY", category: "FACE", product: "IB Glow Base", tool: "KRUPNY", platform: "YOUTUBE", status: "PLANNED" },
  { id: "p010", day: 14, bloggerId: "b04", brand: "LOVE_GENERATION", category: "BROWS", product: "LG Brow Sculptor", tool: "KRUPNY", platform: "YOUTUBE", status: "PLANNED" },
  { id: "p011", day: 11, bloggerId: "b05", brand: "BEAUTY_BOMB", category: "LIPS", product: "Glow Lips", tool: "POSEV", platform: "TIKTOK", status: "PLANNED" },
  { id: "p012", day: 4, bloggerId: "b07", brand: "PHYSICIANS_FORMULA", category: "FACE", product: "Healthy Wear SPF", tool: "SWIPE", platform: "INSTAGRAM", status: "PUBLISHED" },
  { id: "p013", day: 13, bloggerId: "b07", brand: "DEBORAH_MILANO", category: "LIPS", product: "Milano Lipstick", tool: "SWIPE", platform: "INSTAGRAM", status: "PLANNED" },
  { id: "p014", day: 22, bloggerId: "b07", brand: "ARTDECO", category: "EYES", product: "AD Eyeliner", tool: "KRUPNY", platform: "INSTAGRAM", status: "PLANNED" },
  { id: "p015", day: 5, bloggerId: "b08", brand: "VIVIENNE_SABO", category: "FACE", product: "VS Tonalité", tool: "KRUPNY", platform: "YOUTUBE", status: "PUBLISHED" },
  { id: "p016", day: 20, bloggerId: "b08", brand: "DEBORAH_MILANO", category: "EYES", product: "Milano Smoky", tool: "KRUPNY", platform: "YOUTUBE", status: "PLANNED" },
  { id: "p017", day: 2, bloggerId: "b09", brand: "LOVE_GENERATION", category: "LIPS", product: "LG Velvet Matte", tool: "POSEV", platform: "TIKTOK", status: "PUBLISHED" },
  { id: "p018", day: 9, bloggerId: "b09", brand: "PHYSICIANS_FORMULA", category: "EYES", product: "PF Mineral Wear", tool: "SWIPE", platform: "TIKTOK", status: "PLANNED" },
  { id: "p019", day: 24, bloggerId: "b09", brand: "INFLUENCE_BEAUTY", category: "BROWS", product: "IB Brow Pencil", tool: "SWIPE", platform: "TIKTOK", status: "PLANNED" },
  { id: "p020", day: 12, bloggerId: "b10", brand: "BEAUTY_BOMB", category: "NAILS", product: "BB Nail Polish", tool: "POSEV", platform: "TIKTOK", status: "PLANNED" },
  { id: "p021", day: 6, bloggerId: "b11", brand: "ARTDECO", category: "FACE", product: "AD Hydra Base", tool: "KRUPNY", platform: "INSTAGRAM", status: "PUBLISHED" },
  { id: "p022", day: 19, bloggerId: "b11", brand: "STELLARY", category: "EYES", product: "Stellary Eyeshadow", tool: "KRUPNY", platform: "INSTAGRAM", status: "PLANNED" },
  { id: "p023", day: 16, bloggerId: "b12", brand: "VIVIENNE_SABO", category: "LIPS", product: "VS Cabaret Lips", tool: "KRUPNY", platform: "INSTAGRAM", status: "PLANNED" },
  { id: "p024", day: 19, bloggerId: "b12", brand: "DEBORAH_MILANO", category: "LIPS", product: "DM Milano Lip", tool: "KRUPNY", platform: "INSTAGRAM", status: "PLANNED" },
  { id: "p025", day: 8, bloggerId: "b13", brand: "LOVE_GENERATION", category: "FACE", product: "LG Skin Tint", tool: "POSEV", platform: "TIKTOK", status: "PLANNED" },
  { id: "p026", day: 21, bloggerId: "b13", brand: "INFLUENCE_BEAUTY", category: "EYES", product: "IB Lash Plumper", tool: "POSEV", platform: "TIKTOK", status: "PLANNED" },
  { id: "p027", day: 3, bloggerId: "b14", brand: "PHYSICIANS_FORMULA", category: "FACE", product: "PF Powder", tool: "KRUPNY", platform: "YOUTUBE", status: "PUBLISHED" },
  { id: "p028", day: 17, bloggerId: "b14", brand: "BEAUTY_BOMB", category: "EYES", product: "BB Liner", tool: "KRUPNY", platform: "YOUTUBE", status: "PLANNED" },
  { id: "p029", day: 11, bloggerId: "b15", brand: "DEBORAH_MILANO", category: "BROWS", product: "DM Brow Fix", tool: "SWIPE", platform: "INSTAGRAM", status: "PLANNED" },
  { id: "p030", day: 25, bloggerId: "b15", brand: "STELLARY", category: "FACE", product: "Stellary Foundation", tool: "SWIPE", platform: "INSTAGRAM", status: "PLANNED" },
  { id: "p031", day: 13, bloggerId: "b16", brand: "VIVIENNE_SABO", category: "EYES", product: "VS Liner Cabaret", tool: "POSEV", platform: "TIKTOK", status: "PLANNED" },
  { id: "p032", day: 27, bloggerId: "b16", brand: "LOVE_GENERATION", category: "LIPS", product: "LG Lip Gloss", tool: "SWIPE", platform: "TIKTOK", status: "PLANNED" },
  { id: "p033", day: 5, bloggerId: "b17", brand: "ARTDECO", category: "BROWS", product: "AD Brow Kit", tool: "POSEV", platform: "INSTAGRAM", status: "PUBLISHED" },
  { id: "p034", day: 14, bloggerId: "b18", brand: "PHYSICIANS_FORMULA", category: "NAILS", product: "PF Nail Strengthener", tool: "POSEV", platform: "TIKTOK", status: "PLANNED" },
  { id: "p035", day: 7, bloggerId: "b19", brand: "INFLUENCE_BEAUTY", category: "FACE", product: "IB Bronzer", tool: "POSEV", platform: "TIKTOK", status: "PLANNED" },
  { id: "p036", day: 20, bloggerId: "b21", brand: "BEAUTY_BOMB", category: "EYES", product: "BB Mascara", tool: "SWIPE", platform: "INSTAGRAM", status: "PLANNED" },
  { id: "p037", day: 28, bloggerId: "b22", brand: "VIVIENNE_SABO", category: "FACE", product: "VS Foundation", tool: "KRUPNY", platform: "YOUTUBE", status: "PLANNED" },
  { id: "p038", day: 26, bloggerId: "b24", brand: "STELLARY", category: "BROWS", product: "Stellary Brow Wax", tool: "SWIPE", platform: "TIKTOK", status: "PLANNED" },
];

function dayToDate(day: number): Date {
  return new Date(Date.UTC(2026, 4, day)); // May 2026
}

async function main() {
  console.log("Wiping existing data...");
  await prisma.placement.deleteMany({});
  await prisma.blogger.deleteMany({});

  console.log(`Seeding ${BLOGGERS.length} bloggers...`);
  for (const b of BLOGGERS) {
    await prisma.blogger.create({
      data: {
        id: b.id,
        canonicalName: b.canonicalName,
        level: b.level,
        handleTiktok: b.handleTiktok ?? null,
        handleVk: b.handleVk ?? null,
        handleTelegram: b.handleTelegram ?? null,
        handleInstagram: b.handleInstagram ?? null,
        handleYoutube: b.handleYoutube ?? null,
        contact: b.contact ?? null,
        notes: b.notes ?? null,
      },
    });
  }

  console.log(`Seeding ${PLACEMENTS.length} placements...`);
  for (const p of PLACEMENTS) {
    await prisma.placement.create({
      data: {
        id: p.id,
        date: dayToDate(p.day),
        brand: p.brand,
        category: p.category,
        product: p.product,
        tool: p.tool,
        platform: p.platform,
        status: p.status,
        bloggerId: p.bloggerId,
        postUrl: null,
      },
    });
  }

  const b = await prisma.blogger.count();
  const p = await prisma.placement.count();
  console.log(`Done. ${b} bloggers, ${p} placements.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
