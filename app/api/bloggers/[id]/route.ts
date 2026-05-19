import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bloggerPatchSchema } from "@/lib/schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blogger = await prisma.blogger.findUnique({
    where: { id },
    include: { placements: { orderBy: { date: "desc" } } },
  });
  if (!blogger) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ blogger });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = bloggerPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.issues }, { status: 422 });
  }
  try {
    const blogger = await prisma.blogger.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ blogger });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    if (message.includes("Record to update not found") || message.includes("RecordNotFound")) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
