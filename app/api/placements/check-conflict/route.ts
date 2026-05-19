import { NextResponse } from "next/server";
import { checkConflictSchema } from "@/lib/schemas";
import { detectConflictsForTarget } from "@/lib/placement-conflict";

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = checkConflictSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.issues }, { status: 422 });
  }
  const result = await detectConflictsForTarget(parsed.data);
  return NextResponse.json(result);
}
