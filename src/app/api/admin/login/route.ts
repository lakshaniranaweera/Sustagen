import { NextRequest, NextResponse } from "next/server";
import { readDb, updateDb, hashPassword } from "@/lib/db";
import { makeToken, AUTH_COOKIE, isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// login
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const db = readDb();
  if (hashPassword(String(password ?? "")) !== db.adminPasswordHash) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, makeToken(db.adminPasswordHash), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

// check session
export async function GET() {
  return NextResponse.json({ authed: isAuthed() });
}

// logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

// change password
export async function PATCH(req: NextRequest) {
  if (!isAuthed())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { newPassword } = await req.json();
  if (!newPassword || String(newPassword).length < 4) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 });
  }
  const { db } = updateDb((db) => {
    db.adminPasswordHash = hashPassword(String(newPassword));
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, makeToken(db.adminPasswordHash), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
