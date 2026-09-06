// ---------- Daily / end-of-day reporting ----------
// Plays are logged with `createdAt` (ISO). We group them into business days
// using a configurable day-start hour, so a kiosk running past midnight still
// attributes plays to the right day.

import type { AppState, WheelSpin, CognitiveGameSession } from "./types";

/** Business-day key ("YYYY-MM-DD") for an ISO timestamp, offset by dayStartHour. */
export function dayKey(iso: string, dayStartHour = 0): string {
  const d = new Date(iso);
  d.setHours(d.getHours() - dayStartHour);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(dayStartHour = 0): string {
  return dayKey(new Date().toISOString(), dayStartHour);
}

export interface WheelDayReport {
  day: string;
  totalSpins: number;
  perGift: { name: string; count: number }[];
}

export interface ReflexDayReport {
  day: string;
  totalSessions: number;
  sharpMinds: number;
}

/** Group wheel spins by business day, with per-gift issued counts. */
export function wheelDailyReports(
  spins: WheelSpin[],
  dayStartHour = 0
): WheelDayReport[] {
  const byDay = new Map<string, Map<string, number>>();
  for (const sp of spins) {
    const k = dayKey(sp.createdAt, dayStartHour);
    if (!byDay.has(k)) byDay.set(k, new Map());
    const gifts = byDay.get(k)!;
    gifts.set(sp.segmentName, (gifts.get(sp.segmentName) || 0) + 1);
  }
  return [...byDay.entries()]
    .map(([day, gifts]) => ({
      day,
      totalSpins: [...gifts.values()].reduce((a, b) => a + b, 0),
      perGift: [...gifts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => (a.day < b.day ? 1 : -1)); // newest first
}

/** Group reflex sessions by business day. */
export function reflexDailyReports(
  sessions: CognitiveGameSession[],
  dayStartHour = 0
): ReflexDayReport[] {
  const byDay = new Map<string, { total: number; sharp: number }>();
  for (const s of sessions) {
    const k = dayKey(s.createdAt, dayStartHour);
    const acc = byDay.get(k) || { total: 0, sharp: 0 };
    acc.total += 1;
    if (s.passed) acc.sharp += 1;
    byDay.set(k, acc);
  }
  return [...byDay.entries()]
    .map(([day, v]) => ({
      day,
      totalSessions: v.total,
      sharpMinds: v.sharp,
    }))
    .sort((a, b) => (a.day < b.day ? 1 : -1));
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Flat CSV covering both games, one row per gift/day and per reflex day. */
export function buildCsv(state: AppState): string {
  const rows: (string | number)[][] = [
    ["Game", "Day", "Metric", "Detail", "Count"],
  ];
  for (const r of wheelDailyReports(state.spins, state.gameA.dayStartHour)) {
    rows.push(["Spin Wheel", r.day, "Total Spins", "", r.totalSpins]);
    for (const g of r.perGift) {
      rows.push(["Spin Wheel", r.day, "Gift Issued", g.name, g.count]);
    }
  }
  for (const r of reflexDailyReports(state.sessions, state.gameB.dayStartHour)) {
    rows.push(["Reflex Test", r.day, "Total Plays", "", r.totalSessions]);
    rows.push(["Reflex Test", r.day, "Sharp Minds", "", r.sharpMinds]);
  }
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

/** Trigger a client-side CSV download. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
