import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { placementCreateSchema } from "@/lib/schemas";
import { detectConflictsForTarget } from "@/lib/placement-conflict";
import { ymdToDate } from "@/lib/date";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const brand = searchParams.get("brand");
  const bloggerId = searchParams.get("bloggerId");

  const placements = await prisma.placement.findMany({
    where: {
      ...(from && to ? { date: { gte: ymdToDate(from), lte: ymdToDate(to) } } : {}),
      ...(brand ? { brand } : {}),
      ...(bloggerId ? { bloggerId } : {}),
    },
    include: { blogger: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ placements });
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = placementCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.issues }, { status: 422 });
  }
  const data = parsed.data;

  // Verify the brand exists and is not archived.
  const brand = await prisma.brand.findUnique({ where: { code: data.brand } });
  if (!brand) {
    return NextResponse.json({ error: `unknown brand: ${data.brand}` }, { status: 422 });
  }
  if (brand.isArchived) {
    return NextResponse.json({ error: `brand ${data.brand} is archived` }, { status: 422 });
  }

  const conflictResult = await detectConflictsForTarget({
    date: data.date,
    bloggerId: data.bloggerId,
    brand: data.brand,
    category: data.category,
    tool: data.tool,
    platform: data.platform,
  });

  if (conflictResult.hasConflict && !data.force) {
    return NextResponse.json({ error: "conflict", ...conflictResult }, { status: 409 });
  }

  const placement = await prisma.placement.create({
    data: {
      date: ymdToDate(data.date),
      brand: data.brand,
      category: data.category,
      product: data.product,
      bloggerId: data.bloggerId,
      tool: data.tool,
      platform: data.platform,
      postUrl: data.postUrl || null,
      status: data.status,
    },
    include: { blogger: true },
  });

  return NextResponse.json({ placement, conflict: conflictResult }, { status: 201 });
}
