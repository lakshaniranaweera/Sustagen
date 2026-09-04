import { NextRequest, NextResponse } from "next/server";
import { updateDb, newId } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import type { WheelSegment } from "@/lib/types";

export const dynamic = "force-dynamic";

function sanitize(s: any, order: number): WheelSegment {
  const total = Math.max(0, Math.floor(Number(s.totalWinners) || 0));
  let remaining = Math.floor(Number(s.remainingWinners));
  if (isNaN(remaining)) remaining = total;
  remaining = Math.max(0, Math.min(remaining, total || remaining));
  return {
    id: typeof s.id === "string" && s.id ? s.id : newId(),
    name: String(s.name ?? "Prize").slice(0, 60),
    image: s.image ?? null,
    color: /^#[0-9a-fA-F]{3,8}$/.test(s.color) ? s.color : "#7c3aed",
    totalWinners: total,
    remainingWinners: remaining,
    active: s.active !== false,
    order,
  };
}

// Create a single segment
export async function POST(req: NextRequest) {
  if (!isAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { db } = updateDb((db) => {
    const order = db.segments.length;
    db.segments.push(sanitize(body, order));
  });
  return NextResponse.json({ segments: db.segments });
}

// Replace entire ordered list (edits + reordering in one shot)
export async function PUT(req: NextRequest) {
  if (!isAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!Array.isArray(body.segments)) {
    return NextResponse.json({ error: "segments array required" }, { status: 400 });
  }
  const { db } = updateDb((db) => {
    db.segments = body.segments.map((s: any, i: number) => sanitize(s, i));
  });
  return NextResponse.json({ segments: db.segments });
}
