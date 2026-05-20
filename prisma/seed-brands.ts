// Seed the 8 existing brands of the NTC "Gradient" holding.
// Idempotent — uses upsert keyed by `code`.
//
// Run: DATABASE_URL=... npx tsx prisma/seed-brands.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BRANDS_DATA = [
  { code: "VIVIENNE_SABO",      name: "Vivienne Sabó",      shortCode: "VS", color: "#B91C5C", sortOrder: 1 },
  { code: "STELLARY",           name: "Stellary",           shortCode: "ST", color: "#1D4ED8", sortOrder: 2 },
  { code: "INFLUENCE_BEAUTY",   name: "Influence Beauty",   shortCode: "IB", color: "#059669", sortOrder: 3 },
  { code: "BEAUTY_BOMB",        name: "Beauty Bomb",        shortCode: "BB", color: "#EC4899", sortOrder: 4 },
  { code: "LOVE_GENERATION",    name: "Love Generation",    shortCode: "LG", color: "#EA580C", sortOrder: 5 },
  { code: "ARTDECO",            name: "ARTDECO",            shortCode: "AD", color: "#374151", sortOrder: 6 },
  { code: "DEBORAH_MILANO",     name: "Deborah Milano",     shortCode: "DM", color: "#7C3AED", sortOrder: 7 },
  { code: "PHYSICIANS_FORMULA", name: "Physicians Formula", shortCode: "PF", color: "#0891B2", sortOrder: 8 },
];

async function main() {
  console.log(`Upserting ${BRANDS_DATA.length} brands...`);
  for (const b of BRANDS_DATA) {
    await prisma.brand.upsert({
      where: { code: b.code },
      update: {
        name: b.name,
        shortCode: b.shortCode,
        color: b.color,
        sortOrder: b.sortOrder,
        isHolding: true,
        isArchived: false,
      },
      create: { ...b, isHolding: true, isArchived: false },
    });
  }
  const total = await prisma.brand.count();
  console.log(`Done. Total brands in DB: ${total}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
