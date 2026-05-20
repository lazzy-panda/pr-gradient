import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { brandPatchSchema } from "@/lib/schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const brand = await prisma.brand.findUnique({ where: { code } });
  if (!brand) return NextResponse.json({ error: "not found" }, { status: 404 });
  const placementCount = await prisma.placement.count({ where: { brand: code } });
  return NextResponse.json({ brand, placementCount });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = brandPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.issues }, { status: 422 });
  }
  try {
    const brand = await prisma.brand.update({ where: { code }, data: parsed.data });
    return NextResponse.json({ brand });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    if (message.includes("Record to update not found") || message.includes("RecordNotFound")) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
