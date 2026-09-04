import { cookies } from "next/headers";
import { readDb } from "./db";

const COOKIE = "admin_session";

export function makeToken(hash: string): string {
  // token derived from password hash; invalidates when password changes
  return hash.slice(0, 24);
}

export function isAuthed(): boolean {
  const db = readDb();
  const token = cookies().get(COOKIE)?.value;
  return !!token && token === makeToken(db.adminPasswordHash);
}

export function requireAuth(): boolean {
  return isAuthed();
}

export const AUTH_COOKIE = COOKIE;
