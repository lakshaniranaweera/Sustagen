import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = readDb();
  const spins = [...db.spins].reverse(); // newest first
  return NextResponse.json({ spins, spinCount: db.spins.length });
}
