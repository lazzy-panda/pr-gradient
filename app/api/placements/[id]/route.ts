import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { placementPatchSchema } from "@/lib/schemas";
import { detectConflictsForTarget } from "@/lib/placement-conflict";
import { ymdToDate } from "@/lib/date";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const placement = await prisma.placement.findUnique({
    where: { id },
    include: { blogger: true },
  });
  if (!placement) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ placement });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = placementPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.issues }, { status: 422 });
  }
  const patch = parsed.data;

  const current = await prisma.placement.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });

  // If brand is changing, verify the new brand exists and is not archived.
  if (patch.brand !== undefined && patch.brand !== current.brand) {
    const brand = await prisma.brand.findUnique({ where: { code: patch.brand } });
    if (!brand) return NextResponse.json({ error: `unknown brand: ${patch.brand}` }, { status: 422 });
    if (brand.isArchived) return NextResponse.json({ error: `brand ${patch.brand} is archived` }, { status: 422 });
  }

  const next = {
    date: patch.date ?? ymdToDateOrYmd(current.date),
    bloggerId: patch.bloggerId ?? current.bloggerId,
    brand: (patch.brand ?? current.brand) as Parameters<typeof detectConflictsForTarget>[0]["brand"],
    category: (patch.category ?? current.category) as Parameters<typeof detectConflictsForTarget>[0]["category"],
    tool: (patch.tool ?? current.tool) as Parameters<typeof detectConflictsForTarget>[0]["tool"],
    platform: (patch.platform ?? current.platform) as Parameters<typeof detectConflictsForTarget>[0]["platform"],
  };

  const conflictResult = await detectConflictsForTarget({ ...next, excludeId: id });

  if (conflictResult.hasConflict && !patch.force) {
    return NextResponse.json({ error: "conflict", ...conflictResult }, { status: 409 });
  }

  const placement = await prisma.placement.update({
    where: { id },
    data: {
      ...(patch.date !== undefined ? { date: ymdToDate(patch.date) } : {}),
      ...(patch.brand !== undefined ? { brand: patch.brand } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.product !== undefined ? { product: patch.product } : {}),
      ...(patch.bloggerId !== undefined ? { bloggerId: patch.bloggerId } : {}),
      ...(patch.tool !== undefined ? { tool: patch.tool } : {}),
      ...(patch.platform !== undefined ? { platform: patch.platform } : {}),
      ...(patch.postUrl !== undefined ? { postUrl: patch.postUrl || null } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
    },
    include: { blogger: true },
  });

  return NextResponse.json({ placement, conflict: conflictResult });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const placement = await prisma.placement.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ placement });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    if (message.includes("not found") || message.includes("RecordNotFound")) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function ymdToDateOrYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
