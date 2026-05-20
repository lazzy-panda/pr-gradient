import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { brandCreateSchema } from "@/lib/schemas";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const brands = await prisma.brand.findMany({
    where: includeArchived ? undefined : { isArchived: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ brands });
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = brandCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.issues }, { status: 422 });
  }
  try {
    const brand = await prisma.brand.create({ data: parsed.data });
    return NextResponse.json({ brand }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    if (message.includes("Unique") || message.includes("UNIQUE")) {
      return NextResponse.json({ error: "brand with this code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
