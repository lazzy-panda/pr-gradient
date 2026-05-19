import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bloggerCreateSchema } from "@/lib/schemas";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const bloggers = await prisma.blogger.findMany({
    where: q
      ? {
          OR: [
            { canonicalName: { contains: q } },
            { handleTiktok: { contains: q } },
            { handleInstagram: { contains: q } },
            { handleTelegram: { contains: q } },
            { handleVk: { contains: q } },
            { handleYoutube: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { canonicalName: "asc" },
    take: q ? 30 : 500,
  });
  return NextResponse.json({ bloggers });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = bloggerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  try {
    const blogger = await prisma.blogger.create({ data: parsed.data });
    return NextResponse.json({ blogger }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    if (message.includes("Unique") || message.includes("UNIQUE")) {
      return NextResponse.json({ error: "blogger with this canonical name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
