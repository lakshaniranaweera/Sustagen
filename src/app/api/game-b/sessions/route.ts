import { NextRequest, NextResponse } from "next/server";
import { readDb, updateDb } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = readDb();
  const sessions = [...db.sessions].reverse();
  return NextResponse.json({ sessions, sessionCount: db.sessions.length });
}

// reset sessions (admin)
export async function DELETE() {
  if (!isAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  updateDb((db) => {
    db.sessions = [];
  });
  return NextResponse.json({ ok: true });
}
