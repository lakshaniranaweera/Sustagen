import { NextRequest, NextResponse } from "next/server";
import { updateDb, newId } from "@/lib/db";
import type { CognitiveHit } from "@/lib/types";

export const dynamic = "force-dynamic";

// Public: store a completed cognitive-test session with reaction times.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const rawHits = Array.isArray(body.hits) ? body.hits : [];
  const hits: CognitiveHit[] = rawHits
    .map((h: any, i: number) => ({
      index: i,
      reactionMs: Math.max(0, Math.round(Number(h.reactionMs) || 0)),
      targetId: String(h.targetId ?? ""),
    }))
    .filter((h: CognitiveHit) => h.reactionMs > 0);

  const { db, result } = updateDb((db) => {
    const totalHits = hits.length;
    const times = hits.map((h) => h.reactionMs);
    const best = times.length ? Math.min(...times) : null;
    const avg = times.length
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : null;
    const passed = totalHits >= db.gameB.sharpMindScore;
    const session = {
      id: newId(),
      createdAt: new Date().toISOString(),
      totalHits,
      bestReactionMs: best,
      avgReactionMs: avg,
      passed,
      hits,
    };
    db.sessions.push(session);
    return session;
  });

  return NextResponse.json({ session: result, sessionCount: db.sessions.length });
}
