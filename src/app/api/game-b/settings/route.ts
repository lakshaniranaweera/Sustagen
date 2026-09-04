import { NextRequest, NextResponse } from "next/server";
import { updateDb } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  if (!isAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { db } = updateDb((db) => {
    db.gameB = { ...db.gameB, ...body };
    db.gameB.durationSec = Math.max(5, Math.min(300, db.gameB.durationSec));
    db.gameB.sharpMindScore = Math.max(1, Math.min(999, db.gameB.sharpMindScore));
    if (!Array.isArray(db.gameB.targets) || db.gameB.targets.length < 2) {
      // guard against removing too many targets
    }
  });
  return NextResponse.json({ gameB: db.gameB });
}
