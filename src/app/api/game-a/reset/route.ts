import { NextRequest, NextResponse } from "next/server";
import { updateDb } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Action = "start" | "pause" | "reset-winners" | "reset-spins" | "reset-all";

export async function POST(req: NextRequest) {
  if (!isAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action } = (await req.json()) as { action: Action };

  const { db } = updateDb((db) => {
    switch (action) {
      case "start":
        db.gameA.status = "running";
        break;
      case "pause":
        db.gameA.status = "paused";
        break;
      case "reset-winners":
        db.segments = db.segments.map((s) => ({
          ...s,
          remainingWinners: s.totalWinners,
          active: s.totalWinners > 0,
        }));
        break;
      case "reset-spins":
        db.spins = [];
        break;
      case "reset-all":
        db.spins = [];
        db.segments = db.segments.map((s) => ({
          ...s,
          remainingWinners: s.totalWinners,
          active: s.totalWinners > 0,
        }));
        db.gameA.status = "running";
        break;
    }
  });
  return NextResponse.json({ ok: true, gameA: db.gameA, segments: db.segments });
}
