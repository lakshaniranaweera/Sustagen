import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { computeProbabilities } from "@/lib/weighted";

export const dynamic = "force-dynamic";

// Public game state consumed by the landing page and both games.
export async function GET() {
  const db = readDb();
  const segments = [...db.segments].sort((a, b) => a.order - b.order);
  return NextResponse.json({
    landing: db.landing,
    gameA: db.gameA,
    gameB: db.gameB,
    segments,
    probabilities: computeProbabilities(db.segments),
    spinCount: db.spins.length,
    sessionCount: db.sessions.length,
  });
}
