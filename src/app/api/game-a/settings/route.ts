import { NextRequest, NextResponse } from "next/server";
import { updateDb } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  if (!isAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { db } = updateDb((db) => {
    db.gameA = { ...db.gameA, ...body };
    // basic clamps
    db.gameA.spinDurationSec = Math.max(1, Math.min(20, db.gameA.spinDurationSec));
    db.gameA.rotations = Math.max(1, Math.min(20, db.gameA.rotations));
  });
  return NextResponse.json({ gameA: db.gameA });
}
