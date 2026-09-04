import { NextRequest, NextResponse } from "next/server";
import { updateDb } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { db } = updateDb((db) => {
    db.segments = db.segments
      .filter((s) => s.id !== params.id)
      .map((s, i) => ({ ...s, order: i }));
  });
  return NextResponse.json({ segments: db.segments });
}
