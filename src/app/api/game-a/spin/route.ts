import { NextResponse } from "next/server";
import { updateDb, newId } from "@/lib/db";
import { pickWeightedWinner, computeProbabilities } from "@/lib/weighted";

export const dynamic = "force-dynamic";

// Public: performs an authoritative weighted spin, decrements the winner,
// records it, and returns the result the wheel must animate to.
export async function POST() {
  const { db, result } = updateDb((db) => {
    if (db.gameA.status !== "running") {
      return { error: "Campaign is paused", code: 423 as const };
    }
    const winnerId = pickWeightedWinner(db.segments);
    if (!winnerId) {
      return { error: "No prizes remaining", code: 409 as const };
    }
    const seg = db.segments.find((s) => s.id === winnerId)!;
    seg.remainingWinners = Math.max(0, seg.remainingWinners - 1);
    if (seg.remainingWinners === 0) seg.active = false; // SOLD OUT

    const spin = {
      id: newId(),
      createdAt: new Date().toISOString(),
      segmentId: seg.id,
      segmentName: seg.name,
      remainingAfter: seg.remainingWinners,
    };
    db.spins.push(spin);
    return { winnerId, spin };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.code });
  }

  const segments = [...db.segments].sort((a, b) => a.order - b.order);
  return NextResponse.json({
    winnerId: result.winnerId,
    spin: result.spin,
    segments,
    probabilities: computeProbabilities(db.segments),
    spinCount: db.spins.length,
  });
}
