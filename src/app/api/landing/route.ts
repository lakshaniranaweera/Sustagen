import { NextRequest, NextResponse } from "next/server";
import { updateDb } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  if (!isAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { db } = updateDb((db) => {
    db.landing = { ...db.landing, ...body };
  });
  return NextResponse.json({ landing: db.landing });
}
